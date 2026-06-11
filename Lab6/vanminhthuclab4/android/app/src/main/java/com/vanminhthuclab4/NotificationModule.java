package com.vanminhthuclab4;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class NotificationModule extends ReactContextBaseJavaModule {
  private static final String CHANNEL_ID = "default";

  NotificationModule(ReactApplicationContext context) {
    super(context);
    createNotificationChannel();
  }

  @Override
  public String getName() {
    return "NotificationModule";
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      CharSequence name = "Default Channel";
      String description = "Channel for default notifications";
      int importance = NotificationManager.IMPORTANCE_DEFAULT;
      NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
      channel.setDescription(description);
      NotificationManager notificationManager =
          getReactApplicationContext().getSystemService(NotificationManager.class);
      notificationManager.createNotificationChannel(channel);
    }
  }

  @ReactMethod
  public void displayNotification(String title, String body) {
    ReactApplicationContext context = getReactApplicationContext();
    NotificationCompat.Builder builder =
        new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(com.vanminhthuclab4.R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true);

    NotificationManager notificationManager =
        (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    notificationManager.notify((int) System.currentTimeMillis(), builder.build());
  }
}
