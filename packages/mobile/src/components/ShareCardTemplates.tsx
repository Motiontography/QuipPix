import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

export type CardTemplateId =
  | 'clean'
  | 'story'
  | 'polaroid'
  | 'magazine'
  | 'minimal'
  | 'challenge';

export interface CardTemplate {
  id: CardTemplateId;
  label: string;
  icon: string;
  aspectRatio: number; // width / height
  description: string;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'clean', label: 'Clean', icon: '🖼', aspectRatio: 1, description: 'Square with style banner' },
  { id: 'story', label: 'Story', icon: '📱', aspectRatio: 9 / 16, description: 'Vertical for IG Stories & TikTok' },
  { id: 'polaroid', label: 'Polaroid', icon: '📷', aspectRatio: 0.82, description: 'Retro instant film look' },
  { id: 'magazine', label: 'Magazine', icon: '📰', aspectRatio: 3 / 4, description: 'Editorial cover layout' },
  { id: 'minimal', label: 'Minimal', icon: '◻️', aspectRatio: 1, description: 'Borderless with subtle mark' },
  { id: 'challenge', label: 'Challenge', icon: '🏆', aspectRatio: 1, description: 'Show off your streak' },
];

export type CardColorTheme = 'dark' | 'light' | 'purple' | 'accent';

export const CARD_COLOR_THEMES: { id: CardColorTheme; bg: string; text: string; label: string }[] = [
  { id: 'dark', bg: '#0F0F1A', text: '#FFFFFF', label: 'Dark' },
  { id: 'light', bg: '#F5F5F7', text: '#1A1A2E', label: 'Light' },
  { id: 'purple', bg: '#2D1B69', text: '#FFFFFF', label: 'Purple' },
  { id: 'accent', bg: '#1A0A2E', text: '#FD79A8', label: 'Accent' },
];

interface TemplateProps {
  imageUri: string;
  styleName: string;
  caption: string;
  theme: typeof CARD_COLOR_THEMES[number];
  challengeHashtag?: string;
  currentStreak?: number;
}

// ─── Clean Template ───────────────────────────────────────────────────
export function CleanCard({ imageUri, styleName, caption, theme }: TemplateProps) {
  return (
    <View style={[tpl.cleanContainer, { backgroundColor: theme.bg }]}>
      <Image source={{ uri: imageUri }} style={tpl.cleanImage} resizeMode="cover" />
      <View style={tpl.cleanFooter}>
        <View style={tpl.cleanFooterLeft}>
          <Text style={[tpl.cleanStyleName, { color: theme.text }]}>{styleName}</Text>
          {caption.length > 0 && (
            <Text style={[tpl.cleanCaption, { color: theme.text, opacity: 0.7 }]} numberOfLines={2}>
              {caption}
            </Text>
          )}
        </View>
        <Text style={[tpl.cleanBrand, { color: theme.text, opacity: 0.5 }]}>QuipPix</Text>
      </View>
    </View>
  );
}

// ─── Story Template (9:16) ─────────────────────────────────────────────
export function StoryCard({ imageUri, styleName, caption, theme }: TemplateProps) {
  return (
    <View style={[tpl.storyContainer, { backgroundColor: theme.bg }]}>
      <View style={tpl.storyTopBar}>
        <Text style={[tpl.storyBrand, { color: theme.text }]}>QuipPix</Text>
      </View>
      <View style={tpl.storyImageWrap}>
        <Image source={{ uri: imageUri }} style={tpl.storyImage} resizeMode="cover" />
      </View>
      <View style={tpl.storyBottom}>
        <Text style={[tpl.storyStyleName, { color: theme.text }]}>{styleName}</Text>
        {caption.length > 0 && (
          <Text style={[tpl.storyCaption, { color: theme.text, opacity: 0.7 }]} numberOfLines={3}>
            {caption}
          </Text>
        )}
        <Text style={[tpl.storySwipeUp, { color: colors.primary }]}>quippix.app</Text>
      </View>
    </View>
  );
}

