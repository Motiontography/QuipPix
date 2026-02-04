import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  CardTemplateId,
  CardColorTheme,
  CARD_TEMPLATES,
  CARD_COLOR_THEMES,
  renderTemplate,
} from '../components/ShareCardTemplates';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ShareCard'>;
type Route = RouteProp<RootStackParamList, 'ShareCard'>;

export default function ShareCardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {
    localUri,
    styleName,
    styleId,
    challengeId,
    challengeHashtag,
    currentStreak,
  } = route.params;
  const viewShotRef = useRef<ViewShot>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplateId>(
    challengeId ? 'challenge' : 'clean',
  );
  const [selectedTheme, setSelectedTheme] = useState<CardColorTheme>('dark');
  const [caption, setCaption] = useState('');

  useEffect(() => {
    trackEvent('share_card_opened', { styleId, templateId: selectedTemplate });
  }, []);

  const theme = CARD_COLOR_THEMES.find((t) => t.id === selectedTheme) ?? CARD_COLOR_THEMES[0];

  const captureCard = useCallback(async (): Promise<string | null> => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      return uri ?? null;
    } catch {
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    const uri = await captureCard();
    if (!uri) {
      Alert.alert('Error', 'Failed to capture card.');
      return;
    }
    trackEvent('share_card_shared', { templateId: selectedTemplate, themeId: selectedTheme });
    try {
      await Share.open({
        url: uri,
        title: `My ${styleName} - QuipPix`,
        message: challengeHashtag
          ? `${caption || `My ${styleName}`} ${challengeHashtag} #QuipPix`
          : `${caption || `My ${styleName}`} #QuipPix`,
      });
    } catch {
      // User cancelled
    }
  }, [captureCard, selectedTemplate, selectedTheme, styleName, caption, challengeHashtag]);

  const handleSave = useCallback(async () => {
    const uri = await captureCard();
    if (!uri) {
      Alert.alert('Error', 'Failed to capture card.');
      return;
    }
    trackEvent('share_card_saved', { templateId: selectedTemplate, themeId: selectedTheme });
    // react-native-share can save to camera roll
    try {
      const { CameraRoll } = require('@react-native-camera-roll/camera-roll');
      await CameraRoll.save(uri, { type: 'photo' });
      Alert.alert('Saved!', 'Share card saved to your photo library.');
    } catch {
      // Fallback: share sheet
      try {
        await Share.open({ url: uri, title: 'Save Card' });
      } catch {
        // User cancelled
      }
    }
  }, [captureCard, selectedTemplate, selectedTheme]);

  const handleTemplateSelect = useCallback((id: CardTemplateId) => {
    setSelectedTemplate(id);
    trackEvent('share_card_template_selected', { templateId: id });
  }, []);

  const templateConfig = CARD_TEMPLATES.find((t) => t.id === selectedTemplate)!;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backText: { ...typography.body, color: colors.primary },
    title: { ...typography.h3, color: colors.textPrimary },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.md },
    previewContainer: {
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    cardViewShot: {
      width: '100%',
      maxWidth: 340,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    section: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyBold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    templateList: {
      gap: spacing.sm,
    },
    templateChip: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      minWidth: 72,
    },
    templateChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    templateIcon: { fontSize: 22, marginBottom: 4 },
    templateLabel: {
      ...typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    templateLabelActive: { color: colors.primary },
    themeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    themeSwatch: {
      flex: 1,
      height: 44,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeSwatchActive: {
      borderColor: colors.primary,
    },
    themeSwatchLabel: {
      ...typography.small,
      fontWeight: '600',
    },
    captionInput: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      color: colors.textPrimary,
      ...typography.body,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    charCount: {
      ...typography.small,
      color: colors.textMuted,
      textAlign: 'right',
      marginTop: spacing.xs,
    },
    actionBar: {
      flexDirection: 'row',
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceLight,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    saveBtn: {
      backgroundColor: colors.surfaceLight,
    },
    saveBtnText: {
      ...typography.bodyBold,
      color: colors.textPrimary,
    },
    shareBtn: {
      backgroundColor: colors.primary,
    },
    shareBtnText: {
      ...typography.bodyBold,
      color: colors.textPrimary,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Share Card</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Preview */}
        <View style={styles.previewContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={[
              styles.cardViewShot,
              { aspectRatio: templateConfig.aspectRatio },
            ]}
          >
            {renderTemplate(selectedTemplate, {
              imageUri: localUri,
              styleName,
              caption,
              theme,
              challengeHashtag,
              currentStreak,
            })}
          </ViewShot>
        </View>

        {/* Template Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Template</Text>
          <FlatList
            horizontal
            data={CARD_TEMPLATES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.templateChip,
                  selectedTemplate === item.id && styles.templateChipActive,
                ]}
                onPress={() => handleTemplateSelect(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.templateIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.templateLabel,
                    selectedTemplate === item.id && styles.templateLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Color Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Theme</Text>
          <View style={styles.themeRow}>
            {CARD_COLOR_THEMES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeSwatch,
                  { backgroundColor: t.bg },
                  selectedTheme === t.id && styles.themeSwatchActive,
                ]}
                onPress={() => setSelectedTheme(t.id)}
              >
                <Text style={[styles.themeSwatchLabel, { color: t.text }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Caption */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption..."
            placeholderTextColor={colors.textMuted}
            value={caption}
            onChangeText={setCaption}
            maxLength={120}
            multiline
          />
          <Text style={styles.charCount}>{caption.length}/120</Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.saveBtn]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
