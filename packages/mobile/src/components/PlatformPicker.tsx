import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import {
  PLATFORMS,
  PlatformConfig,
  isAppInstalled,
  shareToPlatform,
} from '../services/socialShare';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

interface PlatformPickerProps {
  visible: boolean;
  imageUri: string;
  styleName: string;
  onClose: () => void;
}

export default function PlatformPicker({
  visible,
  imageUri,
  styleName,
  onClose,
}: PlatformPickerProps) {
  const { colors } = useTheme();
  const [installed, setInstalled] = useState<Record<string, boolean>>({});
  const [includeFrame, setIncludeFrame] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const results: Record<string, boolean> = {};
      for (const platform of PLATFORMS) {
        results[platform.id] = await isAppInstalled(platform);
      }
      setInstalled(results);
    })();
  }, [visible]);

  const handleSelect = async (platform: PlatformConfig) => {
    trackEvent('post_platform_selected', { platform: platform.id });
    const caption = `My ${styleName} - Made with QuipPix`;
    await shareToPlatform(imageUri, platform, caption, includeFrame);
    onClose();
  };

  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg,
      paddingBottom: 40,
    },
    handleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceLight,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      marginBottom: spacing.lg,
    },
    platformBtn: {
      alignItems: 'center',
      width: '30%',
      paddingVertical: spacing.md,
    },
    platformBtnDimmed: {
      opacity: 0.4,
    },
    platformIcon: {
      fontSize: 32,
      marginBottom: spacing.xs,
    },
    platformLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceLight,
      marginBottom: spacing.md,
    },
    toggleLabel: {
      ...typography.body,
      color: colors.textPrimary,
    },
    closeBtn: {
      alignItems: 'center',
      padding: spacing.sm,
    },
    closeText: {
      ...typography.bodyBold,
      color: colors.textMuted,
    },
  }), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          <Text style={styles.title}>Post To</Text>

          {/* Platform grid */}
          <View style={styles.grid}>
            {PLATFORMS.map((platform) => {
              const isInstalled = installed[platform.id] !== false;
              return (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformBtn,
                    !isInstalled && styles.platformBtnDimmed,
                  ]}
                  onPress={() => handleSelect(platform)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.platformIcon}>{platform.icon}</Text>
                  <Text style={styles.platformLabel}>{platform.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Frame toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Include QuipPix frame</Text>
            <Switch
              value={includeFrame}
              onValueChange={setIncludeFrame}
              trackColor={{ false: colors.surfaceLight, true: colors.primary + '80' }}
              thumbColor={includeFrame ? colors.primary : colors.textMuted}
            />
          </View>

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
