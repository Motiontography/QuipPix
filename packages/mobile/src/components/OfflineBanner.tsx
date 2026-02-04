import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getQueueCount } from '../services/offlineQueue';
import { spacing, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function OfflineBanner() {
  const { colors } = useTheme();
  const { isConnected } = useNetworkStatus();
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      getQueueCount().then(setQueuedCount);
    }
  }, [isConnected]);

  const styles = useMemo(() => StyleSheet.create({
    banner: {
      backgroundColor: colors.warning + '20',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
    },
    text: {
      ...typography.caption,
      color: colors.warning,
    },
  }), [colors]);

  if (isConnected) return null;

  const queueMsg = queuedCount > 0
    ? ` \u2014 ${queuedCount} generation${queuedCount > 1 ? 's' : ''} queued`
    : '';

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline{queueMsg}</Text>
    </View>
  );
}
