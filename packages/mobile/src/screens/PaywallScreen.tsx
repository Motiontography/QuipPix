import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PurchasesPackage } from 'react-native-purchases';
import { RootStackParamList } from '../types';
import { getOfferings, purchasePackage, restorePurchases } from '../services/purchases';
import { useProStore } from '../store/useProStore';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { t } from '../i18n';
import { GradientButton } from '../components/GradientButton';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
type Route = RouteProp<RootStackParamList, 'Paywall'>;

const CREDIT_PACKS = [
  { id: 'small', credits: 25, price: '$4.99', perCredit: '$0.20' },
  { id: 'medium', credits: 100, price: '$14.99', perCredit: '$0.15', bestValue: true },
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { trigger } = route.params;
  const credits = useProStore((s) => s.credits);
  const refreshCredits = useProStore((s) => s.refreshCredits);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(1); // Medium pack default
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    trackEvent('paywall_shown', { trigger });
    (async () => {
      const offerings = await getOfferings();
      if (offerings?.current?.availablePackages) {
        // Filter to only credit packs (consumables)
        const creditPackages = offerings.current.availablePackages.filter(
          (pkg) => pkg.identifier.toLowerCase().includes('credit'),
        );
        setPackages(creditPackages.length > 0 ? creditPackages : offerings.current.availablePackages);
      }
      setLoading(false);
    })();
  }, [trigger]);

  const handlePurchase = async () => {
    const pkg = packages[selectedIndex];
    if (!pkg) return;

    setPurchasing(true);
    try {
      await purchasePackage(pkg);
      // Refresh credits from server after purchase
      await refreshCredits();
      trackEvent('credits_purchased', { trigger, package: pkg.identifier });
      Alert.alert('Credits Added!', 'Your credits have been added to your account.');
      navigation.goBack();
    } catch (err: any) {
      if (!err.userCancelled) {
        Alert.alert('Purchase Failed', err.message || 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      await restorePurchases();
      await refreshCredits();
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message || 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDismiss = () => {
    trackEvent('paywall_dismissed', { trigger });
    navigation.goBack();
  };

  const getPackageCredits = (pkg: PurchasesPackage): number => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('100') || id.includes('medium')) return 100;
    if (id.includes('25') || id.includes('small')) return 25;
    return 25; // default
  };

  const isBestValue = (pkg: PurchasesPackage): boolean => {
    const id = pkg.identifier.toLowerCase();
    return id.includes('100') || id.includes('medium');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0D0D1A',
    },
    closeBtn: {
      position: 'absolute',
      top: 56,
      right: spacing.md,
      zIndex: 10,
      padding: spacing.sm,
    },
    closeText: {
      ...typography.body,
      color: colors.textMuted,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: 80,
      paddingBottom: 40,
      alignItems: 'center',
    },
    headline: {
      ...typography.h1,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subheadline: {
      ...typography.body,
      color: '#A29BFE',
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    currentCredits: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      marginBottom: spacing.xl,
    },
    currentCreditsText: {
      ...typography.bodyBold,
      color: '#FFFFFF',
    },
    sectionTitle: {
      ...typography.bodyBold,
      color: '#FFFFFF',
      marginBottom: spacing.md,
      alignSelf: 'flex-start',
    },
    loader: {
      marginVertical: spacing.xl,
    },
    pricingContainer: {
      width: '100%',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    pricingCard: {
      backgroundColor: '#1A1A2E',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    pricingCardSelected: {
      borderColor: '#6C5CE7',
      backgroundColor: '#1A1A3E',
    },
    pricingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    creditsAmount: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    creditsLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    pricingRight: {
      alignItems: 'flex-end',
    },
    pricingPrice: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    perCredit: {
      ...typography.caption,
      color: colors.textMuted,
    },
    bestValueBadge: {
      position: 'absolute',
      top: -10,
      right: 12,
      backgroundColor: '#6C5CE7',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    bestValueText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    ctaBtn: {
      borderRadius: borderRadius.lg,
      width: '100%',
      marginBottom: spacing.md,
    },
    restoreBtn: {
      padding: spacing.md,
    },
    restoreText: {
      ...typography.caption,
      color: colors.textMuted,
      textDecorationLine: 'underline',
    },
    infoText: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  }), [colors]);

  // Use RevenueCat packages if available, otherwise show static packs
  const displayPacks = packages.length > 0 ? packages : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
        <Text style={styles.closeText}>{t('paywall.notNow')}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Headline */}
        <Text style={styles.headline}>Get More Credits</Text>
        <Text style={styles.subheadline}>Each generation uses 1 credit</Text>

        {/* Current balance */}
        <View style={styles.currentCredits}>
          <Text style={styles.currentCreditsText}>
            Current balance: {credits} credit{credits !== 1 ? 's' : ''}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choose a credit pack:</Text>

        {/* Pricing cards */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : displayPacks ? (
          <View style={styles.pricingContainer}>
            {displayPacks.map((pkg, idx) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.pricingCard,
                  selectedIndex === idx && styles.pricingCardSelected,
                ]}
                onPress={() => setSelectedIndex(idx)}
                activeOpacity={0.8}
              >
                {isBestValue(pkg) && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>BEST VALUE</Text>
                  </View>
                )}
                <View style={styles.pricingLeft}>
                  <View>
                    <Text style={styles.creditsAmount}>{getPackageCredits(pkg)}</Text>
                    <Text style={styles.creditsLabel}>credits</Text>
                  </View>
                </View>
                <View style={styles.pricingRight}>
                  <Text style={styles.pricingPrice}>{pkg.product.priceString}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Fallback static display
          <View style={styles.pricingContainer}>
            {CREDIT_PACKS.map((pack, idx) => (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.pricingCard,
                  selectedIndex === idx && styles.pricingCardSelected,
                ]}
                onPress={() => setSelectedIndex(idx)}
                activeOpacity={0.8}
              >
                {pack.bestValue && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>BEST VALUE</Text>
                  </View>
                )}
                <View style={styles.pricingLeft}>
                  <View>
                    <Text style={styles.creditsAmount}>{pack.credits}</Text>
                    <Text style={styles.creditsLabel}>credits</Text>
                  </View>
                </View>
                <View style={styles.pricingRight}>
                  <Text style={styles.pricingPrice}>{pack.price}</Text>
                  <Text style={styles.perCredit}>{pack.perCredit}/credit</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CTA */}
        <GradientButton
          title={displayPacks ? 'Buy Credits' : 'Coming Soon'}
          onPress={handlePurchase}
          variant="primary"
          loading={purchasing}
          disabled={purchasing || !displayPacks}
          style={styles.ctaBtn}
        />

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreText}>{t('paywall.restorePurchases')}</Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Credits never expire. Use them anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
