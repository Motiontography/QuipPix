import React, { useEffect, useState } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useAppStore } from './store/useAppStore';
import { useProStore } from './store/useProStore';
import { initPurchases, addEntitlementListener } from './services/purchases';
import { registerForPushNotifications, onNotificationOpened } from './services/pushNotifications';
import { initAuth } from './services/auth';
import { initAnalytics } from './services/analytics';
import { initErrorReporting } from './services/errorReporting';
import { initOfflineQueue } from './services/offlineQueue';
import { ErrorBoundary } from './components/ErrorBoundary';
import { darkColors } from './styles/theme';

function AppContent() {
  const { colors, isDark } = useTheme();
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

  // Analytics + Auth + Push notifications + Offline queue
  useEffect(() => {
    initErrorReporting();
    initAnalytics();

    initAuth()
      .then((userId) => registerForPushNotifications(userId))
      .catch(() => {});

    const unsubscribeNotification = onNotificationOpened((data) => {
      // Navigate based on notification type (e.g., daily_challenge)
      // Navigation ref integration can be added later
    });

    const unsubscribeQueue = initOfflineQueue();

    return () => {
      unsubscribeNotification();
      unsubscribeQueue();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} />
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
