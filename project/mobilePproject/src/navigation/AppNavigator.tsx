import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TradeScreen from '../screens/TradeScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import AlertsScreen from '../screens/AlertsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import DetailScreen from '../screens/DetailScreen';
import HelpScreen from '../screens/HelpScreen';
import { COLORS } from '../utils/constants';
import vi from '../i18n/vi';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.background,
    primary: '#3b82f6',
    border: COLORS.border,
    text: COLORS.text,
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: COLORS.background },
      }}>
      <MainStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="Trade"
        component={TradeScreen}
        options={{ title: vi.trade }}
      />
      <MainStack.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ title: vi.portfolio }}
      />
      <MainStack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ title: vi.alerts }}
      />
      <MainStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: vi.notifications }}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: vi.settings }}
      />
      <MainStack.Screen
        name="AdminPanel"
        component={AdminPanelScreen}
        options={{ title: vi.admin }}
      />
      <MainStack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: vi.detail }}
      />
      <MainStack.Screen
        name="Help"
        component={HelpScreen}
        options={{ title: vi.help }}
      />
      <MainStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Đổi mật khẩu' }}
      />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Splash screen có thể thêm sau
  }

  return (
    <NavigationContainer theme={DarkNavTheme}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
