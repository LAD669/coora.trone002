import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useDynamicText } from '@/hooks/useDynamicText';

interface DynamicTextProps extends TextProps {
  translationKey: string;
  fallbackText?: string;
  maxLines?: number;
  allowFontScaling?: boolean;
  // Layout preservation options
  minWidth?: number;
  maxWidth?: number;
  preserveHeight?: boolean;
  preserveLayout?: boolean;
  // Translation options
  interpolation?: Record<string, any>;
}

export default function DynamicText({
  translationKey,
  fallbackText,
  maxLines,
  allowFontScaling = true,
  minWidth,
  maxWidth,
  preserveHeight = false,
  preserveLayout = false,
  interpolation,
  style,
  ...props
}: DynamicTextProps) {
  const {
    text: translatedText,
    needsLayoutAdjustment,
    layoutStyles,
  } = useDynamicText(translationKey, {
    fallbackText,
    interpolation,
    preserveLayout,
  });

  // Create dynamic styles based on text length and layout requirements
  const dynamicStyles = [
    styles.base,
    needsLayoutAdjustment && layoutStyles,
    preserveHeight && styles.preserveHeight,
    minWidth && { minWidth },
    maxWidth && { maxWidth },
    style
  ];

  return (
    <Text
      style={dynamicStyles}
      numberOfLines={maxLines}
      allowFontScaling={allowFontScaling}
      {...props}
    >
      {translatedText}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Urbanist-Regular',
    color: '#1A1A1A',
  },
  preserveHeight: {
    minHeight: 20, // Ensure minimum height for consistent layout
  },
});
