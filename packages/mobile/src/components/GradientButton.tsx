import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, typography } from '../styles/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'dark';
  disabled?: boolean;
  loading?: boolean;
  size?: 'default' | 'small' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function GradientButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'default',
  style,
  textStyle,
}: GradientButtonProps) {
  const { colors } = useTheme();

  const gradientMap = {
    primary: colors.gradientPrimary,
    accent: colors.gradientAccent,
    dark: colors.gradientDark,
  };
  const gradientColors = [...gradientMap[variant]];

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16 },
    default: { paddingVertical: 14, paddingHorizontal: 24 },
    large: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  const fontSizes = {
    small: 14,
    default: 16,
    large: 18,
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.gradient,
        sizeStyles[size],
        disabled && styles.disabled,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              { fontSize: fontSizes[size] },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: typography.bodyBold.fontWeight,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
