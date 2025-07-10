import { Platform } from 'react-native';

// iOS Typography System
export const Typography = {
  // Font Family
  fontFamily: Platform.select({
    ios: 'San Francisco',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Font Weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.3,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.75,
  },
  
  // Typography Styles
  styles: {
    // Headers
    largeTitle: {
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 41,
    },
    title1: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
    },
    title2: {
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 28,
    },
    title3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 25,
    },
    
    // Body Text
    headline: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
    },
    body: {
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
    },
    bodyEmphasized: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
    },
    
    // Secondary Text
    subheadline: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 20,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 13,
    },
  },
}; 