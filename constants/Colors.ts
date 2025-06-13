/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional theme colors
    secondaryText: '#666',
    tertiaryText: '#999',
    cardBackground: '#fff',
    screenBackground: '#f5f5f5',
    shadow: '#000',
    error: '#ff4444',
    success: '#4CAF50',
    border: '#e0e0e0',
    placeholder: '#ccc',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Additional theme colors
    secondaryText: '#B0B0B0',
    tertiaryText: '#808080',
    cardBackground: '#2A2A2A',
    screenBackground: '#1A1A1A',
    shadow: '#000',
    error: '#ff6b6b',
    success: '#66BB6A',
    border: '#404040',
    placeholder: '#666',
  },
};
