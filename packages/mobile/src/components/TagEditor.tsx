import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

interface TagEditorProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  maxTags?: number;
}

export function TagEditor({ tags, onAdd, onRemove, maxTags = 10 }: TagEditorProps) {
  const { colors } = useTheme();
  const [input, setInput] = useState('');

  function handleSubmit() {
    const tag = input.trim().toLowerCase();
    if (!tag || tag.length > 20) return;
    if (tags.includes(tag)) {
      setInput('');
      return;
    }
    if (tags.length >= maxTags) return;
    triggerHaptic('light');
    trackEvent('tag_added', { tag });
    onAdd(tag);
    setInput('');
  }

  function handleRemove(tag: string) {
    triggerHaptic('light');
    trackEvent('tag_removed', { tag });
    onRemove(tag);
  }

  return (
    <View>
      <View style={styles.tagList}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, { backgroundColor: colors.primary + '20' }]}
            onPress={() => handleRemove(tag)}
            accessibilityLabel={`Remove tag ${tag}`}
            accessibilityRole="button"
          >
            <Text style={[styles.tagText, { color: colors.primary }]}>
              {tag}
            </Text>
            <Text style={[styles.tagRemove, { color: colors.primary }]}>
              {' \u00d7'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tags.length < maxTags && (
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceLight,
              color: colors.textPrimary,
            },
          ]}
          placeholder={t('gallery.addTag')}
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          maxLength={20}
          autoCapitalize="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.caption,
    fontWeight: '600',
  },
  tagRemove: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    height: 36,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    ...typography.caption,
  },
});
