import React, { useEffect, useMemo } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList, GalleryItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useProStore } from '../store/useProStore';
import { useChallengeStore } from '../store/useChallengeStore';
import StreakBadge from '../components/StreakBadge';
import ProBadge from '../components/ProBadge';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { t } from '../i18n';
import { trackEvent } from '../services/analytics';

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
  const credits = useProStore((s) => s.credits);

  useEffect(() => {
    trackEvent('stats_viewed');
  }, []);

  // Top 5 styles bar chart data
  const topStyles = useMemo(() => {
    const map: Record<string, number> = {};
    gallery.forEach((item: GalleryItem) => {
      map[item.styleId] = (map[item.styleId] || 0) + 1;
    });
    return Object.entries(map)
      .map(([styleId, count]) => ({ styleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [gallery]);

  const maxCount = topStyles.length > 0 ? topStyles[0].count : 1;

  // Creation timeline (last 7 days)
  const last7Days = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      const count = gallery.filter((item: GalleryItem) => item.createdAt.startsWith(dateStr)).length;
      days.push({ label, count });
    }
    return days;
  }, [gallery]);

  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  // Average creations per day
  const avgPerDay = useMemo(() => {
    if (gallery.length === 0) return 0;
    const dates = gallery.map((item: GalleryItem) => new Date(item.createdAt).getTime());
    const earliest = Math.min(...dates);
    const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - earliest) / (1000 * 60 * 60 * 24)));
    return (gallery.length / daysSinceFirst).toFixed(1);
  }, [gallery]);

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
      color: colors.textPrimary,
      ...typography.h3,
      marginBottom: spacing.md,
      marginTop: spacing.lg,
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
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
    barLabel: { width: 80, color: colors.textSecondary, ...typography.caption },
    barTrack: { flex: 1, height: 12, backgroundColor: colors.surfaceLight, borderRadius: 6, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 6 },
    barValue: { width: 30, textAlign: 'right', color: colors.textPrimary, ...typography.caption },
    chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginTop: spacing.md },
    chartColumn: { flex: 1, alignItems: 'center' },
    chartBarContainer: { width: 20, height: 100, justifyContent: 'flex-end', backgroundColor: colors.surfaceLight, borderRadius: 4, overflow: 'hidden' },
    chartBar: { width: '100%', borderRadius: 4, minHeight: 2 },
    chartDayLabel: { marginTop: 4, color: colors.textMuted, ...typography.small },
    proGradientCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    proGradientText: { ...typography.bodyBold, color: '#FFFFFF' },
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
            <Text style={styles.backText}>{'\u2190'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('stats.title')}</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Pro status */}
        {entitlement.proActive && (
          <LinearGradient
            colors={[...colors.gradientPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proGradientCard}
          >
            <View style={styles.proRow}>
              <ProBadge />
              <Text style={styles.proGradientText}>{t('stats.proMember')}</Text>
            </View>
          </LinearGradient>
        )}

        {/* Streak section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.challengeStreaks')}</Text>
          <StreakBadge currentStreak={currentStreak} longestStreak={longestStreak} />
        </View>

        {/* Creation stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.creations')}</Text>
          <StatRow label={t('stats.totalCreations')} value={String(creationCount)} />
          <StatRow label={t('stats.gallerySize')} value={String(gallery.length)} />
          <StatRow label={t('stats.favorites')} value={String(favorites.length)} />
          <StatRow label={t('stats.collections')} value={String(collections.length)} />
          <StatRow label={t('stats.avgPerDay')} value={String(avgPerDay)} />
        </View>

        {/* Generation stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.generations')}</Text>
          <StatRow label={t('stats.successfulGenerations')} value={String(successfulGenerations)} />
          <StatRow label={t('stats.creditsRemaining')} value={String(credits)} />
          <StatRow label={t('stats.challengesCompleted')} value={String(completions.length)} />
        </View>

        {/* Top 5 Styles Bar Chart */}
        {topStyles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('stats.topStyles')}</Text>
            {topStyles.map(({ styleId, count }) => (
              <View style={styles.barRow} key={styleId}>
                <Text style={styles.barLabel}>{styleId}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(count / maxCount) * 100}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={styles.barValue}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Creation Timeline (Last 7 Days) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.creationTimeline')}</Text>
          <View style={styles.chartContainer}>
            {last7Days.map(({ label, count }) => (
              <View style={styles.chartColumn} key={label}>
                <View style={styles.chartBarContainer}>
                  <View style={[styles.chartBar, { height: `${(count / maxDayCount) * 100}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={styles.chartDayLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Style breakdown */}
        {styleBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('stats.styleBreakdown')}</Text>
            {styleBreakdown.map(([name, count]) => (
              <StatRow key={name} label={name} value={String(count)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
