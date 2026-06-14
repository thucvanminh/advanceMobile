/**
 * Firebase Setup Script v2 (for firebase-admin v14)
 * Uses service account to:
 * 1. Create Firestore indexes
 * 2. Create admin user in Firestore
 *
 * Usage: node scripts/setup-firebase.js <admin-email>
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { GoogleAuth } = require('googleapis').google.auth;
const path = require('path');
const fs = require('fs');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'materials', 'cryptotradingdemo-aaeeb-firebase-adminsdk-fbsvc-a23de30ca4.json');
const INDEXES_PATH = path.join(__dirname, '..', 'firestore.indexes.json');

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

// Init Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();
const projectId = serviceAccount.project_id;

async function getAccessToken() {
  const ga = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await ga.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function createIndexes() {
  console.log('Creating Firestore indexes...');

  const indexesData = JSON.parse(fs.readFileSync(INDEXES_PATH, 'utf8'));
  const indexes = indexesData.indexes;

  if (!indexes || indexes.length === 0) {
    console.log('  No indexes found in firestore.indexes.json');
    return;
  }

  const token = await getAccessToken();

  for (const idx of indexes) {
    const collectionId = idx.collectionGroup;
    const fields = idx.fields.map(f => ({
      fieldPath: f.fieldPath,
      order: f.order === 'ASCENDING' ? 'ASCENDING' : 'DESCENDING',
    }));

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${collectionId}/indexes`;

    const body = { fields, queryScope: 'COLLECTION' };

    console.log(`  Creating index for ${collectionId}: ${fields.map(f => f.fieldPath + ' ' + f.order).join(', ')}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (response.ok) {
        console.log(`    ✅ Created (operation: ${result.name?.split('/').pop()})`);
      } else if (result.error?.message?.includes('already exists')) {
        console.log(`    ⏭️  Already exists`);
      } else {
        console.log(`    ❌ ${result.error?.message || JSON.stringify(result)}`);
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
    }
  }
}

async function createAdminUser(email) {
  if (!email) {
    console.log('\n⚠️  No email provided. Usage: node scripts/setup-firebase.js <admin-email>');
    return;
  }

  console.log(`\nCreating admin user for: ${email}`);

  try {
    let uid;
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      console.log(`  ✅ User exists in Auth: ${uid}`);
    } catch {
      // Create user in Auth
      const userRecord = await auth.createUser({
        email,
        password: 'Admin123!',
      });
      uid = userRecord.uid;
      console.log(`  ✅ Created Auth user: ${uid} (default password: Admin123!)`);
    }

    // Set admin role in Firestore
    await db.collection('users').doc(uid).set({
      email,
      displayName: email.split('@')[0],
      role: 'admin',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      settings: { theme: 'dark', currency: 'USDT', notificationsEnabled: true },
      paperBalance: { USDT: 10000 },
    }, { merge: true });

    console.log(`  ✅ Admin user document created in Firestore`);
    console.log(`  📧 Email: ${email}`);
    console.log(`  🔑 Password: Admin123! (if new account)`);
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

async function main() {
  const email = process.argv[2];

  console.log('🚀 Firebase Setup Script');
  console.log(`📋 Project: ${projectId}`);
  console.log('');

  await createIndexes();
  if (email) {
    await createAdminUser(email);
  }

  console.log('\n✅ Setup complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
