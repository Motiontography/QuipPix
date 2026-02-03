import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { useAppStore } from './store/useAppStore';
import { useProStore } from './store/useProStore';
import { initPurchases } from './services/purchases';

export default function App() {
  const loadGallery = useAppStore((s) => s.loadGallery);
  const refreshEntitlement = useProStore((s) => s.refreshEntitlement);
  const loadProState = useProStore((s) => s.loadProState);

  useEffect(() => {
    loadGallery();
    loadProState();
    initPurchases().then(() => refreshEntitlement());
  }, [loadGallery, loadProState, refreshEntitlement]);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
