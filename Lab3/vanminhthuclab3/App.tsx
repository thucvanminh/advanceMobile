import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import NfcScreen from './src/screens/NfcScreen';
import CompassScreen from './src/screens/CompassScreen';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{title: 'Lab 3'}} />
        <Stack.Screen
          name="NfcScreen"
          component={NfcScreen}
          options={{title: 'NFC Reader'}} />
        <Stack.Screen
          name="CompassScreen"
          component={CompassScreen}
          options={{title: 'Compass'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
