import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  RootStackParamList,
  DailyChallenge,
  ChallengeCompletion,
} from '../types';
import { api } from '../api/client';
import { getStylePack } from '../services/stylePacks';
import { useChallengeStore } from '../store/useChallengeStore';
import { trackEvent } from '../services/analytics';
import StreakBadge from '../components/StreakBadge';
import ChallengeCountdown from '../components/ChallengeCountdown';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DIFFICULTY_COLORS = {
  easy: colors.success,
  medium: colors.warning,
  hard: colors.error,
};

export default function ChallengesScreen() {
  const navigation = useNavigation<Nav>();
  const {
    completions,
    currentStreak,
    longestStreak,
    hasCompletedToday,
    loadChallengeState,
  } = useChallengeStore();

  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await api.getTodayChallenge();
      setChallenge(res.challenge);
      setTotalSubmissions(res.totalSubmissions);
    } catch {
      // Fallback: still show UI without server data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChallengeState();
    fetchChallenge();
  }, [fetchChallenge, loadChallengeState]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChallenge();
  }, [fetchChallenge]);

  const handleAcceptChallenge = useCallback(async () => {
    if (!challenge) return;

    trackEvent('challenge_accepted', {
      challengeId: challenge.id,
      styleId: challenge.suggestedStyleId,
    });

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 2048,
      maxHeight: 2048,
    });

    if (result.assets?.[0]?.uri) {
      navigation.navigate('StyleSelect', {
        imageUri: result.assets[0].uri,
        challengeId: challenge.id,
        preselectedStyleId: challenge.suggestedStyleId,
      });
    }
  }, [challenge, navigation]);

  const handleTakePhoto = useCallback(async () => {
    if (!challenge) return;

    trackEvent('challenge_accepted', {
      challengeId: challenge.id,
      styleId: challenge.suggestedStyleId,
      source: 'camera',
    });

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 2048,
      maxHeight: 2048,
    });

    if (result.assets?.[0]?.uri) {
      navigation.navigate('StyleSelect', {
        imageUri: result.assets[0].uri,
        challengeId: challenge.id,
        preselectedStyleId: challenge.suggestedStyleId,
      });
    }
  }, [challenge, navigation]);

  const completedToday = hasCompletedToday();

  // Recent completions for history (last 7)
  const recentCompletions = completions.slice(0, 7);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading today's challenge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentCompletions}
        keyExtractor={(item) => item.challengeId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Daily Challenge</Text>
              <ChallengeCountdown />
            </View>

            {/* Streak */}
            <View style={styles.section}>
              <StreakBadge
                currentStreak={currentStreak}
                longestStreak={longestStreak}
              />
            </View>

            {/* Today's Challenge Card */}
            {challenge && (
              <View style={styles.challengeCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>{challenge.icon}</Text>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>{challenge.title}</Text>
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.difficultyBadge,
                          { backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + '30' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyText,
                            { color: DIFFICULTY_COLORS[challenge.difficulty] },
                          ]}
                        >
                          {challenge.difficulty}
                        </Text>
                      </View>
                      {totalSubmissions > 0 && (
                        <Text style={styles.submissionCount}>
                          {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.cardDesc}>{challenge.description}</Text>

                <View style={styles.promptBox}>
                  <Text style={styles.promptLabel}>Creative Prompt</Text>
                  <Text style={styles.promptText}>{challenge.creativePrompt}</Text>
                </View>

                <View style={styles.styleHint}>
                  <Text style={styles.styleHintLabel}>Suggested Style:</Text>
                  <Text style={styles.styleHintValue}>
                    {getStylePack(challenge.suggestedStyleId).displayName}{' '}
                    {getStylePack(challenge.suggestedStyleId).icon}
                  </Text>
                </View>

                <Text style={styles.hashtag}>{challenge.hashtag}</Text>

                {/* Actions */}
                {completedToday ? (
                  <View style={styles.completedBanner}>
                    <Text style={styles.completedText}>
                      Challenge completed today!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.primaryBtn]}
                      onPress={handleAcceptChallenge}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.primaryBtnText}>Choose Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.secondaryBtn]}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.secondaryBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* History Header */}
            {recentCompletions.length > 0 && (
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Recent Completions</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }: { item: ChallengeCompletion }) => (
          <View style={styles.historyCard}>
            <Image
              source={{ uri: item.resultUrl }}
              style={styles.historyThumb}
            />
            <View style={styles.historyInfo}>
              <Text style={styles.historyStyle}>
                {getStylePack(item.styleId).displayName}
              </Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Result', {
                  jobId: item.jobId,
                  resultUrl: item.resultUrl,
                  params: {
                    styleId: item.styleId,
                    sliders: {
                      intensity: 50,
                      faceFidelity: 70,
                      backgroundStrength: 50,
                      colorMood: 'warm',
                      detail: 50,
                    },
                    toggles: { keepIdentity: true, preserveSkinTone: true },
                  },
                })
              }
            >
              <Text style={styles.viewBtn}>View</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          recentCompletions.length === 0 && !loading ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>
                Complete your first challenge to start building your streak!
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  section: {
    marginBottom: spacing.md,
  },

  // Challenge Card
  challengeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  difficultyText: {
    ...typography.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  submissionCount: {
    ...typography.small,
    color: colors.textMuted,
  },
  cardDesc: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  promptBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  promptLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptText: {
    ...typography.body,
    color: colors.primaryLight,
    fontStyle: 'italic',
  },
  styleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  styleHintLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  styleHintValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  hashtag: {
    ...typography.bodyBold,
    color: colors.primary,
    marginBottom: spacing.md,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  secondaryBtn: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  secondaryBtnText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  completedBanner: {
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  completedText: {
    ...typography.bodyBold,
    color: colors.success,
  },

  // History
  historyHeader: {
    marginBottom: spacing.sm,
  },
  historyTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  historyThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyStyle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  historyDate: {
    ...typography.small,
    color: colors.textMuted,
  },
  viewBtn: {
    ...typography.bodyBold,
    color: colors.primary,
    paddingHorizontal: spacing.md,
  },
  emptyHistory: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
