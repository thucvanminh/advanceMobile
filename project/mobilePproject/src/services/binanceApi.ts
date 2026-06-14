// Binance API service for real trading
// Sử dụng HMAC-SHA256 signature cho authenticated requests

import { BINANCE_API_BASE, BINANCE_TESTNET_API_BASE } from '../utils/constants';
import CryptoJS from 'crypto-js';

interface AccountInfo {
  balances: { asset: string; free: string; locked: string }[];
  canTrade: boolean;
}

interface OrderResult {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  type: string;
  side: string;
}

class BinanceApiService {
  private apiKey: string = '';
  private secretKey: string = '';
  private baseUrl: string = BINANCE_TESTNET_API_BASE;
  private useTestnet: boolean = true;

  setKeys(apiKey: string, secretKey: string, testnet: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.useTestnet = testnet;
    this.baseUrl = testnet ? BINANCE_TESTNET_API_BASE : BINANCE_API_BASE;
  }

  clearKeys() {
    this.apiKey = '';
    this.secretKey = '';
  }

  hasKeys(): boolean {
    return !!(this.apiKey && this.secretKey);
  }

  private sign(queryString: string): string {
    return CryptoJS.HmacSHA256(queryString, this.secretKey).toString(CryptoJS.enc.Hex);
  }

  private async signedRequest<T>(method: string, endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const timestamp = Date.now();
    const queryParams = { ...params, timestamp };
    const queryString = Object.entries(queryParams)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const signature = this.sign(queryString);
    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      method,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getAccount(): Promise<AccountInfo> {
    return this.signedRequest<AccountInfo>('GET', '/api/v3/account');
  }

  async testConnection(): Promise<boolean> {
    try {
      const account = await this.getAccount();
      return account.canTrade;
    } catch {
      return false;
    }
  }

  async createOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: number;
    price?: number;
  }): Promise<OrderResult> {
    const orderParams: Record<string, any> = {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      quantity: params.quantity,
    };

    if (params.type === 'LIMIT' && params.price) {
      orderParams.price = params.price;
      orderParams.timeInForce = 'GTC';
    }

    return this.signedRequest<OrderResult>('POST', '/api/v3/order', orderParams);
  }

  async getBalance(asset: string = 'USDT'): Promise<number> {
    const account = await this.getAccount();
    const balance = account.balances.find(b => b.asset === asset);
    return balance ? parseFloat(balance.free) : 0;
  }
}

export default new BinanceApiService();
