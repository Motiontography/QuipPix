import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { BottomSheet } from './BottomSheet';
import { GradientButton } from './GradientButton';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { ExportResolution, ExportFormat, ExportOptions } from '../types';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

interface ExportSheetProps {
  visible: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  defaultWatermark: boolean;
  isPro: boolean;
}

export function ExportSheet({
  visible,
  onClose,
  onExport,
  defaultWatermark,
  isPro,
}: ExportSheetProps) {
  const { colors } = useTheme();
  const lastExportOptions = useAppStore((s) => s.lastExportOptions);
  const setLastExportOptions = useAppStore((s) => s.setLastExportOptions);

  const [resolution, setResolution] = useState<ExportResolution>(
    lastExportOptions?.resolution || 'high',
  );
  const [format, setFormat] = useState<ExportFormat>(
    lastExportOptions?.format || 'png',
  );
  const [quality, setQuality] = useState(lastExportOptions?.quality ?? 0.9);
  const [includeWatermark, setIncludeWatermark] = useState(
    lastExportOptions?.includeWatermark ?? defaultWatermark,
  );

  useEffect(() => {
    if (visible && lastExportOptions) {
      setResolution(lastExportOptions.resolution);
      setFormat(lastExportOptions.format);
      setQuality(lastExportOptions.quality);
      setIncludeWatermark(lastExportOptions.includeWatermark);
    }
  }, [visible, lastExportOptions]);

  function handleExport() {
    const options: ExportOptions = {
      resolution: !isPro && resolution === 'original' ? 'high' : resolution,
      format,
      quality,
      includeWatermark,
    };
    setLastExportOptions(options);
    onExport(options);
    onClose();
  }

  const resolutions: { key: ExportResolution; label: string; proOnly: boolean }[] = [
    { key: 'original', label: t('export.resolutionOriginal'), proOnly: true },
    { key: 'high', label: t('export.resolutionHigh'), proOnly: false },
    { key: 'medium', label: t('export.resolutionMedium'), proOnly: false },
  ];

  return (
    <BottomSheet visible={visible} title={t('export.title')} actions={[]} onClose={onClose}>
      <View style={styles.content}>
        {/* Resolution */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('export.resolution')}
        </Text>
        <View style={styles.optionRow}>
          {resolutions.map(({ key, label, proOnly }) => {
            const locked = proOnly && !isPro;
            const selected = resolution === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => !locked && setResolution(key)}
                style={[
                  styles.optionChip,
                  { borderColor: selected ? colors.primary : colors.surfaceLight },
                  selected && { backgroundColor: colors.primary + '20' },
                  locked && styles.locked,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: selected ? colors.primary : colors.textPrimary },
                    locked && { color: colors.textMuted },
                  ]}
                >
                  {label}
                </Text>
                {locked && (
                  <Text style={[styles.proBadge, { color: colors.primary }]}>
                    {t('export.proRequired')}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Format */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('export.format')}
        </Text>
        <View style={styles.optionRow}>
          {(['png', 'jpeg'] as ExportFormat[]).map((fmt) => {
            const selected = format === fmt;
            return (
              <TouchableOpacity
                key={fmt}
                onPress={() => setFormat(fmt)}
                style={[
                  styles.optionChip,
                  { borderColor: selected ? colors.primary : colors.surfaceLight },
                  selected && { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: selected ? colors.primary : colors.textPrimary },
                  ]}
                >
                  {fmt === 'png' ? t('export.formatPng') : t('export.formatJpeg')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Watermark toggle */}
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
            {t('export.watermark')}
          </Text>
          <Switch
            value={includeWatermark}
            onValueChange={setIncludeWatermark}
            trackColor={{ false: colors.surfaceLight, true: colors.primary }}
          />
        </View>

        {/* Export button */}
        <GradientButton
          title={t('export.export')}
          onPress={handleExport}
          variant="primary"
          style={styles.exportBtn}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  optionText: {
    ...typography.body,
  },
  locked: {
    opacity: 0.6,
  },
  proBadge: {
    ...typography.small,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    ...typography.body,
  },
  exportBtn: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
});
