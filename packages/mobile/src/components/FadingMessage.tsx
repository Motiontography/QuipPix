import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../styles/theme';

interface FadingMessageProps {
  messages: string[];
  interval?: number;
  reduceMotion?: boolean;
  textStyle?: TextStyle;
}

export function FadingMessage({
  messages,
  interval = 4000,
  reduceMotion = false,
  textStyle,
}: FadingMessageProps) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      if (reduceMotion) {
        setIndex((prev) => (prev + 1) % messages.length);
      } else {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIndex((prev) => (prev + 1) % messages.length);
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [messages.length, interval, reduceMotion, opacity]);

  return (
    <Animated.Text
      style={[
        styles.text,
        { color: colors.textSecondary, opacity: reduceMotion ? 1 : opacity },
        textStyle,
      ]}
    >
      {messages[index]}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...typography.body,
    textAlign: 'center',
  },
});
