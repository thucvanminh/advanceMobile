import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Trade: { symbol: string };
  Portfolio: undefined;
  Alerts: undefined;
  Notifications: undefined;
  Settings: undefined;
  AdminPanel: undefined;
  Detail: { symbol: string };
  Help: undefined;
  ChangePassword: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
export type DashboardScreenProps = NativeStackScreenProps<MainStackParamList, 'Dashboard'>;
export type TradeScreenProps = NativeStackScreenProps<MainStackParamList, 'Trade'>;
export type PortfolioScreenProps = NativeStackScreenProps<MainStackParamList, 'Portfolio'>;
export type AlertsScreenProps = NativeStackScreenProps<MainStackParamList, 'Alerts'>;
export type NotificationsScreenProps = NativeStackScreenProps<MainStackParamList, 'Notifications'>;
export type SettingsScreenProps = NativeStackScreenProps<MainStackParamList, 'Settings'>;
export type AdminPanelScreenProps = NativeStackScreenProps<MainStackParamList, 'AdminPanel'>;
export type DetailScreenProps = NativeStackScreenProps<MainStackParamList, 'Detail'>;
export type HelpScreenProps = NativeStackScreenProps<MainStackParamList, 'Help'>;
export type ChangePasswordScreenProps = NativeStackScreenProps<MainStackParamList, 'ChangePassword'>;
