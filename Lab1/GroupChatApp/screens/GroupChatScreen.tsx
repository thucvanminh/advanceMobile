import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { RootStackParamList, Message } from '../types';
import { styles } from './GroupChatScreenStyles';

type GroupChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GroupChat'>;
  route: RouteProp<RootStackParamList, 'GroupChat'>;
};

let socket: Socket | null = null;

export function GroupChatScreen({ route }: GroupChatScreenProps) {
  const { username } = route.params;
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const saved = await AsyncStorage.getItem('chatHistory');
        if (saved) {
          setMessages(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading messages:', e);
      }
    };
    loadMessages();

    socket = io('http://10.60.249.11:3000', {
      transports: ['websocket'],
    });

    socket.on('receiveMessage', async (message: Message) => {
      setMessages((prev) => {
        const updated = [...prev, message];
        AsyncStorage.setItem('chatHistory', JSON.stringify(updated)).catch(console.error);
        return updated;
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToEnd();
    }
  }, [messages.length, scrollToEnd]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !socket) {
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      username,
    };

    socket.emit('sendMessage', message);
    setMessageText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.username === username;
    const isSystem = item.isSystem;

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessage}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}>
          {!isMyMessage && <Text style={styles.username}>{item.username}</Text>}
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToEnd}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}