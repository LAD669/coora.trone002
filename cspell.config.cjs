module.exports = {
  version: '0.2',
  language: 'en,de',
  words: [
    // Project specific terms
    'Coora',
    'cooraforsport',
    'playerboard',
    'infohub',
    'zugangscode',
    'termintitel',
    'anmelden',
    'registrieren',
    'abmelden',
    'speichern',
    'abbrechen',
    'kalender',
    'einstellungen',
    'benachrichtigungen',
    'datenschutz',
    'sicherheit',
    'präferenzen',
    
    // Technical terms
    'supabase',
    'expo',
    'react',
    'typescript',
    'javascript',
    'tsx',
    'jsx',
    'tailwind',
    'i18n',
    'i18next',
    'lucide',
    
    // Common abbreviations
    'auth',
    'config',
    'env',
    'api',
    'ui',
    'ux',
    'qa',
    'css',
    'html',
    'dom',
    'json',
    'xml',
    'svg',
    'png',
    'jpg',
    'jpeg',
    'webp',
    
    // Development terms
    'eslint',
    'prettier',
    'husky',
    'commitlint',
    'jest',
    'testid',
    'mockito',
    'webpack',
    'babel',
    'metro',
    'bundler',
    
    // Mobile development
    'ios',
    'android',
    'xcode',
    'gradle',
    'podfile',
    'xcworkspace',
    'xcodeproj',
    'storyboard',
    'plist',
    'entitlements',
    'pbxproj',
    
    // German specific words
    'jjjj',
    'mm',
    'tt',
    'hh',
    'uhr',
    'von',
    'bis',
    'für',
    'mit',
    'ohne',
    'über',
    'unter',
    'durch',
    'gegen',
    'während',
    'wegen',
    'trotz',
    'statt',
    'außer',
    'seit',
    'nach',
    'vor',
    'zwischen',
    'neben',
    'hinter',
    'über',
    'unter',
    'auf',
    'an',
    'in',
    'zu',
    'bei'
  ],
  flagWords: [
    // Common typos
    'hte',
    'teh',
    'recieve',
    'seperate',
    'occured',
    'accomodate',
    'neccessary',
    'occurence',
    'begining',
    'writting',
    'comming',
    'runing',
    'geting',
    'puting',
    'makeing',
    'takeing',
    'giveing',
    'liveing',
    'moveing',
    'useing',
    'loveing',
    'hopeing',
    'careing',
    'shareing',
    'dareing',
    'rareing',
    'wareing',
    'bareing',
    'pareing',
    'stareing',
    'spareing',
    'prepareing'
  ],
  ignorePaths: [
    'node_modules/**',
    'build/**',
    'dist/**',
    '.git/**',
    'android/build/**',
    'ios/build/**',
    '*.lock',
    '*.log',
    '.expo/**',
    '.vscode/**',
    '.idea/**'
  ],
  ignoreRegExpList: [
    // Ignore import statements
    /import\s+.*\s+from\s+['"][^'"]*['"]/g,
    // Ignore require statements  
    /require\s*\(\s*['"][^'"]*['"]\s*\)/g,
    // Ignore URLs
    /https?:\/\/[^\s]*/g,
    // Ignore file paths
    /\/[^\s]*\.[a-zA-Z0-9]+/g,
    // Ignore hex colors
    /#[0-9a-fA-F]{3,8}/g,
    // Ignore UUIDs
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
    // Ignore base64
    /[A-Za-z0-9+/]{20,}={0,2}/g,
    // Ignore version numbers
    /\d+\.\d+\.\d+/g,
    // Ignore email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ],
  overrides: [
    {
      filename: '**/*.{ts,tsx,js,jsx}',
      languageSettings: [
        {
          languageId: 'typescript',
          locale: 'en'
        },
        {
          languageId: 'javascript', 
          locale: 'en'
        }
      ]
    },
    {
      filename: '**/translations/de.json',
      languageSettings: [
        {
          languageId: 'json',
          locale: 'de'
        }
      ]
    },
    {
      filename: '**/translations/en.json',
      languageSettings: [
        {
          languageId: 'json',
          locale: 'en'
        }
      ]
    },
    {
      filename: '**/*.md',
      languageSettings: [
        {
          languageId: 'markdown',
          locale: 'en'
        }
      ]
    }
  ]
};
