import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { t } from '../i18n';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store/useAppStore';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { GradientButton } from '../components/GradientButton';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface Slide {
  icon: string;
  title: string;
  description: string;
  highlights: string[];
}

const SLIDES: Slide[] = [
  {
    icon: '\uD83C\uDFA8',
    title: t('onboarding.slide1Title'),
    description: t('onboarding.slide1Desc'),
    highlights: ['Caricatures', 'Comics', 'Oil Paintings', 'Watercolors'],
  },
  {
    icon: '\u2728',
    title: t('onboarding.slide2Title'),
    description: t('onboarding.slide2Desc'),
    highlights: ['Pencil Sketches', 'Anime', 'Pop Art', 'Pro Headshots'],
  },
  {
    icon: '\uD83C\uDFC6',
    title: t('onboarding.slide3Title'),
    description: t('onboarding.slide3Desc'),
    highlights: ['New challenge every day', 'Streak tracking', 'Community hashtags'],
  },
  {
    icon: '\uD83D\uDCE4',
    title: t('onboarding.slide4Title'),
    description: t('onboarding.slide4Desc'),
    highlights: ['Share cards', 'Remix deep links', 'Direct social posting'],
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = () => {
    setOnboardingComplete();
    navigation.replace('MainTabs' as any);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    skipButton: {
      position: 'absolute',
      top: spacing.xl + 20,
      right: spacing.md,
      zIndex: 10,
      padding: spacing.sm,
    },
    skipText: { ...typography.body, color: colors.textMuted },
    slide: {
      width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    slideIcon: { fontSize: 72, marginBottom: spacing.lg },
    slideTitle: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    slideDescription: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 24,
    },
    highlightContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    highlightChip: {
      backgroundColor: colors.primary + '20',
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    highlightText: { ...typography.caption, color: colors.primaryLight },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      alignItems: 'center',
    },
    dots: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceLight,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    ctaButton: {
      borderRadius: borderRadius.lg,
      width: '100%',
    },
  }), [colors]);

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <Text style={styles.slideIcon}>{item.icon}</Text>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
      <View style={styles.highlightContainer}>
        {item.highlights.map((h, i) => (
          <View key={i} style={styles.highlightChip}>
            <Text style={styles.highlightText}>{h}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, index) => `slide-${index}`}
        bounces={false}
      />

      {/* Bottom: dots + button */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
        <GradientButton
          title={currentIndex === SLIDES.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
          onPress={handleNext}
          variant="primary"
          style={styles.ctaButton}
        />
      </View>
    </SafeAreaView>
  );
}
