import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { t } from '../i18n';

interface CoachMarkProps {
  markId: string;
  title: string;
  description: string;
  targetRef: React.RefObject<View>;
  position?: 'above' | 'below';
  onDismiss?: () => void;
}

const ARROW_SIZE = 8;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CoachMark({
  markId,
  title,
  description,
  targetRef,
  position = 'below',
  onDismiss,
}: CoachMarkProps) {
  const { colors } = useTheme();
  const hasSeenCoachMark = useAppStore((s) => s.hasSeenCoachMark);
  const dismissCoachMark = useAppStore((s) => s.dismissCoachMark);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(position === 'below' ? -8 : 8)).current;
  const [targetLayout, setTargetLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasSeenCoachMark(markId)) return;

    const timer = setTimeout(() => {
      if (!targetRef.current) {
        setVisible(true);
        return;
      }
      targetRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        setTargetLayout({ x: pageX, y: pageY, width, height });
        setVisible(true);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [markId, hasSeenCoachMark, targetRef]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  const handleDismiss = () => {
    triggerHaptic('light');
    dismissCoachMark(markId);
    trackEvent('coach_mark_dismissed', { markId });
    setVisible(false);
    onDismiss?.();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        tooltip: {
          backgroundColor: colors.primary,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          maxWidth: SCREEN_WIDTH - spacing.xl * 2,
          minWidth: 200,
        },
        title: {
          ...typography.bodyBold,
          color: '#FFFFFF',
          marginBottom: spacing.xs,
        },
        description: {
          ...typography.caption,
          color: 'rgba(255,255,255,0.9)',
          marginBottom: spacing.md,
          lineHeight: 18,
        },
        dismissBtn: {
          alignSelf: 'flex-end',
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: borderRadius.md,
        },
        dismissText: {
          ...typography.bodyBold,
          color: '#FFFFFF',
          fontSize: 13,
        },
        arrowDown: {
          width: 0,
          height: 0,
          borderLeftWidth: ARROW_SIZE,
          borderRightWidth: ARROW_SIZE,
          borderTopWidth: ARROW_SIZE,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.primary,
          alignSelf: 'center',
        },
        arrowUp: {
          width: 0,
          height: 0,
          borderLeftWidth: ARROW_SIZE,
          borderRightWidth: ARROW_SIZE,
          borderBottomWidth: ARROW_SIZE,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: colors.primary,
          alignSelf: 'center',
        },
      }),
    [colors],
  );

  if (hasSeenCoachMark(markId) || !visible) {
    return null;
  }

  const tooltipStyle: Record<string, number | string> = {
    position: 'absolute' as const,
  };

  if (targetLayout) {
    const tooltipWidth = Math.min(SCREEN_WIDTH - spacing.xl * 2, 280);
    let left = targetLayout.x + targetLayout.width / 2 - tooltipWidth / 2;
    left = Math.max(spacing.md, Math.min(left, SCREEN_WIDTH - tooltipWidth - spacing.md));
    tooltipStyle.left = left;
    tooltipStyle.width = tooltipWidth;

    if (position === 'below') {
      tooltipStyle.top = targetLayout.y + targetLayout.height + ARROW_SIZE + 4;
    } else {
      tooltipStyle.bottom =
        Dimensions.get('window').height - targetLayout.y + ARROW_SIZE + 4;
    }
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <Animated.View
          style={[
            tooltipStyle,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          {position === 'below' && <View style={styles.arrowUp} />}
          <View style={styles.tooltip}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
              <Text style={styles.dismissText}>{t('coachMark.dismiss')}</Text>
            </TouchableOpacity>
          </View>
          {position === 'above' && <View style={styles.arrowDown} />}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
