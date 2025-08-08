import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet } from 'react-native';
import DynamicText from './DynamicText';

interface DynamicButtonProps extends TouchableOpacityProps {
  translationKey: string;
  fallbackText?: string;
  // Layout preservation options
  minWidth?: number;
  maxWidth?: number;
  preserveHeight?: boolean;
  // Translation options
  interpolation?: Record<string, any>;
  // Button styling
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export default function DynamicButton({
  translationKey,
  fallbackText,
  minWidth,
  maxWidth,
  preserveHeight = false,
  interpolation,
  variant = 'primary',
  size = 'medium',
  style,
  ...props
}: DynamicButtonProps) {
  // Get button styles based on variant and size
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    preserveHeight && styles.preserveHeight,
    minWidth && { minWidth },
    maxWidth && { maxWidth },
    style
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      activeOpacity={0.7}
      {...props}
    >
      <DynamicText
        translationKey={translationKey}
        fallbackText={fallbackText}
        interpolation={interpolation}
        style={styles.buttonText}
        allowFontScaling={false}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  // Variants
  primary: {
    backgroundColor: '#1A1A1A',
  },
  secondary: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  small: {
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingVertical: 16,
    minHeight: 52,
  },
  preserveHeight: {
    minHeight: 44, // Ensure consistent height across languages
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
    color: '#FFFFFF',
  },
});
