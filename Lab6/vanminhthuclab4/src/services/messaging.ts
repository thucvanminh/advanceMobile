import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Alert, NativeModules, Platform } from 'react-native';

const { NotificationModule } = NativeModules;
const NOTES_TOPIC = 'notes';

type NotificationTapHandler = (message: FirebaseMessagingTypes.RemoteMessage) => void;

/**
 * Initialize FCM: request permission, register device, subscribe to topic.
 */
export async function initMessaging(): Promise<void> {
  // Android 13+ requires runtime permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await messaging().requestPermission();
    if (
      granted !== messaging.AuthorizationStatus.AUTHORIZED &&
      granted !== messaging.AuthorizationStatus.PROVISIONAL
    ) {
      console.log('Notification permission denied');
    }
  }

  await messaging().registerDeviceForRemoteMessages();
  await messaging().subscribeToTopic(NOTES_TOPIC);
  console.log('Subscribed to topic:', NOTES_TOPIC);
}

/**
 * Register notification handlers (foreground + background tap).
 * Returns an unsubscribe function.
 */
export function registerNotificationHandlers(
  onTap: NotificationTapHandler,
): () => void {
  // Foreground: show in-app Alert popup + native notification bar
  const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || 'Note Update',
        remoteMessage.notification.body || '',
      );
      try {
        NotificationModule.displayNotification(
          remoteMessage.notification.title,
          remoteMessage.notification.body,
        );
      } catch (e) {
        console.error('Native notification module error:', e);
      }
    }
  });

  // App opened from background notification tap
  const unsubscribeOnNotificationOpened =
    messaging().onNotificationOpenedApp(message => {
      onTap(message);
    });

  // App opened from quit state via notification tap
  messaging()
    .getInitialNotification()
    .then(message => {
      if (message) onTap(message);
    });

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnNotificationOpened();
  };
}
