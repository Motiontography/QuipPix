import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  PanResponder,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { triggerHaptic } from '../services/haptics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 100;

export interface BottomSheetAction {
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'destructive';
  disabled?: boolean;
}

interface BottomSheetProps {
  visible: boolean;
  title?: string;
  actions: BottomSheetAction[];
  onClose: () => void;
  children?: React.ReactNode;
}

export function BottomSheet({
  visible,
  title,
  actions,
  onClose,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      triggerHaptic('light');
      if (reduceMotion) {
        translateY.setValue(0);
        backdropOpacity.setValue(1);
      } else {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 65,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      if (reduceMotion) {
        translateY.setValue(SCREEN_HEIGHT);
        backdropOpacity.setValue(0);
      } else {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [visible, reduceMotion, translateY, backdropOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD) {
          onClose();
        } else {
          if (reduceMotion) {
            translateY.setValue(0);
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }).start();
          }
        }
      },
    }),
  ).current;

  const variantColor = (variant: string) => {
    if (variant === 'destructive') return colors.error;
    if (variant === 'primary') return colors.primary;
    return colors.textPrimary;
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, transform: [{ translateY }] },
        ]}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
        </View>

        {/* Title */}
        {title && (
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        )}

        {/* Custom children */}
        {children}

        {/* Action rows */}
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              action.onPress();
              onClose();
            }}
            disabled={action.disabled}
            style={[
              styles.actionRow,
              { borderBottomColor: colors.surfaceLight },
              action.disabled && styles.actionDisabled,
            ]}
          >
            {action.icon && <Text style={styles.actionIcon}>{action.icon}</Text>}
            <Text
              style={[
                styles.actionLabel,
                { color: variantColor(action.variant || 'default') },
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Cancel button */}
        <TouchableOpacity onPress={onClose} style={styles.cancelRow}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
            {t('bottomSheet.cancel')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    ...typography.h3,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionLabel: {
    ...typography.body,
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelText: {
    ...typography.bodyBold,
  },
});
