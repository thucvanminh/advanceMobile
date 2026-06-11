/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging';
import { name as appName } from './app.json';

// Register background message handler (fires when app is in background/killed)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
