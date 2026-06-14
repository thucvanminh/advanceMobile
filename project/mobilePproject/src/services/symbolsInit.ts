import { db } from './firebase';
import { SYMBOLS } from '../utils/constants';

// Khởi tạo danh sách symbols vào Firestore (chạy một lần)
export async function initSymbols() {
  const snapshot = await db.collection('symbols').get();
  if (snapshot.empty) {
    const batch = db.batch();
    for (const symbol of SYMBOLS) {
      const ref = db.collection('symbols').doc(symbol);
      batch.set(ref, {
        symbol,
        baseAsset: symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        price: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        isActive: true,
      });
    }
    await batch.commit();
    console.log('Symbols initialized');
  }
}
