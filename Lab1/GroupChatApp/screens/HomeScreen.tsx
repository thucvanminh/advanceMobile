import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { RootStackParamList } from '../types';
import { styles } from './HomeScreenStyles';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const loadSavedUser = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('username');
        if (savedUsername) {
          setUsername(savedUsername);
        }
      } catch (error) {
        console.error('Error loading username:', error);
      }
    };
    loadSavedUser();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsLoading(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handleStartChat = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      await AsyncStorage.setItem('username', username.trim());

      socketRef.current = io('http://10.60.249.11:3000', {
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        socketRef.current?.emit('joinGroup', username.trim());
        navigation.navigate('GroupChat', { username: username.trim() });
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Connection error:', error);
        Alert.alert('Error', 'Cannot connect to server. Make sure server is running.');
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to connect');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Chat</Text>
      <Text style={styles.subtitle}>Enter your name to start</Text>

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="words"
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleStartChat}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Start Chat</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}