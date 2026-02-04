import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import {
  ScrollView,
  Image,
  View,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Platform,
} from 'react-native';

export interface ZoomableImageHandle {
  resetZoom: () => void;
}

interface ZoomableImageProps {
  uri: string;
  style?: ViewStyle;
  minZoom?: number;
  maxZoom?: number;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

const ZoomableImage = forwardRef<ZoomableImageHandle, ZoomableImageProps>(
  ({ uri, style, minZoom = 1, maxZoom = 3, children, accessibilityLabel }, ref) => {
    const scrollRef = useRef<ScrollView>(null);
    const lastTapTimestamp = useRef<number>(0);
    const lastTapX = useRef<number>(0);
    const lastTapY = useRef<number>(0);
    const currentZoom = useRef<number>(1);
    const containerWidth = useRef<number>(0);
    const containerHeight = useRef<number>(0);

    useImperativeHandle(ref, () => ({
      resetZoom: () => {
        if (scrollRef.current) {
          (scrollRef.current as any).scrollResponderZoomTo({
            x: 0,
            y: 0,
            width: containerWidth.current,
            height: containerHeight.current,
            animated: false,
          });
          currentZoom.current = 1;
        }
      },
    }));

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        currentZoom.current = event.nativeEvent.zoomScale;
      },
      [],
    );

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      containerWidth.current = width;
      containerHeight.current = height;
    }, []);

    const handleTouchEnd = useCallback(
      (event: any) => {
        const now = Date.now();
        const touch = event.nativeEvent;
        const { pageX, pageY } = touch;

        const timeDiff = now - lastTapTimestamp.current;
        const xDiff = Math.abs(pageX - lastTapX.current);
        const yDiff = Math.abs(pageY - lastTapY.current);

        if (timeDiff < 300 && xDiff < 20 && yDiff < 20) {
          // Double-tap detected
          if (currentZoom.current > 1) {
            // Zoomed in - reset to 1
            (scrollRef.current as any)?.scrollResponderZoomTo({
              x: 0,
              y: 0,
              width: containerWidth.current,
              height: containerHeight.current,
              animated: true,
            });
          } else {
            // At zoom 1 - zoom in
            const targetZoom = maxZoom / 2;
            const zoomWidth = containerWidth.current / targetZoom;
            const zoomHeight = containerHeight.current / targetZoom;

            if (Platform.OS === 'ios') {
              (scrollRef.current as any)?.scrollResponderZoomTo({
                x: pageX - zoomWidth / 2,
                y: pageY - zoomHeight / 2,
                width: zoomWidth,
                height: zoomHeight,
                animated: true,
              });
            } else {
              (scrollRef.current as any)?.scrollResponderZoomTo({
                x: 0,
                y: 0,
                width: containerWidth.current / targetZoom,
                height: containerHeight.current / targetZoom,
                animated: true,
              });
            }
          }

          // Reset timestamp to avoid triple-tap firing again
          lastTapTimestamp.current = 0;
        } else {
          lastTapTimestamp.current = now;
          lastTapX.current = pageX;
          lastTapY.current = pageY;
        }
      },
      [maxZoom],
    );

    return (
      <ScrollView
        ref={scrollRef}
        style={style}
        contentContainerStyle={styles.content}
        maximumZoomScale={maxZoom}
        minimumZoomScale={minZoom}
        bouncesZoom={true}
        centerContent={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={handleLayout}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="image"
        />
        {children && <View style={styles.overlay}>{children}</View>}
      </ScrollView>
    );
  },
);

ZoomableImage.displayName = 'ZoomableImage';

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});

export default ZoomableImage;
