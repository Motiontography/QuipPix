import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

interface Challenge {
  id: string;
  title: string;
  description: string;
  suggestedStyle: string;
  icon: string;
}

const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'Superhero Self-Portrait',
    description: 'Transform yourself into a superhero using Comic Book style',
    suggestedStyle: 'comic-book',
    icon: '🦸',
  },
  {
    id: '2',
    title: 'Renaissance You',
    description: 'Turn your selfie into a classical oil painting masterpiece',
    suggestedStyle: 'oil-painting',
    icon: '🎨',
  },
  {
    id: '3',
    title: 'Neon Dreams',
    description: 'Go full cyberpunk with neon lighting and futuristic vibes',
    suggestedStyle: 'cyberpunk-neon',
    icon: '🌆',
  },
  {
    id: '4',
    title: 'Magazine Star',
    description: 'Put yourself on a magazine cover with custom headlines',
    suggestedStyle: 'magazine-cover',
    icon: '📖',
  },
  {
    id: '5',
    title: 'Anime Transformation',
    description: 'See yourself in a totally new anime-inspired style',
    suggestedStyle: 'anime-inspired',
    icon: '⭐',
  },
  {
    id: '6',
    title: 'Watercolor Mood',
    description: 'Create a peaceful, flowy watercolor portrait',
    suggestedStyle: 'watercolor',
    icon: '🌊',
  },
  {
    id: '7',
    title: 'Pop Art Icon',
    description: 'Channel your inner Warhol with a bold pop art piece',
    suggestedStyle: 'pop-art',
    icon: '🎯',
  },
  {
    id: '8',
    title: 'Pro Headshot Challenge',
    description: 'Turn a casual photo into a professional headshot',
    suggestedStyle: 'pro-headshot',
    icon: '📸',
  },
];

export default function ChallengesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Challenges</Text>
        <Text style={styles.subtitle}>
          Try these creative challenges and share your results!
        </Text>
      </View>

      <FlatList
        data={WEEKLY_CHALLENGES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  list: { padding: spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  cardIcon: { fontSize: 40, marginRight: spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: 4 },
  cardDesc: { ...typography.caption, color: colors.textSecondary },
});
