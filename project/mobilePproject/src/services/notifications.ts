import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

// Tạo notification channel cho Android
export async function setupNotifications() {
  await notifee.createChannel({
    id: 'price_alerts',
    name: 'Cảnh báo giá',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });
}

// Gửi local notification
export async function showPriceAlertNotification(symbol: string, message: string) {
  await notifee.displayNotification({
    title: symbol,
    body: message,
    android: {
      channelId: 'price_alerts',
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
}

// Gửi notification cho order filled
export async function showOrderNotification(title: string, body: string) {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'price_alerts',
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
}

// Handle notification press events
export function setupNotificationEvents() {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      // User tapped on notification
      console.log('Notification pressed:', detail.notification?.title);
    }
  });
}
