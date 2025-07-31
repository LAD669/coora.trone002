// Simple plural rules implementation for our supported languages
const pluralRules = {
  en: {
    plurals: (count: number) => {
      return count === 1 ? 'one' : 'other';
    }
  },
  de: {
    plurals: (count: number) => {
      return count === 1 ? 'one' : 'other';
    }
  }
};

export const getPluralForm = (language: string, count: number) => {
  const rules = pluralRules[language as keyof typeof pluralRules];
  return rules ? rules.plurals(count) : 'other';
}; 