import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { useAppStore } from './store/useAppStore';
import { useProStore } from './store/useProStore';
import { initPurchases, addEntitlementListener } from './services/purchases';

export default function App() {
  const loadGallery = useAppStore((s) => s.loadGallery);
  const refreshEntitlement = useProStore((s) => s.refreshEntitlement);
  const setEntitlement = useProStore((s) => s.setEntitlement);
  const loadProState = useProStore((s) => s.loadProState);

  useEffect(() => {
    loadGallery();
    loadProState();
    initPurchases().then(() => refreshEntitlement());

    // Listen for real-time entitlement changes (renewal, cancellation, etc.)
    const unsubscribe = addEntitlementListener((ent) => {
      setEntitlement(ent);
    });

    return unsubscribe;
  }, [loadGallery, loadProState, refreshEntitlement, setEntitlement]);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
