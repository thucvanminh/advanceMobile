/**
 * Seed sample data into Firestore
 * Usage: node scripts/seed-data.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'materials', 'cryptotradingdemo-aaeeb-firebase-adminsdk-fbsvc-a23de30ca4.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  const ts = Date.now();
  const HOUR = 3600000;

  // Get the admin user
  const usersSnap = await db.collection('users').get();
  let userId = null;
  usersSnap.forEach(doc => { if (doc.data().role === 'admin') userId = doc.id; });
  if (!userId) { console.log('No admin user found'); return; }

  console.log(`Seeding for user: ${userId}`);

  // 1. Symbols collection
  const symbols = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: 67123.45, change24h: 2.34, high24h: 67800, low24h: 65200, volume24h: 28450.12, isActive: true },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: 3456.78, change24h: -1.23, high24h: 3520, low24h: 3380, volume24h: 185200.5, isActive: true },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', price: 145.23, change24h: 5.67, high24h: 150, low24h: 138, volume24h: 5200000, isActive: true },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', price: 578.90, change24h: -0.45, high24h: 590, low24h: 565, volume24h: 890000, isActive: true },
    { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', price: 0.6234, change24h: 1.12, high24h: 0.64, low24h: 0.61, volume24h: 125000000, isActive: true },
    { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', price: 0.4567, change24h: -2.34, high24h: 0.47, low24h: 0.44, volume24h: 85000000, isActive: true },
    { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', price: 0.1234, change24h: 8.90, high24h: 0.13, low24h: 0.11, volume24h: 320000000, isActive: true },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', price: 34.56, change24h: 3.45, high24h: 36, low24h: 33, volume24h: 4500000, isActive: true },
    { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', price: 7.89, change24h: -0.78, high24h: 8.1, low24h: 7.6, volume24h: 12000000, isActive: true },
    { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT', price: 0.7890, change24h: 1.56, high24h: 0.80, low24h: 0.77, volume24h: 65000000, isActive: true },
  ];

  const batch1 = db.batch();
  for (const s of symbols) {
    batch1.set(db.collection('symbols').doc(s.symbol), s);
  }
  await batch1.commit();
  console.log(`✅ ${symbols.length} symbols seeded`);

  // 2. Orders (3 sample orders)
  const orders = [
    {
      userId, symbol: 'BTCUSDT', side: 'buy', type: 'market', quantity: 0.1,
      price: 0, status: 'filled', mode: 'paper',
      filledPrice: 65000, filledAt: ts - 2 * HOUR, createdAt: ts - 2 * HOUR,
      total: 6500,
    },
    {
      userId, symbol: 'ETHUSDT', side: 'buy', type: 'market', quantity: 1.5,
      price: 0, status: 'filled', mode: 'paper',
      filledPrice: 3400, filledAt: ts - 5 * HOUR, createdAt: ts - 5 * HOUR,
      total: 5100,
    },
    {
      userId, symbol: 'SOLUSDT', side: 'sell', type: 'limit', quantity: 10,
      price: 150, status: 'pending', mode: 'paper',
      filledPrice: 0, createdAt: ts - 1 * HOUR,
      total: 0,
    },
  ];

  for (const order of orders) {
    const ref = await db.collection('orders').add(order);
    console.log(`  Order ${ref.id}: ${order.side} ${order.quantity} ${order.symbol} [${order.status}]`);
  }
  console.log(`✅ ${orders.length} orders seeded`);

  // 3. Transactions
  const transactions = [
    {
      userId, type: 'buy', symbol: 'BTCUSDT', amount: 0.1, price: 65000,
      total: 6500, balanceBefore: 10000, balanceAfter: 3500,
      orderId: 'sample1', mode: 'paper', createdAt: ts - 2 * HOUR,
    },
    {
      userId, type: 'buy', symbol: 'ETHUSDT', amount: 1.5, price: 3400,
      total: 5100, balanceBefore: 3500, balanceAfter: 0, // used all USDT + BTC was credited
      orderId: 'sample2', mode: 'paper', createdAt: ts - 5 * HOUR,
    },
  ];

  for (const tx of transactions) {
    const ref = await db.collection('transactions').add(tx);
    console.log(`  Transaction ${ref.id}: ${tx.type} ${tx.amount} ${tx.symbol}`);
  }
  console.log(`✅ ${transactions.length} transactions seeded`);

  // 4. Alerts
  const alerts = [
    {
      userId, symbol: 'BTCUSDT', type: 'above', value: 70000,
      status: 'active', createdAt: ts - 3 * HOUR,
    },
    {
      userId, symbol: 'ETHUSDT', type: 'below', value: 3000,
      status: 'active', createdAt: ts - 4 * HOUR,
    },
    {
      userId, symbol: 'SOLUSDT', type: 'above', value: 160,
      status: 'triggered', triggeredAt: ts - 0.5 * HOUR, createdAt: ts - 12 * HOUR,
    },
  ];

  for (const alert of alerts) {
    const ref = await db.collection('alerts').add(alert);
    console.log(`  Alert ${ref.id}: ${alert.symbol} ${alert.type} ${alert.value} [${alert.status}]`);
  }
  console.log(`✅ ${alerts.length} alerts seeded`);

  // 5. Notifications
  const notifs = [
    {
      userId, type: 'price_alert', title: 'SOLUSDT',
      body: 'SOLUSDT đã vượt ngưỡng 160 USDT', read: true,
      createdAt: ts - 0.5 * HOUR,
    },
    {
      userId, type: 'order_filled', title: 'BTCUSDT',
      body: 'Lệnh Buy 0.1 BTC đã khớp với giá 65,000 USDT', read: false,
      createdAt: ts - 2 * HOUR,
    },
    {
      userId, type: 'order_filled', title: 'ETHUSDT',
      body: 'Lệnh Buy 1.5 ETH đã khớp với giá 3,400 USDT', read: false,
      createdAt: ts - 5 * HOUR,
    },
  ];

  for (const n of notifs) {
    const ref = await db.collection('notifications').add(n);
    console.log(`  Notification ${ref.id}: ${n.title} - ${n.body.slice(0, 40)}`);
  }
  console.log(`✅ ${notifs.length} notifications seeded`);

  // 6. Update user paper balance to reflect holdings
  await db.collection('users').doc(userId).update({
    'paperBalance.USDT': 3500,
    'paperBalance.BTC': 0.1,
    'paperBalance.ETH': 1.5,
  });
  console.log(`✅ User balance updated (USDT: 3,500, BTC: 0.1, ETH: 1.5)`);

  console.log('\n🎉 All sample data seeded!');
  console.log(`Check Firestore: https://console.firebase.google.com/project/cryptotradingdemo-aaeeb/firestore/data`);
}

seed().catch(e => { console.error('Error:', e); process.exit(1); });
