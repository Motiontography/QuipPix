import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_IOS_KEY = 'appl_YOUR_REVENUECAT_IOS_KEY';
const REVENUECAT_ANDROID_KEY = 'goog_YOUR_REVENUECAT_ANDROID_KEY';
const PRO_ENTITLEMENT_ID = 'pro';

export interface Entitlement {
  proActive: boolean;
  proType: 'monthly' | 'annual' | 'lifetime' | null;
  expiresAt: string | null;
}

export async function initPurchases(): Promise<void> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  Purchases.configure({ apiKey });
}

export async function getEntitlement(): Promise<Entitlement> {
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    const pro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];

    if (!pro) {
      return { proActive: false, proType: null, expiresAt: null };
    }

    let proType: Entitlement['proType'] = null;
    const productId = pro.productIdentifier;
    if (productId.includes('lifetime')) {
      proType = 'lifetime';
    } else if (productId.includes('annual')) {
      proType = 'annual';
    } else {
      proType = 'monthly';
    }

    return {
      proActive: true,
      proType,
      expiresAt: pro.expirationDate ?? null,
    };
  } catch {
    return { proActive: false, proType: null, expiresAt: null };
  }
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<Entitlement> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const pro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];

  if (!pro) {
    return { proActive: false, proType: null, expiresAt: null };
  }

  let proType: Entitlement['proType'] = null;
  const productId = pro.productIdentifier;
  if (productId.includes('lifetime')) {
    proType = 'lifetime';
  } else if (productId.includes('annual')) {
    proType = 'annual';
  } else {
    proType = 'monthly';
  }

  return {
    proActive: true,
    proType,
    expiresAt: pro.expirationDate ?? null,
  };
}

export async function restorePurchases(): Promise<Entitlement> {
  const customerInfo = await Purchases.restorePurchases();
  const pro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];

  if (!pro) {
    return { proActive: false, proType: null, expiresAt: null };
  }

  let proType: Entitlement['proType'] = null;
  const productId = pro.productIdentifier;
  if (productId.includes('lifetime')) {
    proType = 'lifetime';
  } else if (productId.includes('annual')) {
    proType = 'annual';
  } else {
    proType = 'monthly';
  }

  return {
    proActive: true,
    proType,
    expiresAt: pro.expirationDate ?? null,
  };
}
