import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ShareCard'>;
type Route = RouteProp<RootStackParamList, 'ShareCard'>;

export default function ShareCardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { localUri, styleName } = route.params;
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = useCallback(async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Share.open({
          url: uri,
          title: `My ${styleName} - QuipPix`,
        });
      }
    } catch {
      // User cancelled
    }
  }, [styleName]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Share Card</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.cardContainer}>
        <ViewShot ref={viewShotRef} style={styles.shareCard}>
          <Image source={{ uri: localUri }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardFooter}>
            <Text style={styles.cardStyleName}>{styleName}</Text>
            <Text style={styles.cardBrand}>Made in QuipPix</Text>
          </View>
        </ViewShot>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
        <Text style={styles.shareBtnText}>Share Card</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  shareCard: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  cardStyleName: { ...typography.bodyBold, color: colors.textPrimary },
  cardBrand: { ...typography.small, color: colors.textMuted },
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { ...typography.h3, color: colors.textPrimary },
});
