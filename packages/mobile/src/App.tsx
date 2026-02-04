import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { useAppStore } from './store/useAppStore';
import { useProStore } from './store/useProStore';
import { initPurchases, addEntitlementListener } from './services/purchases';
import { registerForPushNotifications, onNotificationOpened } from './services/pushNotifications';
import { colors } from './styles/theme';

export default function App() {
  const loadGallery = useAppStore((s) => s.loadGallery);
  const refreshEntitlement = useProStore((s) => s.refreshEntitlement);
  const setEntitlement = useProStore((s) => s.setEntitlement);
  const loadProState = useProStore((s) => s.loadProState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([loadGallery(), loadProState()]).then(() => {
      setIsReady(true);
    });

    initPurchases().then(() => refreshEntitlement());

    // Listen for real-time entitlement changes (renewal, cancellation, etc.)
    const unsubscribe = addEntitlementListener((ent) => {
      setEntitlement(ent);
    });

    return unsubscribe;
  }, [loadGallery, loadProState, refreshEntitlement, setEntitlement]);

  // Push notifications
  useEffect(() => {
    registerForPushNotifications('anonymous').catch(() => {});

    const unsubscribeNotification = onNotificationOpened((data) => {
      // Navigate based on notification type (e.g., daily_challenge)
      // Navigation ref integration can be added later
    });

    return unsubscribeNotification;
  }, []);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
