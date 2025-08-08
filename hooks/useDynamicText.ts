import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo } from 'react';

interface UseDynamicTextOptions {
  fallbackText?: string;
  interpolation?: Record<string, any>;
  maxLength?: number;
  preserveLayout?: boolean;
}

export function useDynamicText(
  translationKey: string,
  options: UseDynamicTextOptions = {}
) {
  const { tSafe, hasTranslation, getTextLength } = useLanguage();
  const { fallbackText, interpolation, maxLength, preserveLayout = false } = options;

  const translatedText = useMemo(() => {
    const text = hasTranslation(translationKey)
      ? tSafe(translationKey, interpolation)
      : fallbackText || translationKey;

    // Apply max length if specified
    if (maxLength && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }

    return text;
  }, [translationKey, fallbackText, interpolation, maxLength, hasTranslation, tSafe]);

  const textLength = useMemo(() => {
    return getTextLength(translationKey, interpolation);
  }, [translationKey, interpolation, getTextLength]);

  const needsLayoutAdjustment = useMemo(() => {
    if (!preserveLayout) return false;
    
    // Check if text is significantly longer than expected
    const expectedLength = 20; // Average English text length
    return textLength > expectedLength * 1.5;
  }, [textLength, preserveLayout]);

  const layoutStyles = useMemo(() => {
    if (!needsLayoutAdjustment) return {};

    return {
      fontSize: textLength > 100 ? 12 : 14,
      lineHeight: textLength > 100 ? 16 : 18,
      minHeight: 20, // Ensure minimum height
    };
  }, [needsLayoutAdjustment, textLength]);

  return {
    text: translatedText,
    textLength,
    needsLayoutAdjustment,
    layoutStyles,
    hasTranslation: hasTranslation(translationKey),
  };
}
