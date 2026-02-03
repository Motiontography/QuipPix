import React, { useState, useCallback } from 'react';
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
  ProSliders,
} from '../types';
import { getStylePack } from '../services/stylePacks';
import { useAppStore } from '../store/useAppStore';
import { usePaywallGuard } from '../hooks/usePaywallGuard';
import { useProStore } from '../store/useProStore';
import ProBadge from '../components/ProBadge';
import DailyLimitBanner from '../components/DailyLimitBanner';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Customize'>;
type Route = RouteProp<RootStackParamList, 'Customize'>;

const COLOR_MOODS: { value: ColorMood; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'mono', label: 'Mono' },
];

const OUTPUT_SIZES = [
  { value: '1024x1024', label: 'Standard (1K)', pro: false },
  { value: '2048x2048', label: 'High-Res (2K)', pro: true },
  { value: '4096x4096', label: 'Ultra (4K)', pro: true },
];

export default function CustomizeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri, styleId } = route.params;
  const stylePack = getStylePack(styleId);
  const { lastSliders, lastToggles, saveLastSettings } = useAppStore();
  const { isPro, guardExport, guardSlider } = usePaywallGuard();
  const isDailyLimitReached = useProStore((s) => s.isDailyLimitReached);

  // Common sliders
  const [sliders, setSliders] = useState<CommonSliders>({ ...lastSliders });
  const [toggles, setToggles] = useState<Toggles>({ ...lastToggles });
  const [userPrompt, setUserPrompt] = useState('');

  // Pro sliders
  const [proSliders, setProSliders] = useState<ProSliders>({});
  const [outputSize, setOutputSize] = useState('1024x1024');

  // Style-specific
  const [comicOpts, setComicOpts] = useState<ComicOptions>({ lineWeight: 50, halftoneAmount: 40 });
  const [magazineOpts, setMagazineOpts] = useState<MagazineOptions>({
    mastheadText: 'QUIPPIX',
    coverLines: [''],
    issueDate: '',
    showBarcode: true,
  });
  const [headshotOpts, setHeadshotOpts] = useState<HeadshotOptions>({
    backdropColor: '#E8E8E8',
    softness: 40,
    vignette: 20,
  });

  const updateSlider = (key: keyof CommonSliders, value: number) => {
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const handleProSlider = (name: string, value: number) => {
    if (!isPro) {
      guardSlider(name);
      return;
    }
    setProSliders((prev) => ({ ...prev, [name]: value }));
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

    saveLastSettings(sliders, toggles, styleOptions);

    const hasProSliders = Object.values(proSliders).some((v) => v != null && v > 0);

    navigation.navigate('Generating', {
      imageUri,
      params: {
        styleId,
        sliders,
        toggles,
        userPrompt: userPrompt.trim() || undefined,
        styleOptions: Object.keys(styleOptions).length > 0 ? styleOptions : undefined,
        proSliders: hasProSliders ? proSliders : undefined,
        outputSize: outputSize !== '1024x1024' ? outputSize : undefined,
      },
    });
  }, [sliders, toggles, userPrompt, comicOpts, magazineOpts, headshotOpts, proSliders, outputSize, styleId, imageUri, navigation, saveLastSettings]);

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
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Preview */}
        <View style={styles.previewRow}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
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
            value={sliders.intensity}
            onChange={(v) => updateSlider('intensity', v)}
          />
          <SliderRow
            label="Face Fidelity"
            value={sliders.faceFidelity}
            onChange={(v) => updateSlider('faceFidelity', v)}
          />
          <SliderRow
            label="Background"
            value={sliders.backgroundStrength}
            onChange={(v) => updateSlider('backgroundStrength', v)}
          />
          <SliderRow
            label="Detail"
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
                onPress={() => setSliders((p) => ({ ...p, colorMood: m.value }))}
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
            onChange={(v) => setToggles((p) => ({ ...p, keepIdentity: v }))}
          />
          <ToggleRow
            label="Preserve Skin Tone"
            description="Prevent unwanted skin tone shifts"
            value={toggles.preserveSkinTone}
            onChange={(v) => setToggles((p) => ({ ...p, preserveSkinTone: v }))}
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
              value={proSliders.microDetail ?? 0}
              onChange={(v) => handleProSlider('microDetail', v)}
              disabled={!isPro}
            />
            <SliderRow
              label="Studio Relight"
              value={proSliders.studioRelight ?? 0}
              onChange={(v) => handleProSlider('studioRelight', v)}
              disabled={!isPro}
            />
            <SliderRow
              label="Background Pro"
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
              onChange={(v) => setComicOpts((p) => ({ ...p, lineWeight: v }))}
            />
            <SliderRow
              label="Halftone Amount"
              value={comicOpts.halftoneAmount}
              onChange={(v) => setComicOpts((p) => ({ ...p, halftoneAmount: v }))}
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
              onChangeText={(t) => setMagazineOpts((p) => ({ ...p, mastheadText: t }))}
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
                onChangeText={(t) => {
                  const updated = [...magazineOpts.coverLines];
                  updated[idx] = t;
                  setMagazineOpts((p) => ({ ...p, coverLines: updated }));
                }}
                maxLength={80}
                placeholder={`Cover line ${idx + 1}`}
                placeholderTextColor={colors.textMuted}
              />
            ))}
            {magazineOpts.coverLines.length < 4 && (
              <TouchableOpacity
                onPress={() =>
                  setMagazineOpts((p) => ({ ...p, coverLines: [...p.coverLines, ''] }))
                }
              >
                <Text style={styles.addLine}>+ Add cover line</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.sliderLabel}>Issue Date</Text>
            <TextInput
              style={styles.textField}
              value={magazineOpts.issueDate}
              onChangeText={(t) => setMagazineOpts((p) => ({ ...p, issueDate: t }))}
              maxLength={30}
              placeholder="January 2026"
              placeholderTextColor={colors.textMuted}
            />
            <ToggleRow
              label="Show Barcode"
              description="Small barcode in bottom-right corner"
              value={magazineOpts.showBarcode}
              onChange={(v) => setMagazineOpts((p) => ({ ...p, showBarcode: v }))}
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
                  onPress={() => setHeadshotOpts((p) => ({ ...p, backdropColor: c }))}
                />
              ))}
            </View>
            <SliderRow
              label="Softness"
              value={headshotOpts.softness}
              onChange={(v) => setHeadshotOpts((p) => ({ ...p, softness: v }))}
            />
            <SliderRow
              label="Vignette"
              value={headshotOpts.vignette}
              onChange={(v) => setHeadshotOpts((p) => ({ ...p, vignette: v }))}
            />
          </View>
        )}

        {/* Daily limit banner near generate */}
        {isDailyLimitReached() || !isPro ? <DailyLimitBanner /> : null}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Generate Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerate}
          activeOpacity={0.8}
        >
          <Text style={styles.generateText}>Generate {stylePack.icon}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.sliderRow, disabled && { opacity: 0.5 }]}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{Math.round(value)}</Text>
      </View>
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

const styles = StyleSheet.create({
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md },
  previewRow: { alignItems: 'center', paddingVertical: spacing.md },
  preview: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
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
  sliderRow: { marginBottom: spacing.md },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  sliderValue: { ...typography.caption, color: colors.primaryLight },
  slider: { width: '100%', height: 36 },
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  toggleInfo: { flex: 1, marginRight: spacing.md },
  toggleLabel: { ...typography.bodyBold, color: colors.textPrimary },
  toggleDesc: { ...typography.caption, color: colors.textSecondary },
  textField: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  addLine: { ...typography.caption, color: colors.primary, marginBottom: spacing.sm },
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
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  generateText: { ...typography.h3, color: colors.textPrimary },
});