// ─── Polaroid Template ──────────────────────────────────────────────
export function PolaroidCard({ imageUri, styleName, caption, theme }: TemplateProps) {
  return (
    <View style={[tpl.polaroidOuter, { backgroundColor: theme.bg }]}>
      <View style={tpl.polaroidFrame}>
        <Image source={{ uri: imageUri }} style={tpl.polaroidImage} resizeMode="cover" />
        <View style={tpl.polaroidCapArea}>
          <Text style={tpl.polaroidCaption} numberOfLines={2}>
            {caption || styleName}
          </Text>
          <Text style={tpl.polaroidBrand}>QuipPix</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Magazine Template ───────────────────────────────────────────────
export function MagazineCard({ imageUri, styleName, caption, theme }: TemplateProps) {
  return (
    <View style={[tpl.magContainer, { backgroundColor: theme.bg }]}>
      <Image source={{ uri: imageUri }} style={tpl.magImage} resizeMode="cover" />
      <View style={tpl.magOverlay}>
        <Text style={[tpl.magMasthead, { color: theme.text }]}>QUIPPIX</Text>
        <View style={tpl.magBottom}>
          <Text style={[tpl.magHeadline, { color: theme.text }]}>{styleName}</Text>
          {caption.length > 0 && (
            <Text style={[tpl.magSubhead, { color: theme.text, opacity: 0.8 }]} numberOfLines={2}>
              {caption}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Minimal Template ────────────────────────────────────────────────
export function MinimalCard({ imageUri, theme }: TemplateProps) {
  return (
    <View style={[tpl.minimalContainer, { backgroundColor: theme.bg }]}>
      <Image source={{ uri: imageUri }} style={tpl.minimalImage} resizeMode="cover" />
      <Text style={[tpl.minimalMark, { color: theme.text }]}>QuipPix</Text>
    </View>
  );
}

// ─── Challenge Template ──────────────────────────────────────────────
export function ChallengeCard({
  imageUri,
  styleName,
  caption,
  theme,
  challengeHashtag,
  currentStreak,
}: TemplateProps) {
  return (
    <View style={[tpl.challengeContainer, { backgroundColor: theme.bg }]}>
      <Image source={{ uri: imageUri }} style={tpl.challengeImage} resizeMode="cover" />
      <View style={tpl.challengeFooter}>
        <View style={tpl.challengeRow}>
          <Text style={[tpl.challengeStyleName, { color: theme.text }]}>{styleName}</Text>
          {currentStreak != null && currentStreak > 0 && (
            <View style={tpl.streakPill}>
              <Text style={tpl.streakText}>{currentStreak} day streak</Text>
            </View>
          )}
        </View>
        {caption.length > 0 && (
          <Text style={[tpl.challengeCaption, { color: theme.text, opacity: 0.7 }]} numberOfLines={2}>
            {caption}
          </Text>
        )}
        <View style={tpl.challengeBottomRow}>
          {challengeHashtag ? (
            <Text style={[tpl.challengeHashtag, { color: colors.primary }]}>{challengeHashtag}</Text>
          ) : (
            <Text style={[tpl.challengeHashtag, { color: colors.primary }]}>#QuipPix</Text>
          )}
          <Text style={[tpl.challengeBrand, { color: theme.text, opacity: 0.5 }]}>QuipPix</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Template Renderer ─────────────────────────────────────────────
export function renderTemplate(
  templateId: CardTemplateId,
  props: TemplateProps,
): React.ReactElement {
  switch (templateId) {
    case 'clean':
      return <CleanCard {...props} />;
    case 'story':
      return <StoryCard {...props} />;
    case 'polaroid':
      return <PolaroidCard {...props} />;
    case 'magazine':
      return <MagazineCard {...props} />;
    case 'minimal':
      return <MinimalCard {...props} />;
    case 'challenge':
      return <ChallengeCard {...props} />;
  }
}

// ─── Styles ────────────────────────────────────────────────────────
const tpl = StyleSheet.create({
  // Clean
  cleanContainer: { width: '100%', aspectRatio: 1 },
  cleanImage: { width: '100%', flex: 1 },
  cleanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: spacing.md,
  },
  cleanFooterLeft: { flex: 1, marginRight: spacing.sm },
  cleanStyleName: { ...typography.bodyBold, fontSize: 15 },
  cleanCaption: { ...typography.caption, marginTop: 2 },
  cleanBrand: { ...typography.small, fontWeight: '600' },

  // Story
  storyContainer: { width: '100%', aspectRatio: 9 / 16 },
  storyTopBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  storyBrand: { ...typography.h3, letterSpacing: 2, textTransform: 'uppercase' },
  storyImageWrap: {
    flex: 1,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  storyImage: { width: '100%', height: '100%' },
  storyBottom: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  storyStyleName: { ...typography.bodyBold, fontSize: 17, marginBottom: 4 },
  storyCaption: { ...typography.body, textAlign: 'center', marginBottom: spacing.sm },
  storySwipeUp: { ...typography.caption, fontWeight: '600' },

  // Polaroid
  polaroidOuter: {
    width: '100%',
    aspectRatio: 0.82,
    justifyContent: 'center',
    alignItems: 'center',
  },
  polaroidFrame: {
    width: '85%',
    backgroundColor: '#FAFAF8',
    borderRadius: 4,
    padding: 12,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 2,
  },
  polaroidCapArea: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  polaroidCaption: {
    ...typography.body,
    color: '#333',
    flex: 1,
    fontStyle: 'italic',
  },
  polaroidBrand: {
    ...typography.small,
    color: '#999',
    fontWeight: '600',
  },

  // Magazine
  magContainer: { width: '100%', aspectRatio: 3 / 4, position: 'relative' },
  magImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  magOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  magMasthead: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  magBottom: { alignItems: 'flex-start' },
  magHeadline: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  magSubhead: { ...typography.body },

  // Minimal
  minimalContainer: { width: '100%', aspectRatio: 1, position: 'relative' },
  minimalImage: { width: '100%', height: '100%' },
  minimalMark: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
    ...typography.small,
    opacity: 0.35,
    fontWeight: '600',
  },

  // Challenge
  challengeContainer: { width: '100%', aspectRatio: 1 },
  challengeImage: { width: '100%', flex: 1 },
  challengeFooter: { padding: spacing.md },
  challengeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  challengeStyleName: { ...typography.bodyBold, fontSize: 15, flex: 1 },
  streakPill: {
    backgroundColor: colors.accent + '30',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  streakText: { ...typography.small, color: colors.accent, fontWeight: '600' },
  challengeCaption: { ...typography.caption, marginBottom: spacing.xs },
  challengeBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  challengeHashtag: { ...typography.bodyBold, fontSize: 14 },
  challengeBrand: { ...typography.small, fontWeight: '600' },
});
