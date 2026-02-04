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

type Nav = NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
type Route = RouteProp<RootStackParamList, 'Paywall'>;

const BENEFITS = [
  { icon: '🎨', text: 'All 15 styles unlocked' },
  { icon: '📐', text: 'High-res exports (2K & 4K)' },
  { icon: '⚡', text: 'Priority processing' },
  { icon: '🎛️', text: 'Advanced controls' },
  { icon: '♾️', text: 'Unlimited generations' },
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { trigger } = route.params;
  const setEntitlement = useProStore((s) => s.setEntitlement);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(1); // Annual default
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    trackEvent('paywall_shown', { trigger });
    (async () => {
      const offerings = await getOfferings();
      if (offerings?.current?.availablePackages) {
        setPackages(offerings.current.availablePackages);
      }
      setLoading(false);
    })();
  }, [trigger]);

  const handlePurchase = async () => {
    const pkg = packages[selectedIndex];
    if (!pkg) return;

    setPurchasing(true);
    try {
      const ent = await purchasePackage(pkg);
      setEntitlement(ent);
      trackEvent('paywall_converted', { trigger, package: pkg.identifier });
      Alert.alert(t('paywall.welcomePro'), t('paywall.welcomeProMessage'));
      navigation.goBack();
    } catch (err: any) {
      if (!err.userCancelled) {
        Alert.alert(t('paywall.purchaseFailed'), err.message || 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const ent = await restorePurchases();
      setEntitlement(ent);
      if (ent.proActive) {
        Alert.alert(t('paywall.restored'), t('paywall.restoredMessage'));
        navigation.goBack();
      } else {
        Alert.alert(t('paywall.noPurchases'), t('paywall.noPurchasesMessage'));
      }
    } catch (err: any) {
      Alert.alert(t('paywall.restoreFailed'), err.message || 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDismiss = () => {
    trackEvent('paywall_dismissed', { trigger });
    navigation.goBack();
  };

  const getPackageLabel = (pkg: PurchasesPackage): string => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('lifetime')) return t('paywall.lifetime');
    if (id.includes('annual')) return t('paywall.annual');
    return t('paywall.monthly');
  };

  const isBestValue = (pkg: PurchasesPackage): boolean => {
    return pkg.identifier.toLowerCase().includes('annual');
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
      marginBottom: spacing.xl,
    },
    benefitsContainer: {
      width: '100%',
      marginBottom: spacing.xl,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    benefitIcon: {
      fontSize: 20,
      marginRight: spacing.md,
      width: 28,
    },
    benefitText: {
      ...typography.body,
      color: '#FFFFFF',
    },
    loader: {
      marginVertical: spacing.xl,
    },
    pricingContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
      width: '100%',
    },
    pricingCard: {
      flex: 1,
      backgroundColor: '#1A1A2E',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    pricingCardSelected: {
      borderColor: '#6C5CE7',
      backgroundColor: '#1A1A3E',
    },
    bestValueBadge: {
      position: 'absolute',
      top: -10,
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
    pricingLabel: {
      ...typography.bodyBold,
      color: '#FFFFFF',
      marginBottom: 4,
      marginTop: 4,
    },
    pricingPrice: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pricingPeriod: {
      ...typography.caption,
      color: colors.textMuted,
    },
    ctaBtn: {
      backgroundColor: '#6C5CE7',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      width: '100%',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    ctaBtnDisabled: {
      opacity: 0.6,
    },
    ctaText: {
      ...typography.h3,
      color: '#FFFFFF',
    },
    restoreBtn: {
      padding: spacing.md,
    },
    restoreText: {
      ...typography.caption,
      color: colors.textMuted,
      textDecorationLine: 'underline',
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
        <Text style={styles.closeText}>{t('paywall.notNow')}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Headline */}
        <Text style={styles.headline}>{t('paywall.title')}</Text>
        <Text style={styles.subheadline}>{t('paywall.subtitle')}</Text>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing cards */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.pricingContainer}>
            {packages.map((pkg, idx) => (
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
                    <Text style={styles.bestValueText}>{t('paywall.bestValue')}</Text>
                  </View>
                )}
                <Text style={styles.pricingLabel}>{getPackageLabel(pkg)}</Text>
                <Text style={styles.pricingPrice}>
                  {pkg.product.priceString}
                </Text>
                <Text style={styles.pricingPeriod}>
                  {pkg.identifier.toLowerCase().includes('lifetime')
                    ? t('paywall.oneTime')
                    : `/${pkg.identifier.toLowerCase().includes('annual') ? 'year' : 'month'}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, purchasing && styles.ctaBtnDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || packages.length === 0}
          activeOpacity={0.8}
        >
          {purchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>
              {packages.length > 0 ? t('paywall.subscribe') : t('paywall.loading')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreText}>{t('paywall.restorePurchases')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
