import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Placeholder Guard Tests', () => {
  // Denylist of forbidden placeholder words (case-insensitive)
  const DENYLIST = [
    'lorem ipsum', 'dolor sit amet', 'placeholder', 'dummy',
    'foobar', 'foo bar', 'foo', 'bar', 'baz',
    'todo', 'tbd', 'wip', 'xxx', 'asdf', 'qwerty',
    'sample', 'example text', 'mock text',
    'delete me', 'remove me', 'temp text',
    'coming soon', 'under construction'
  ];

  // Regex for duplicate words (e.g., "CancelCancel", "TitleTitle")
  const DUPLICATE_WORDS_REGEX = /\b(\w+)(\s*\1)+\b/g;

  it('should not contain denylist words in translation files', () => {
    const translationFiles = [
      'translations/en.json',
      'translations/de.json'
    ];

    translationFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf8');
      const lowerContent = content.toLowerCase();
      
      DENYLIST.forEach(word => {
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(content)) {
          throw new Error(`Translation file ${filePath} contains denylist word: "${word}"`);
        }
      });
    });
  });

  it('should not contain duplicate words in translation files', () => {
    const translationFiles = [
      'translations/en.json',
      'translations/de.json'
    ];

    translationFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const duplicateMatches = line.match(DUPLICATE_WORDS_REGEX);
        if (duplicateMatches) {
          throw new Error(`Translation file ${filePath} contains duplicate words on line ${index + 1}: "${duplicateMatches.join(', ')}"`);
        }
      });
    });
  });

  it('should pass placeholder scan script', () => {
    try {
      execSync('npm run scan:placeholders', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
      throw new Error(`Placeholder scan failed:\n${output}`);
    }
  });

  it('should have proper sentence case in English translations', () => {
    const content = readFileSync('translations/en.json', 'utf8');
    const translations = JSON.parse(content);
    
    // Check common UI text patterns
    const uiTexts = [
      translations.auth?.signIn,
      translations.auth?.signUp,
      translations.common?.save,
      translations.common?.cancel,
      translations.calendar?.actions?.schedule,
      translations.calendar?.actions?.save,
      translations.calendar?.actions?.cancel
    ].filter(Boolean);

    uiTexts.forEach(text => {
      // Should not start with uppercase unless it's a proper noun
      if (text && text.length > 1 && text[0] === text[0].toUpperCase() && text[1] === text[1].toUpperCase()) {
        throw new Error(`English translation should use sentence case: "${text}"`);
      }
    });
  });

  it('should have proper German capitalization', () => {
    const content = readFileSync('translations/de.json', 'utf8');
    const translations = JSON.parse(content);
    
    // Check common UI text patterns
    const uiTexts = [
      translations.auth?.signIn,
      translations.auth?.signUp,
      translations.common?.save,
      translations.common?.cancel,
      translations.calendar?.actions?.schedule,
      translations.calendar?.actions?.save,
      translations.calendar?.actions?.cancel
    ].filter(Boolean);

    uiTexts.forEach(text => {
      // German nouns should be capitalized
      if (text && text.includes('speichern') && text[0] !== 'S') {
        throw new Error(`German translation should capitalize nouns: "${text}"`);
      }
    });
  });

  it('should not have trailing periods on buttons/labels', () => {
    const translationFiles = [
      'translations/en.json',
      'translations/de.json'
    ];

    translationFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf8');
      const translations = JSON.parse(content);
      
      // Check button/label texts
      const buttonTexts = [
        translations.auth?.signIn,
        translations.auth?.signUp,
        translations.common?.save,
        translations.common?.cancel,
        translations.calendar?.actions?.schedule,
        translations.calendar?.actions?.save,
        translations.calendar?.actions?.cancel
      ].filter(Boolean);

      buttonTexts.forEach(text => {
        if (text && text.endsWith('.')) {
          throw new Error(`Button/label text should not end with period: "${text}"`);
        }
      });
    });
  });
});
