const functions = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

// ─── Helper: send notification ──────────────────────────────────────────────

async function sendNoteNotification(noteId, eventType, noteData, userId) {
  if (!userId) return;

  try {
    // Fetch user's FCM token
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;
    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}`);
      return;
    }

    const title = noteData?.title || 'Untitled';
    let notificationTitle, notificationBody;

    switch (eventType) {
      case 'created':
        notificationTitle = '📝 New Note';
        notificationBody = `"${title}" has been created`;
        break;
      case 'updated':
        notificationTitle = '✏️ Note Updated';
        notificationBody = `"${title}" has been modified`;
        break;
      case 'deleted':
        notificationTitle = '🗑️ Note Deleted';
        notificationBody = `"${title}" has been deleted`;
        break;
      default:
        return;
    }

    const message = {
      token: fcmToken,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        noteId: noteId || '',
        eventType: eventType,
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`Notification sent to ${userId}: ${response}`);
  } catch (error) {
    // If token is invalid, remove it
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.log(`Removing invalid FCM token for user ${userId}`);
      await admin.firestore().collection('users').doc(userId).update({
        fcmToken: admin.firestore.FieldValue.delete(),
      });
    } else {
      console.error(`Error sending notification:`, error);
    }
  }
}

// ─── Firestore Trigger: notes/{noteId} ─────────────────────────────────────

exports.onNoteWritten = functions.onDocumentWritten('notes/{noteId}', async (event) => {
  const { noteId } = event.params;
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  let eventType;
  let noteData;
  let userId;

  if (!before && after) {
    // CREATE
    eventType = 'created';
    noteData = after;
    userId = after?.userId;
    console.log(`Note ${noteId} created by user ${userId}`);
  } else if (before && !after) {
    // DELETE
    eventType = 'deleted';
    noteData = before;
    userId = before?.userId;
    console.log(`Note ${noteId} deleted, owner: ${userId}`);
  } else if (before && after) {
    // UPDATE
    eventType = 'updated';
    noteData = after;
    userId = after?.userId;
    console.log(`Note ${noteId} updated by user ${userId}`);
  } else {
    return;
  }

  await sendNoteNotification(noteId, eventType, noteData, userId);
});
