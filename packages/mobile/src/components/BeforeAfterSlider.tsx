import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  PanResponder,
  Text,
  LayoutChangeEvent,
} from 'react-native';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  originalUri: string;
  resultUri: string;
}

export default function BeforeAfterSlider({ originalUri, resultUri }: Props) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(300);
  const [sliderX, setSliderX] = useState(150);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const clamped = Math.max(0, Math.min(containerWidth, touchX));
        setSliderX(clamped);
      },
    }),
  ).current;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
    setSliderX(width / 2);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      position: 'relative',
    },
    fullImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    clipContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      overflow: 'hidden',
    },
    divider: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: colors.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.textPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    handleIcon: {
      color: colors.background,
      fontSize: 12,
      fontWeight: '700',
    },
    labelLeft: {
      position: 'absolute',
      bottom: spacing.sm,
      left: spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    labelRight: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    labelText: {
      ...typography.small,
      color: colors.textPrimary,
    },
  }), [colors]);

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Result image (full background) */}
      <Image source={{ uri: resultUri }} style={styles.fullImage} resizeMode="cover" />

      {/* Original image clipped to slider position */}
      <View style={[styles.clipContainer, { width: sliderX }]}>
        <Image
          source={{ uri: originalUri }}
          style={[styles.fullImage, { width: containerWidth }]}
          resizeMode="cover"
        />
      </View>

      {/* Divider line */}
      <View style={[styles.divider, { left: sliderX - 1 }]}>
        <View style={styles.handle}>
          <Text style={styles.handleIcon}>{'< >'}</Text>
        </View>
      </View>

      {/* Labels */}
      <View style={styles.labelLeft}>
        <Text style={styles.labelText}>Before</Text>
      </View>
      <View style={styles.labelRight}>
        <Text style={styles.labelText}>After</Text>
      </View>
    </View>
  );
}
