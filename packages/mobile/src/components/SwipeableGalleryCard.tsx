import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { triggerHaptic } from '../services/haptics';
import { spacing, borderRadius, typography } from '../styles/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;

interface SwipeableGalleryCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  reduceMotion?: boolean;
  onSwipeOpen?: () => void;
}

export function SwipeableGalleryCard({
  children,
  onDelete,
  onToggleFavorite,
  isFavorite,
  reduceMotion = false,
  onSwipeOpen,
}: SwipeableGalleryCardProps) {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const hasTriggeredHaptic = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20,
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
        if (
          !hasTriggeredHaptic.current &&
          Math.abs(gestureState.dx) > SWIPE_THRESHOLD
        ) {
          hasTriggeredHaptic.current = true;
          triggerHaptic('medium');
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        hasTriggeredHaptic.current = false;
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swiped left - show delete
          snapTo(-SWIPE_THRESHOLD);
          onSwipeOpen?.();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swiped right - show favorite
          snapTo(SWIPE_THRESHOLD);
          onSwipeOpen?.();
        } else {
          snapTo(0);
        }
      },
    }),
  ).current;

  function snapTo(value: number) {
    if (reduceMotion) {
      translateX.setValue(value);
    } else {
      Animated.spring(translateX, {
        toValue: value,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  }

  function handleDelete() {
    snapTo(0);
    onDelete();
  }

  function handleFavorite() {
    snapTo(0);
    onToggleFavorite();
  }

  return (
    <View style={styles.container}>
      {/* Left action - Favorite */}
      <View style={[styles.action, styles.leftAction, { backgroundColor: colors.warning }]}>
        <TouchableOpacity onPress={handleFavorite} style={styles.actionButton}>
          <Text style={styles.actionIcon}>{isFavorite ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>

      {/* Right action - Delete */}
      <View style={[styles.action, styles.rightAction, { backgroundColor: colors.error }]}>
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Text style={styles.actionIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Card content */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.card, transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  action: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  leftAction: {
    left: 0,
  },
  rightAction: {
    right: 0,
  },
  actionButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
  },
  card: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
});
