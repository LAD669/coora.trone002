#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Denylist of forbidden placeholder words (case-insensitive)
const DENYLIST = [
  'lorem ipsum', 'dolor sit amet', 'dummy',
  'foobar', 'foo bar', 'foo', 'bar', 'baz',
  'todo', 'tbd', 'wip', 'xxx', 'asdf', 'qwerty',
  'sample', 'example text', 'mock text',
  'delete me', 'remove me', 'temp text',
  'under construction'
];

// Context-specific denylist for different file types
const CONTEXT_DENYLIST = {
  // For translation files, "placeholder" is acceptable in key names
  'translations': ['lorem ipsum', 'dolor sit amet', 'dummy', 'foobar', 'foo bar', 'foo', 'bar', 'baz', 'todo', 'tbd', 'wip', 'xxx', 'asdf', 'qwerty', 'sample', 'example text', 'mock text', 'delete me', 'remove me', 'temp text', 'under construction'],
  // For component files, "placeholder" is acceptable in React props
  'components': ['lorem ipsum', 'dolor sit amet', 'dummy', 'foobar', 'foo bar', 'foo', 'bar', 'baz', 'todo', 'tbd', 'wip', 'xxx', 'asdf', 'qwerty', 'sample', 'example text', 'mock text', 'delete me', 'remove me', 'temp text', 'under construction']
};

// Regex for duplicate words (e.g., "CancelCancel", "TitleTitle")
const DUPLICATE_WORDS_REGEX = /\b(\w+)(\s*\1)+\b/g;

// File extensions to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', '.expo'];

// Directories to scan
const SCAN_DIRS = ['app', 'src', 'translations', 'components', 'contexts', 'hooks', 'lib'];

let foundIssues = [];

function shouldScanFile(filePath) {
  const ext = extname(filePath);
  return SCAN_EXTENSIONS.includes(ext);
}

function shouldScanDirectory(dirPath) {
  const dirName = dirPath.split('/').pop();
  return !EXCLUDE_DIRS.includes(dirName);
}

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Determine context-specific denylist
    let activeDenylist = DENYLIST;
    if (filePath.includes('translations/')) {
      activeDenylist = CONTEXT_DENYLIST.translations;
    } else if (filePath.includes('components/') || filePath.includes('app/')) {
      activeDenylist = CONTEXT_DENYLIST.components;
    }
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const lowerLine = line.toLowerCase();
      
      // Skip lines that are clearly not user-facing text
      if (isTechnicalLine(line)) {
        return;
      }
      
      // Check for denylist words
      activeDenylist.forEach(word => {
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(line)) {
          foundIssues.push({
            file: filePath,
            line: lineNumber,
            type: 'denylist',
            word: word,
            content: line.trim()
          });
        }
      });
      
      // Check for duplicate words (only in user-facing text)
      if (isUserFacingText(line)) {
        const duplicateMatches = line.match(DUPLICATE_WORDS_REGEX);
        if (duplicateMatches) {
          duplicateMatches.forEach(match => {
            foundIssues.push({
              file: filePath,
              line: lineNumber,
              type: 'duplicate',
              word: match,
              content: line.trim()
            });
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
}

function isTechnicalLine(line) {
  const lowerLine = line.toLowerCase();
  
  // Skip hex color codes
  if (lowerLine.includes('#') && /#[0-9a-f]{3,6}/i.test(line)) {
    return true;
  }
  
  // Skip CSS/styling properties
  if (lowerLine.includes('color:') || lowerLine.includes('backgroundcolor:') || 
      lowerLine.includes('bordercolor:') || lowerLine.includes('shadowcolor:')) {
    return true;
  }
  
  // Skip import statements
  if (lowerLine.startsWith('import ') || lowerLine.startsWith('export ')) {
    return true;
  }
  
  // Skip comments
  if (lowerLine.trim().startsWith('//') || lowerLine.trim().startsWith('/*')) {
    return true;
  }
  
  // Skip numeric values
  if (/^\s*[\d\s,\.\-]+\s*$/.test(line.trim())) {
    return true;
  }
  
  // Skip file paths and URLs
  if (lowerLine.includes('/') && (lowerLine.includes('.') || lowerLine.includes('http'))) {
    return true;
  }
  
  // Skip date/time format placeholders (legitimate)
  if (line.includes('YYYY') || line.includes('MM') || line.includes('DD') || 
      line.includes('HH') || line.includes('mm') || line.includes('JJJJ') || 
      line.includes('TT')) {
    return true;
  }
  
  return false;
}

function isUserFacingText(line) {
  const lowerLine = line.toLowerCase();
  
  // Check if line contains user-facing text patterns
  if (lowerLine.includes('title') || lowerLine.includes('label') || 
      lowerLine.includes('placeholder') || lowerLine.includes('text')) {
    return true;
  }
  
  // Check if line is inside JSX text content
  if (line.includes('>') && line.includes('<') && !isTechnicalLine(line)) {
    return true;
  }
  
  return false;
}

function scanDirectory(dirPath) {
  try {
    const items = readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (shouldScanDirectory(itemPath)) {
          scanDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        if (shouldScanFile(itemPath)) {
          scanFile(itemPath);
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

function main() {
  console.log('🔍 Scanning for placeholder/unrelated words...\n');
  
  // Scan specified directories
  SCAN_DIRS.forEach(dir => {
    try {
      if (statSync(dir).isDirectory()) {
        scanDirectory(dir);
      }
    } catch (error) {
      // Directory doesn't exist, skip it
      console.log(`⚠️  Directory ${dir} not found, skipping...`);
    }
  });
  
  if (foundIssues.length === 0) {
    console.log('✅ No placeholder/unrelated words found!');
    process.exit(0);
  }
  
  console.log(`❌ Found ${foundIssues.length} issues:\n`);
  
  // Group issues by file
  const issuesByFile = {};
  foundIssues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  // Display issues
  Object.keys(issuesByFile).forEach(file => {
    console.log(`📁 ${file}:`);
    issuesByFile[file].forEach(issue => {
      const type = issue.type === 'denylist' ? '🚫' : '🔄';
      console.log(`  ${type} Line ${issue.line}: "${issue.word}"`);
      console.log(`     ${issue.content}`);
    });
    console.log('');
  });
  
  console.log('💡 Please remove or replace these placeholder/unrelated words with proper i18n keys.');
  process.exit(1);
}

main();
