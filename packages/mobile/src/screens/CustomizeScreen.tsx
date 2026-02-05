import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  SafeAreaView,
  Image,
  FlatList,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  RootStackParamList,
  CommonSliders,
  Toggles,
  ColorMood,
  StyleSpecificOptions,
  ComicOptions,
  MagazineOptions,
  HeadshotOptions,
  StoryPortraitOptions,
  InstaModelOptions,
  ProSliders,
} from '../types';
import { getStylePack } from '../services/stylePacks';
import { useAppStore } from '../store/useAppStore';
import { usePaywallGuard } from '../hooks/usePaywallGuard';
import { useProStore } from '../store/useProStore';
import { useUndoStack } from '../hooks/useUndoStack';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { t } from '../i18n';
import ProBadge from '../components/ProBadge';
import DailyLimitBanner from '../components/DailyLimitBanner';
import { GradientButton } from '../components/GradientButton';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Customize'>;
type Route = RouteProp<RootStackParamList, 'Customize'>;

interface CustomizeState {
  sliders: CommonSliders;
  toggles: Toggles;
  proSliders: ProSliders;
  comicOpts: ComicOptions;
  magazineOpts: MagazineOptions;
  headshotOpts: HeadshotOptions;
  storyOpts: StoryPortraitOptions;
  instaOpts: InstaModelOptions;
}

const DEFAULT_CUSTOMIZE_STATE: CustomizeState = {
  sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'warm', detail: 50 },
  toggles: { keepIdentity: true, preserveSkinTone: true },
  proSliders: {},
  comicOpts: { lineWeight: 50, halftoneAmount: 40 },
  magazineOpts: { mastheadText: 'QUIPPIX', coverLines: [''], issueDate: '', showBarcode: true },
  headshotOpts: { backdropColor: '#E8E8E8', softness: 40, vignette: 20 },
  storyOpts: { occupation: '', hobbies: [], heritage: '', vibe: '', extras: '' },
  instaOpts: { outfit: '', setting: '', makeupStyle: 'Natural Glam', hairStyle: 'As-Is', accessories: '', mood: 'Confident' },
};

const VIBE_PRESETS = [
  'Boss Energy', 'Chill Vibes', 'Adventurer', 'Creative Soul',
  'Nerd Life', 'Hustler', 'Dreamer', 'Fitness Junkie',
];

const MAKEUP_PRESETS = ['Natural Glam', 'Soft Glam', 'Full Glam', 'Editorial', 'No Makeup'];
const HAIR_PRESETS = ['As-Is', 'Styled Waves', 'Sleek Straight', 'Updo', 'Natural Curls'];
const MOOD_PRESETS = ['Confident', 'Warm', 'Playful', 'Fierce', 'Elegant', 'Editorial'];
const SETTING_PRESETS = [
  'Studio with soft backdrop',
  'Luxury penthouse',
  'Golden hour outdoors',
  'City rooftop at sunset',
  'Beach / tropical',
  'Paris café',
];

const COLOR_MOODS: { value: ColorMood; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'mono', label: 'Mono' },
];

const OUTPUT_SIZES = [
  { value: '1024x1024', label: 'Square (1024)', pro: false },
  { value: '1536x1024', label: 'Landscape', pro: true },
  { value: '1024x1536', label: 'Portrait', pro: true },
];

