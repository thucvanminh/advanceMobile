/**
 * Local Firestore watcher → FCM sender
 *
 * Watches the 'notes' collection in real-time using Firebase Admin SDK
 * and sends FCM topic notifications when notes are created/updated/deleted.
 *
 * Usage: node functions/local-sender.js
 *
 * Requires: functions/service-account-key.json (Firebase service account)
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ─── Init Admin SDK with service account ──────────────────────────────────

const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('ERROR: service-account-key.json not found at', serviceAccountPath);
  console.error('Download it from Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const TOPIC = 'notes';

// ─── Helper: send FCM topic notification ──────────────────────────────────

async function sendTopicNotification(title, body, data = {}) {
  const message = {
    notification: { title, body },
    topic: TOPIC,
    data,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`  ✓ Sent: "${title}" → ${response}`);
    return response;
  } catch (error) {
    console.error(`  ✗ Failed: ${error.message}`);
  }
}

// ─── Watch Firestore ──────────────────────────────────────────────────────

console.log('━━━ FCM Local Sender ━━━');
console.log(`Watching 'notes' collection (topic: ${TOPIC})...`);
console.log('Press Ctrl+C to stop.\n');

let isProcessing = false;

db.collection('notes').onSnapshot(
  snapshot => {
    if (isProcessing) return;
    isProcessing = true;

    snapshot.docChanges().forEach(async change => {
      const note = change.doc.data();
      const noteId = change.doc.id;
      const title = note.title || 'Untitled';

      switch (change.type) {
        case 'added':
          console.log(`[ADDED] "${title}"`);
          await sendTopicNotification(
            '📝 New Note',
            title,
            { noteId, eventType: 'created' },
          );
          break;

        case 'modified':
          console.log(`[MODIFIED] "${title}"`);
          await sendTopicNotification(
            '✏️ Note Updated',
            `${title} has been modified`,
            { noteId, eventType: 'updated' },
          );
          break;

        case 'removed':
          console.log(`[REMOVED] "${title}"`);
          await sendTopicNotification(
            '🗑️ Note Deleted',
            `${title} has been removed`,
            { noteId, eventType: 'deleted' },
          );
          break;
      }
    });

    isProcessing = false;
  },
  error => {
    console.error('Firestore listener error:', error);
  },
);
