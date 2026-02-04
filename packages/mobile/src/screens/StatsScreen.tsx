import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, GalleryItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useProStore } from '../store/useProStore';
import { useChallengeStore } from '../store/useChallengeStore';
import StreakBadge from '../components/StreakBadge';
import ProBadge from '../components/ProBadge';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Stats'>;

export default function StatsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();

  const gallery = useAppStore((s) => s.gallery);
  const creationCount = useAppStore((s) => s.creationCount);
  const favorites = useAppStore((s) => s.favorites);
  const collections = useAppStore((s) => s.collections);

  const currentStreak = useChallengeStore((s) => s.currentStreak);
  const longestStreak = useChallengeStore((s) => s.longestStreak);
  const completions = useChallengeStore((s) => s.completions);

  const entitlement = useProStore((s) => s.entitlement);
  const successfulGenerations = useProStore((s) => s.successfulGenerations);
  const dailyGenerations = useProStore((s) => s.dailyGenerations);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.md },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    backText: { ...typography.body, color: colors.primary },
    title: { ...typography.h2, color: colors.textPrimary },
    proRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    proLabel: { ...typography.bodyBold, color: colors.primaryLight },
    section: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyBold,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceLight,
    },
    statLabel: { ...typography.body, color: colors.textSecondary },
    statValue: { ...typography.bodyBold, color: colors.textPrimary },
  }), [colors]);

  function StatRow({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    );
  }

  const styleBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    gallery.forEach((item: GalleryItem) => {
      map[item.styleName] = (map[item.styleName] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [gallery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{'\u2190'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Your Stats</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Pro status */}
        {entitlement.proActive && (
          <View style={styles.proRow}>
            <ProBadge />
            <Text style={styles.proLabel}>
              {entitlement.proType === 'lifetime'
                ? 'Lifetime'
                : entitlement.proType === 'annual'
                ? 'Annual'
                : 'Monthly'}{' '}
              Member
            </Text>
          </View>
        )}

        {/* Streak section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge Streaks</Text>
          <StreakBadge currentStreak={currentStreak} longestStreak={longestStreak} />
        </View>

        {/* Creation stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creations</Text>
          <StatRow label="Total Creations" value={String(creationCount)} />
          <StatRow label="Gallery Size" value={String(gallery.length)} />
          <StatRow label="Favorites" value={String(favorites.length)} />
          <StatRow label="Collections" value={String(collections.length)} />
        </View>

        {/* Generation stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generations</Text>
          <StatRow label="Successful Generations" value={String(successfulGenerations)} />
          <StatRow label="Used Today" value={String(dailyGenerations)} />
          <StatRow label="Challenges Completed" value={String(completions.length)} />
        </View>

        {/* Style breakdown */}
        {styleBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Style Breakdown</Text>
            {styleBreakdown.map(([name, count]) => (
              <StatRow key={name} label={name} value={String(count)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
