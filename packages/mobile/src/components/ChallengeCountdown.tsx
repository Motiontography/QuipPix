import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '../styles/theme';

function getTimeUntilMidnight(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function ChallengeCountdown() {
  const [time, setTime] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={styles.countdown}>
      New challenge in {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
    </Text>
  );
}

const styles = StyleSheet.create({
  countdown: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
