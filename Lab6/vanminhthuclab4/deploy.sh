#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "  Deploy Firebase Cloud Functions & Firestore"
echo "  Project: vanminhthuclab4"
echo "================================================"

cd "$(dirname "$0")"

# Ensure firebase CLI is authenticated
if ! firebase projects:list &>/dev/null; then
  echo ""
  echo "❌ Firebase CLI not authenticated."
  echo "   Run 'firebase login' first, then retry."
  exit 1
fi

echo ""
echo "✅ Firebase CLI authenticated"
echo ""

# Deploy Firestore indexes first (includes composite index)
echo "━━━ Deploying Firestore indexes..."
echo "     Composite index: notes (userId ASC, created_at DESC)"
firebase deploy --only firestore:indexes --project vanminhthuclab4

echo ""
echo "━━━ Deploying Cloud Functions..."
echo "     Function: onNoteWritten (Firestore trigger)"
echo "     Trigger: notes/{noteId} onWrite"
firebase deploy --only functions --project vanminhthuclab4

echo ""
echo "━━━ Deploying Firestore security rules..."
firebase deploy --only firestore:rules --project vanminhthuclab4

echo ""
echo "================================================"
echo "  ✅ Deployment complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Rebuild the Android app: cd android && ./gradlew assembleDebug"
echo "  2. Install & run on device"
echo "  3. Upon first login, app will request notification permission"
echo "  4. FCM token saved to Firestore → user doc"
echo "  5. Cloud Function will send notifications on note changes"
