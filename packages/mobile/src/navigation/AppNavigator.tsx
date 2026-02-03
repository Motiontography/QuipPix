import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { RootStackParamList, TabParamList } from '../types';
import { colors } from '../styles/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import GalleryScreen from '../screens/GalleryScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StyleSelectScreen from '../screens/StyleSelectScreen';
import CustomizeScreen from '../screens/CustomizeScreen';
import GeneratingScreen from '../screens/GeneratingScreen';
import ResultScreen from '../screens/ResultScreen';
import ShareCardScreen from '../screens/ShareCardScreen';
import PaywallScreen from '../screens/PaywallScreen';
import BatchGeneratingScreen from '../screens/BatchGeneratingScreen';
import BatchResultsScreen from '../screens/BatchResultsScreen';
import RemixScreen from '../screens/RemixScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Gallery: '🖼',
    Challenges: '🏆',
    Settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '•'}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceLight,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const linking = {
  prefixes: ['https://quippix.app', 'quippix://'],
  config: {
    screens: {
      Remix: 'remix/:code',
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="StyleSelect" component={StyleSelectScreen} />
        <Stack.Screen name="Customize" component={CustomizeScreen} />
        <Stack.Screen name="Generating" component={GeneratingScreen} />
        <Stack.Screen name="BatchGenerating" component={BatchGeneratingScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="BatchResults" component={BatchResultsScreen} />
        <Stack.Screen name="ShareCard" component={ShareCardScreen} />
        <Stack.Screen name="Remix" component={RemixScreen} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
