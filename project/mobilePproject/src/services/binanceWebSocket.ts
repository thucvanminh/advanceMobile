// Binance WebSocket service
// Kết nối real-time price từ Binance public WebSocket

import { BINANCE_WS_BASE, SYMBOLS } from '../utils/constants';

type PriceCallback = (symbol: string, price: number) => void;
type TickerCallback = (symbol: string, data: { price: number; change24h: number }) => void;

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private priceCallbacks: PriceCallback[] = [];
  private tickerCallbacks: TickerCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // 1s initial, doubles each attempt
  private isConnected = false;
  private shouldReconnect = true;
  private subscribedStreams: string[] = [];

  connect(symbols: string[] = SYMBOLS as unknown as string[]) {
    this.shouldReconnect = true;
    this.subscribedStreams = symbols.map(s => `${s.toLowerCase()}@trade`);
    this._connect();
  }

  private _connect() {
    if (this.ws) {
      this.ws.close();
    }

    const streams = this.subscribedStreams.join('/');
    const url = `${BINANCE_WS_BASE}/${streams}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('Binance WS connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event: WebSocketMessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.e === 'trade') {
          const symbol = data.s;
          const price = parseFloat(data.p);
          this.priceCallbacks.forEach(cb => cb(symbol, price));
        }
        // 24hr ticker updates come from a different stream
        if (data.e === '24hrTicker') {
          const symbol = data.s;
          const price = parseFloat(data.c);
          const change24h = parseFloat(data.P);
          this.tickerCallbacks.forEach(cb => cb(symbol, { price, change24h }));
        }
      } catch (e) {
        console.warn('WS parse error:', e);
      }
    };

    this.ws.onerror = (error: Event) => {
      console.warn('Binance WS error:', error);
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => this._connect(), delay);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  onPriceUpdate(callback: PriceCallback) {
    this.priceCallbacks.push(callback);
    return () => {
      this.priceCallbacks = this.priceCallbacks.filter(cb => cb !== callback);
    };
  }

  onTickerUpdate(callback: TickerCallback) {
    this.tickerCallbacks.push(callback);
    return () => {
      this.tickerCallbacks = this.tickerCallbacks.filter(cb => cb !== callback);
    };
  }
}

export default new BinanceWebSocketService();
