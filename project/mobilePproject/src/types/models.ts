// Types cho Crypto Trading App

export type Role = 'user' | 'admin';
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected';
export type TradingMode = 'paper' | 'real';
export type AlertType = 'above' | 'below' | 'change_percent';
export type AlertStatus = 'active' | 'triggered' | 'disabled';
export type NotificationType = 'price_alert' | 'order_filled' | 'system';
export type PositionSide = 'long' | 'short';
export type TradeMode = 'spot' | 'futures';
export type KlineInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
export type ThemeMode = 'dark' | 'light';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: number; // timestamp
  lastLoginAt: number;
  settings: UserSettings;
  paperBalance: { [symbol: string]: number }; // { USDT: 10000, BTC: 0, ... }
}

export interface UserSettings {
  theme: ThemeMode;
  currency: 'USDT' | 'BTC';
  notificationsEnabled: boolean;
}

export interface Symbol {
  symbol: string; // 'BTCUSDT'
  baseAsset: string; // 'BTC'
  quoteAsset: string; // 'USDT'
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number; // 0 cho market
  status: OrderStatus;
  mode: TradingMode;
  filledPrice: number;
  filledAt?: number;
  createdAt: number;
  total: number; // filledPrice * quantity
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'buy' | 'sell' | 'deposit';
  symbol: string;
  amount: number;
  price: number;
  total: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId: string;
  mode: TradingMode;
  createdAt: number;
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  type: AlertType;
  value: number;
  status: AlertStatus;
  triggeredAt?: number;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: number;
}

// Futures Position
export interface Position {
  id: string;
  userId: string;
  symbol: string;
  side: PositionSide;
  quantity: number;      // số coin (vd 0.1 BTC)
  entryPrice: number;    // giá vào lệnh
  leverage: number;      // đòn bẩy 1-100
  liquidationPrice: number; // giá thanh lý
  marginUsed: number;    // ký quỹ = entryPrice * quantity / leverage
  openedAt: number;      // thời gian mở
  status: 'open' | 'closed';
  closedAt?: number;
  closedPrice?: number;
  realizedPnl?: number;
}

// Binance WebSocket types
export interface BinanceTrade {
  e: 'trade';
  E: number; // event time
  s: string; // symbol
  p: string; // price
  q: string; // quantity
  T: number; // trade time
  m: boolean; // is buyer maker
}

export interface Binance24hrTicker {
  e: '24hrTicker';
  E: number;
  s: string;
  p: string; // price change
  P: string; // price change percent
  w: string; // weighted average price
  c: string; // current price
  h: string; // high
  l: string; // low
  v: string; // total traded base volume
  q: string; // total traded quote volume
}

export interface BinanceKline {
  e: 'kline';
  E: number;
  s: string;
  k: {
    t: number; // open time
    T: number; // close time
    o: string; // open
    h: string; // high
    l: string; // low
    c: string; // close
    v: string; // volume
    i: string; // interval
    x: boolean; // is final
  };
}

export interface BinanceDepth {
  e: 'depthUpdate';
  E: number;
  s: string;
  b: [string, string][]; // bids [price, quantity]
  a: [string, string][]; // asks [price, quantity]
}

export type BinanceMessage = BinanceTrade | Binance24hrTicker | BinanceKline | BinanceDepth;