export default function CustomizeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri, styleId, imageUris, challengeId, prefillParams } = route.params;
  const isBatch = imageUris && imageUris.length > 1;
  const stylePack = getStylePack(styleId);
  const { lastSliders, lastToggles, saveLastSettings, presets, addPreset, removePreset } = useAppStore();
  const { isPro, guardExport, guardSlider } = usePaywallGuard();
  const { colors } = useTheme();
  const isDailyLimitReached = useProStore((s) => s.isDailyLimitReached);

  // Undo stack for all customize state
  const initialState: CustomizeState = prefillParams ? {
    sliders: prefillParams.sliders || DEFAULT_CUSTOMIZE_STATE.sliders,
    toggles: prefillParams.toggles || DEFAULT_CUSTOMIZE_STATE.toggles,
    proSliders: prefillParams.proSliders || {},
    comicOpts: prefillParams.styleOptions?.comic || DEFAULT_CUSTOMIZE_STATE.comicOpts,
    magazineOpts: prefillParams.styleOptions?.magazine || DEFAULT_CUSTOMIZE_STATE.magazineOpts,
    headshotOpts: prefillParams.styleOptions?.headshot || DEFAULT_CUSTOMIZE_STATE.headshotOpts,
    storyOpts: prefillParams.styleOptions?.storyPortrait || DEFAULT_CUSTOMIZE_STATE.storyOpts,
    instaOpts: prefillParams.styleOptions?.instaModel || DEFAULT_CUSTOMIZE_STATE.instaOpts,
  } : {
    sliders: { ...lastSliders },
    toggles: { ...lastToggles },
    proSliders: {},
    comicOpts: DEFAULT_CUSTOMIZE_STATE.comicOpts,
    magazineOpts: DEFAULT_CUSTOMIZE_STATE.magazineOpts,
    headshotOpts: DEFAULT_CUSTOMIZE_STATE.headshotOpts,
    storyOpts: DEFAULT_CUSTOMIZE_STATE.storyOpts,
    instaOpts: DEFAULT_CUSTOMIZE_STATE.instaOpts,
  };

  const { state: customizeState, setState: setCustomizeState, undo, redo, reset, canUndo, canRedo } = useUndoStack<CustomizeState>({ initialState });
  const { sliders, toggles, proSliders, comicOpts, magazineOpts, headshotOpts, storyOpts, instaOpts } = customizeState;
  const isStoryPortrait = styleId.startsWith('story-portrait');
  const isInstaGlam = styleId === 'insta-glam';

  // Non-undoable state
  const [userPrompt, setUserPrompt] = useState(prefillParams?.userPrompt || '');
  const [outputSize, setOutputSize] = useState(prefillParams?.outputSize || '1024x1024');
  const [hobbyInput, setHobbyInput] = useState('');

  // Preset modal state
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const updateSlider = (key: keyof CommonSliders, value: number) => {
    setCustomizeState((prev) => ({ ...prev, sliders: { ...prev.sliders, [key]: value } }));
  };

  const handleProSlider = (name: string, value: number) => {
    if (!isPro) {
      guardSlider(name);
      return;
    }
    setCustomizeState((prev) => ({ ...prev, proSliders: { ...prev.proSliders, [name]: value } }));
  };

  const handleOutputSize = (size: string, pro: boolean) => {
    if (pro && !guardExport(size)) return;
    setOutputSize(size);
  };

  const handleGenerate = useCallback(() => {
    const styleOptions: StyleSpecificOptions = {};
    if (styleId === 'comic-book') styleOptions.comic = comicOpts;
    if (styleId === 'magazine-cover') styleOptions.magazine = magazineOpts;
    if (styleId === 'pro-headshot') styleOptions.headshot = headshotOpts;
    if (isStoryPortrait) styleOptions.storyPortrait = storyOpts;
    if (isInstaGlam) styleOptions.instaModel = instaOpts;

    saveLastSettings(sliders, toggles, styleOptions);

    const hasProSliders = Object.values(proSliders).some((v) => v != null && v > 0);

    const genParams = {
      styleId,
      sliders,
      toggles,
      userPrompt: userPrompt.trim() || undefined,
      styleOptions: Object.keys(styleOptions).length > 0 ? styleOptions : undefined,
      proSliders: hasProSliders ? proSliders : undefined,
      outputSize: outputSize !== '1024x1024' ? outputSize : undefined,
    };

    if (isBatch) {
      navigation.navigate('BatchGenerating', {
        imageUris: imageUris!,
        params: genParams,
      });
    } else {
      navigation.navigate('Generating', {
        imageUri,
        params: genParams,
        challengeId,
      });
    }
  }, [sliders, toggles, userPrompt, comicOpts, magazineOpts, headshotOpts, storyOpts, instaOpts, proSliders, outputSize, styleId, imageUri, challengeId, navigation, saveLastSettings]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backBtn: { paddingRight: spacing.md },
    backText: { ...typography.body, color: colors.primary },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    styleIcon: { fontSize: 24 },
    title: { ...typography.h3, color: colors.textPrimary },
    headerRight: { flexDirection: 'row', gap: spacing.xs },
    headerBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    headerBtnText: { ...typography.caption, color: colors.primary },
    headerBtnDisabled: { opacity: 0.3 },
    headerBtnTextDisabled: { color: colors.textMuted },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.md },
    previewRow: { alignItems: 'center', paddingVertical: spacing.md },
    preview: {
      width: 160,
      height: 160,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
    },
    batchPreviewRow: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    batchPreviewContent: {
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
    },
    batchPreviewThumb: {
      width: 72,
      height: 72,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    batchCount: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyBold,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    promptInput: {
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      color: colors.textPrimary,
      ...typography.body,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    charCount: {
      ...typography.small,
      color: colors.textMuted,
      textAlign: 'right',
      marginTop: spacing.xs,
    },
    sliderLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
    moodRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
      marginBottom: spacing.md,
    },
    moodChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceLight,
    },
    moodChipActive: { backgroundColor: colors.primary },
    moodText: { ...typography.caption, color: colors.textSecondary },
    moodTextActive: { color: colors.textPrimary },
    sizeChipContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    inlineBadge: {
      marginLeft: 4,
    },
    lockedOverlay: {
      opacity: 0.5,
    },
    textField: {
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      color: colors.textPrimary,
      ...typography.body,
      marginBottom: spacing.sm,
    },
    addLine: { ...typography.caption, color: colors.primary, marginBottom: spacing.sm },
    hobbyInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    hobbyField: { flex: 1, marginBottom: 0 },
    hobbyAddBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    hobbyAddText: { ...typography.bodyBold, color: colors.textPrimary },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchActive: { borderColor: colors.primary },
    footer: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceLight,
    },
    resetBtn: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.sm },
    resetText: { ...typography.caption, color: colors.error },
    generateBtn: {
      borderRadius: borderRadius.lg,
    },
    presetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    presetActions: { flexDirection: 'row', gap: spacing.md },
    presetLoadText: { ...typography.bodyBold, color: colors.primary },
    presetSaveText: { ...typography.bodyBold, color: colors.primary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, width: '85%', maxHeight: '70%' },
    modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    noPresetsText: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
    presetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceLight },
    presetInfo: { flex: 1 },
    presetItemName: { ...typography.bodyBold, color: colors.textPrimary },
    presetItemDate: { ...typography.small, color: colors.textMuted },
    presetLoadBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.primary + '20', borderRadius: borderRadius.md, marginRight: spacing.sm },
    presetLoadBtnText: { ...typography.caption, color: colors.primary },
    presetDeleteText: { ...typography.caption, color: colors.error },
    presetInput: { ...typography.body, color: colors.textPrimary, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
    presetSaveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.sm, alignItems: 'center' },
    presetSaveBtnText: { ...typography.bodyBold, color: colors.textPrimary },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'} Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.styleIcon}>{stylePack.icon}</Text>
          <Text style={styles.title}>{stylePack.displayName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => { triggerHaptic('light'); undo(); trackEvent('undo_used'); }}
            disabled={!canUndo}
            style={[styles.headerBtn, !canUndo && styles.headerBtnDisabled]}
          >
            <Text style={[styles.headerBtnText, !canUndo && styles.headerBtnTextDisabled]}>{t('customize.undo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { triggerHaptic('light'); redo(); trackEvent('redo_used'); }}
            disabled={!canRedo}
            style={[styles.headerBtn, !canRedo && styles.headerBtnDisabled]}
          >
            <Text style={[styles.headerBtnText, !canRedo && styles.headerBtnTextDisabled]}>{t('customize.redo')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Preview */}
          {isBatch ? (
            <View style={styles.batchPreviewRow}>
              <FlatList
                horizontal
                data={imageUris}
                keyExtractor={(_, i) => `batch-preview-${i}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.batchPreviewContent}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.batchPreviewThumb} />
                )}
              />
              <Text style={styles.batchCount}>{imageUris!.length} photos selected</Text>
            </View>
          ) : (
            <View style={styles.previewRow}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
            </View>
          )}

          {/* Presets */}
          <View style={styles.section}>
            <View style={styles.presetHeader}>
              <Text style={styles.sectionTitle}>{t('customize.presets')}</Text>
              <View style={styles.presetActions}>
                <TouchableOpacity onPress={() => setShowPresetPicker(true)}>
                  <Text style={styles.presetLoadText}>{t('customize.loadPreset')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowSavePreset(true)}>
                  <Text style={styles.presetSaveText}>{t('customize.savePreset')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* User prompt */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Creative Direction</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="e.g., Create a caricature of me as a superhero..."
              placeholderTextColor={colors.textMuted}
              value={userPrompt}
              onChangeText={setUserPrompt}
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>{userPrompt.length}/500</Text>
          </View>

          {/* Common Sliders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adjustments</Text>

            <SliderRow
              label="Intensity"
              hint="How strong the style effect is applied"
              value={sliders.intensity}
              onChange={(v) => updateSlider('intensity', v)}
            />
            <SliderRow
              label="Face Fidelity"
              hint="Higher = face stays closer to the original photo"
              value={sliders.faceFidelity}
              onChange={(v) => updateSlider('faceFidelity', v)}
            />
            <SliderRow
              label="Background"
              hint="How much the background is transformed"
              value={sliders.backgroundStrength}
              onChange={(v) => updateSlider('backgroundStrength', v)}
            />
            <SliderRow
              label="Detail"
              hint="Amount of fine detail in the final image"
              value={sliders.detail}
              onChange={(v) => updateSlider('detail', v)}
            />

            {/* Color Mood */}
            <Text style={styles.sliderLabel}>Color Mood</Text>
            <View style={styles.moodRow}>
              {COLOR_MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[
                    styles.moodChip,
                    sliders.colorMood === m.value && styles.moodChipActive,
                  ]}
                  onPress={() => setCustomizeState((prev) => ({ ...prev, sliders: { ...prev.sliders, colorMood: m.value } }))}
                >
                  <Text
                    style={[
                      styles.moodText,
                      sliders.colorMood === m.value && styles.moodTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Toggles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            <ToggleRow
              label="Keep Identity"
              description="Preserve recognizable facial features"
              value={toggles.keepIdentity}
              onChange={(v) => setCustomizeState((prev) => ({ ...prev, toggles: { ...prev.toggles, keepIdentity: v } }))}
            />
            <ToggleRow
              label="Preserve Skin Tone"
              description="Prevent unwanted skin tone shifts"
              value={toggles.preserveSkinTone}
              onChange={(v) => setCustomizeState((prev) => ({ ...prev, toggles: { ...prev.toggles, preserveSkinTone: v } }))}
            />
          </View>

          {/* Advanced Controls (Pro) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Advanced Controls</Text>
              {!isPro && <ProBadge />}
            </View>

            <View style={!isPro ? styles.lockedOverlay : undefined}>
              <SliderRow
                label="Micro Detail"
                hint="Adds fine skin texture and pore detail"
                value={proSliders.microDetail ?? 0}
                onChange={(v) => handleProSlider('microDetail', v)}
                disabled={!isPro}
              />
              <SliderRow
                label="Studio Relight"
                hint="Enhances lighting like a professional studio"
                value={proSliders.studioRelight ?? 0}
                onChange={(v) => handleProSlider('studioRelight', v)}
                disabled={!isPro}
              />
              <SliderRow
                label="Background Pro"
                hint="Advanced background enhancement and blur"
                value={proSliders.backgroundPro ?? 0}
                onChange={(v) => handleProSlider('backgroundPro', v)}
                disabled={!isPro}
              />
            </View>
          </View>

          {/* Output Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Output Size</Text>
            <View style={styles.moodRow}>
              {OUTPUT_SIZES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.moodChip,
                    outputSize === s.value && styles.moodChipActive,
                  ]}
                  onPress={() => handleOutputSize(s.value, s.pro)}
                >
                  <View style={styles.sizeChipContent}>
                    <Text
                      style={[
                        styles.moodText,
                        outputSize === s.value && styles.moodTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                    {s.pro && !isPro && (
                      <View style={styles.inlineBadge}>
                        <ProBadge size="small" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comic-specific */}
          {styleId === 'comic-book' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comic Options</Text>
              <SliderRow
                label="Line Weight"
                value={comicOpts.lineWeight}
                onChange={(v) => setCustomizeState((prev) => ({ ...prev, comicOpts: { ...prev.comicOpts, lineWeight: v } }))}
              />
              <SliderRow
                label="Halftone Amount"
                value={comicOpts.halftoneAmount}
                onChange={(v) => setCustomizeState((prev) => ({ ...prev, comicOpts: { ...prev.comicOpts, halftoneAmount: v } }))}
              />
            </View>
          )}

          {/* Magazine-specific */}
          {styleId === 'magazine-cover' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Magazine Options</Text>
              <Text style={styles.sliderLabel}>Masthead Text</Text>
              <TextInput
                style={styles.textField}
                value={magazineOpts.mastheadText}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, magazineOpts: { ...prev.magazineOpts, mastheadText: text } }))}
                maxLength={50}
                placeholder="QUIPPIX"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.sliderLabel}>Cover Lines</Text>
              {magazineOpts.coverLines.map((line, idx) => (
                <TextInput
                  key={idx}
                  style={styles.textField}
                  value={line}
                  onChangeText={(text) => {
                    const updated = [...magazineOpts.coverLines];
                    updated[idx] = text;
                    setCustomizeState((prev) => ({ ...prev, magazineOpts: { ...prev.magazineOpts, coverLines: updated } }));
                  }}
                  maxLength={80}
                  placeholder={`Cover line ${idx + 1}`}
                  placeholderTextColor={colors.textMuted}
                />
              ))}
              {magazineOpts.coverLines.length < 4 && (
                <TouchableOpacity
                  onPress={() =>
                    setCustomizeState((prev) => ({ ...prev, magazineOpts: { ...prev.magazineOpts, coverLines: [...prev.magazineOpts.coverLines, ''] } }))
                  }
                >
                  <Text style={styles.addLine}>+ Add cover line</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.sliderLabel}>Issue Date</Text>
              <TextInput
                style={styles.textField}
                value={magazineOpts.issueDate}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, magazineOpts: { ...prev.magazineOpts, issueDate: text } }))}
                maxLength={30}
                placeholder="January 2026"
                placeholderTextColor={colors.textMuted}
              />
              <ToggleRow
                label="Show Barcode"
                description="Small barcode in bottom-right corner"
                value={magazineOpts.showBarcode}
                onChange={(v) => setCustomizeState((prev) => ({ ...prev, magazineOpts: { ...prev.magazineOpts, showBarcode: v } }))}
              />
            </View>
          )}

          {/* Headshot-specific */}
          {styleId === 'pro-headshot' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Headshot Options</Text>
              <Text style={styles.sliderLabel}>Backdrop Color</Text>
              <View style={styles.moodRow}>
                {['#E8E8E8', '#FFFFFF', '#1A1A2E', '#2C3E50', '#D4A373'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      headshotOpts.backdropColor === c && styles.swatchActive,
                    ]}
                    onPress={() => setCustomizeState((prev) => ({ ...prev, headshotOpts: { ...prev.headshotOpts, backdropColor: c } }))}
                  />
                ))}
              </View>
              <SliderRow
                label="Softness"
                value={headshotOpts.softness}
                onChange={(v) => setCustomizeState((prev) => ({ ...prev, headshotOpts: { ...prev.headshotOpts, softness: v } }))}
              />
              <SliderRow
                label="Vignette"
                value={headshotOpts.vignette}
                onChange={(v) => setCustomizeState((prev) => ({ ...prev, headshotOpts: { ...prev.headshotOpts, vignette: v } }))}
              />
            </View>
          )}

          {/* Story Portrait questionnaire */}
          {isStoryPortrait && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tell Us About You</Text>

              <Text style={styles.sliderLabel}>What do you do?</Text>
              <TextInput
                style={styles.textField}
                value={storyOpts.occupation}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, storyOpts: { ...prev.storyOpts, occupation: text } }))}
                maxLength={100}
                placeholder="e.g., Nurse, Software Engineer, Teacher..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.sliderLabel}>Your hobbies & interests (up to 6)</Text>
              <View style={styles.moodRow}>
                {storyOpts.hobbies.map((hobby, idx) => (
                  <TouchableOpacity
                    key={`hobby-${idx}`}
                    style={[styles.moodChip, styles.moodChipActive]}
                    onPress={() => {
                      const updated = storyOpts.hobbies.filter((_, i) => i !== idx);
                      setCustomizeState((prev) => ({ ...prev, storyOpts: { ...prev.storyOpts, hobbies: updated } }));
                    }}
                  >
                    <Text style={styles.moodTextActive}>{hobby} x</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {storyOpts.hobbies.length < 6 && (
                <View style={styles.hobbyInputRow}>
                  <TextInput
                    style={[styles.textField, styles.hobbyField]}
                    value={hobbyInput}
                    onChangeText={setHobbyInput}
                    maxLength={50}
                    placeholder="Type a hobby and tap Add"
                    placeholderTextColor={colors.textMuted}
                    onSubmitEditing={() => {
                      const trimmed = hobbyInput.trim();
                      if (trimmed && storyOpts.hobbies.length < 6) {
                        setCustomizeState((prev) => ({ ...prev, storyOpts: { ...prev.storyOpts, hobbies: [...prev.storyOpts.hobbies, trimmed] } }));
                        setHobbyInput('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.hobbyAddBtn}
                    onPress={() => {
                      const trimmed = hobbyInput.trim();
                      if (trimmed && storyOpts.hobbies.length < 6) {
                        setCustomizeState((prev) => ({ ...prev, storyOpts: { ...prev.storyOpts, hobbies: [...prev.storyOpts.hobbies, trimmed] } }));
                        setHobbyInput('');
                      }
                    }}
                  >
                    <Text style={styles.hobbyAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.sliderLabel}>Your heritage or culture</Text>
              <TextInput
                style={styles.textField}
                value={storyOpts.heritage}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, storyOpts: { ...prev.storyOpts, heritage: text } }))}
                maxLength={100}
                placeholder="e.g., Jamaican, Irish-American, Nigerian..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.sliderLabel}>Your vibe</Text>
              <View style={styles.moodRow}>
                {VIBE_PRESETS.map((vibe) => (
                  <TouchableOpacity
                    key={vibe}
                    style={[
                      styles.moodChip,
                      storyOpts.vibe === vibe && styles.moodChipActive,
                    ]}
                    onPress={() => setCustomizeState((prev) => ({
                      ...prev,
                      storyOpts: { ...prev.storyOpts, vibe: prev.storyOpts.vibe === vibe ? '' : vibe },
                    }))}
                  >
                    <Text
                      style={[
                        styles.moodText,
                        storyOpts.vibe === vibe && styles.moodTextActive,
                      ]}
                    >
                      {vibe}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.textField}
                value={VIBE_PRESETS.includes(storyOpts.vibe) ? '' : storyOpts.vibe}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, storyOpts: { ...prev.storyOpts, vibe: text } }))}
                maxLength={100}
                placeholder="Or type your own vibe..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.sliderLabel}>Anything else to include?</Text>
              <TextInput
                style={styles.textField}
                value={storyOpts.extras}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, storyOpts: { ...prev.storyOpts, extras: text } }))}
                maxLength={200}
                placeholder="e.g., my cat Whiskers, my red convertible..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}

          {/* Insta Glam customization */}
          {isInstaGlam && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customize Your Glam</Text>

              <Text style={styles.sliderLabel}>Makeup Style</Text>
              <View style={styles.moodRow}>
                {MAKEUP_PRESETS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.moodChip, instaOpts.makeupStyle === m && styles.moodChipActive]}
                    onPress={() => setCustomizeState((prev) => ({ ...prev, instaOpts: { ...prev.instaOpts, makeupStyle: m } }))}
                  >
                    <Text style={[styles.moodText, instaOpts.makeupStyle === m && styles.moodTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sliderLabel}>Hair Style</Text>
              <View style={styles.moodRow}>
                {HAIR_PRESETS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.moodChip, instaOpts.hairStyle === h && styles.moodChipActive]}
                    onPress={() => setCustomizeState((prev) => ({ ...prev, instaOpts: { ...prev.instaOpts, hairStyle: h } }))}
                  >
                    <Text style={[styles.moodText, instaOpts.hairStyle === h && styles.moodTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sliderLabel}>Mood / Vibe</Text>
              <View style={styles.moodRow}>
                {MOOD_PRESETS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.moodChip, instaOpts.mood === m && styles.moodChipActive]}
                    onPress={() => setCustomizeState((prev) => ({ ...prev, instaOpts: { ...prev.instaOpts, mood: m } }))}
                  >
                    <Text style={[styles.moodText, instaOpts.mood === m && styles.moodTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sliderLabel}>Outfit / Clothing</Text>
              <TextInput
                style={styles.textField}
                value={instaOpts.outfit}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, instaOpts: { ...prev.instaOpts, outfit: text } }))}
                maxLength={200}
                placeholder="e.g., Red evening gown, White blazer & heels, Streetwear..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.sliderLabel}>Setting / Background</Text>
              <View style={styles.moodRow}>
                {SETTING_PRESETS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.moodChip, instaOpts.setting === s && styles.moodChipActive]}
                    onPress={() => setCustomizeState((prev) => ({
                      ...prev,
                      instaOpts: { ...prev.instaOpts, setting: prev.instaOpts.setting === s ? '' : s },
                    }))}
                  >
                    <Text style={[styles.moodText, instaOpts.setting === s && styles.moodTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.textField}
                value={SETTING_PRESETS.includes(instaOpts.setting) ? '' : instaOpts.setting}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, instaOpts: { ...prev.instaOpts, setting: text } }))}
                maxLength={150}
                placeholder="Or type your own setting..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.sliderLabel}>Accessories</Text>
              <TextInput
                style={styles.textField}
                value={instaOpts.accessories}
                onChangeText={(text) => setCustomizeState((prev) => ({ ...prev, instaOpts: { ...prev.instaOpts, accessories: text } }))}
                maxLength={200}
                placeholder="e.g., Gold hoop earrings, designer sunglasses, diamond necklace..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}

          {/* Daily limit banner near generate */}
          {isDailyLimitReached() || !isPro ? <DailyLimitBanner /> : null}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer with Reset + Generate */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            triggerHaptic('warning');
            reset(DEFAULT_CUSTOMIZE_STATE);
            trackEvent('reset_to_defaults');
          }}
        >
          <Text style={styles.resetText}>{t('customize.resetDefaults')}</Text>
        </TouchableOpacity>
        <GradientButton
          title={`Generate ${stylePack.icon}`}
          onPress={handleGenerate}
          variant="primary"
          size="large"
          style={styles.generateBtn}
        />
      </View>

      {/* Load Preset Modal */}
      <Modal visible={showPresetPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPresetPicker(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{t('customize.loadPresetTitle')}</Text>
            {presets.length === 0 ? (
              <Text style={styles.noPresetsText}>{t('customize.noPresets')}</Text>
            ) : (
              presets.map((preset) => (
                <View key={preset.id} style={styles.presetItem}>
                  <View style={styles.presetInfo}>
                    <Text style={styles.presetItemName}>{preset.name}</Text>
                    <Text style={styles.presetItemDate}>{new Date(preset.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.presetLoadBtn}
                    onPress={() => {
                      setCustomizeState({
                        sliders: preset.sliders,
                        toggles: preset.toggles,
                        proSliders: {},
                        comicOpts: preset.styleOptions?.comic || DEFAULT_CUSTOMIZE_STATE.comicOpts,
                        magazineOpts: preset.styleOptions?.magazine || DEFAULT_CUSTOMIZE_STATE.magazineOpts,
                        headshotOpts: preset.styleOptions?.headshot || DEFAULT_CUSTOMIZE_STATE.headshotOpts,
                        storyOpts: preset.styleOptions?.storyPortrait || DEFAULT_CUSTOMIZE_STATE.storyOpts,
                        instaOpts: preset.styleOptions?.instaModel || DEFAULT_CUSTOMIZE_STATE.instaOpts,
                      });
                      trackEvent('preset_loaded', { presetId: preset.id });
                      setShowPresetPicker(false);
                    }}
                  >
                    <Text style={styles.presetLoadBtnText}>{t('customize.loadPreset')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(t('customize.deletePreset'), t('customize.deletePresetMessage', { name: preset.name }), [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('common.delete'), style: 'destructive', onPress: () => { removePreset(preset.id); trackEvent('preset_deleted', { presetId: preset.id }); } },
                      ]);
                    }}
                  >
                    <Text style={styles.presetDeleteText}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Save Preset Modal */}
      <Modal visible={showSavePreset} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSavePreset(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{t('customize.savePresetTitle')}</Text>
            <TextInput
              style={styles.presetInput}
              placeholder={t('customize.presetNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={presetName}
              onChangeText={setPresetName}
              maxLength={30}
              autoFocus
            />
            <TouchableOpacity
              style={styles.presetSaveBtn}
              onPress={() => {
                const name = presetName.trim();
                if (!name) return;
                if (presets.length >= 20) {
                  Alert.alert(t('customize.presetLimit'));
                  return;
                }
                const styleOpts: StyleSpecificOptions = {};
                if (styleId === 'comic-book') styleOpts.comic = comicOpts;
                if (styleId === 'magazine-cover') styleOpts.magazine = magazineOpts;
                if (styleId === 'pro-headshot') styleOpts.headshot = headshotOpts;
                if (isStoryPortrait) styleOpts.storyPortrait = storyOpts;
                if (isInstaGlam) styleOpts.instaModel = instaOpts;
                addPreset(name, sliders, toggles, Object.keys(styleOpts).length > 0 ? styleOpts : undefined);
                triggerHaptic('success');
                trackEvent('preset_saved');
                setPresetName('');
                setShowSavePreset(false);
                Alert.alert(t('customize.presetSaved'));
              }}
            >
              <Text style={styles.presetSaveBtnText}>{t('customize.savePreset')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    sliderRow: { marginBottom: spacing.md },
    sliderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sliderLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
    sliderHint: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs, fontSize: 11 },
    sliderValue: { ...typography.caption, color: colors.primaryLight },
    slider: { width: '100%', height: 36 },
  }), [colors]);

  return (
    <View style={[styles.sliderRow, disabled && { opacity: 0.5 }]}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{Math.round(value)}</Text>
      </View>
      {hint && <Text style={styles.sliderHint}>{hint}</Text>}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        minimumTrackTintColor={disabled ? colors.surfaceLight : colors.primary}
        maximumTrackTintColor={colors.surfaceLight}
        thumbTintColor={disabled ? colors.textMuted : colors.primaryLight}
      />
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    toggleInfo: { flex: 1, marginRight: spacing.md },
    toggleLabel: { ...typography.bodyBold, color: colors.textPrimary },
    toggleDesc: { ...typography.caption, color: colors.textSecondary },
  }), [colors]);

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceLight, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
}
