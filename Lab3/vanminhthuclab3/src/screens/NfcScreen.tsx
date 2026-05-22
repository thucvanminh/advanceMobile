import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import {
  startNfcListener,
  stopNfcListener,
  addNfcListener,
  removeNfcListeners,
} from '../native/NfcModule';

function NfcScreen() {
  const [isListening, setIsListening] = useState(false);
  const [tagData, setTagData] = useState<{
    tagId: string;
    techList: string[];
    message: string;
  } | null>(null);

  useEffect(() => {
    const subscription = addNfcListener(event => {
      setTagData(event);
    });

    return () => {
      subscription.remove();
      removeNfcListeners();
      if (isListening) {
        stopNfcListener().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = useCallback(async () => {
    try {
      setTagData(null);
      await startNfcListener();
      setIsListening(true);
    } catch (error: any) {
      Alert.alert('NFC Error', error.message || 'Failed to start NFC');
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await stopNfcListener();
      setIsListening(false);
    } catch (error: any) {
      Alert.alert('NFC Error', error.message || 'Failed to stop NFC');
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>NFC Reader</Text>
      <Text style={styles.subtitle}>
        {isListening
          ? 'Place an NFC tag near your phone...'
          : 'Tap Start to begin reading NFC tags'}
      </Text>

      <TouchableOpacity
        style={[styles.button, isListening ? styles.buttonStop : styles.buttonStart]}
        onPress={isListening ? handleStop : handleStart}>
        <Text style={styles.buttonText}>
          {isListening ? 'Stop NFC' : 'Start NFC'}
        </Text>
      </TouchableOpacity>

      {tagData && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Tag Detected!</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tag ID:</Text>
            <Text style={styles.resultValue}>{tagData.tagId}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tech Types:</Text>
            <Text style={styles.resultValue}>
              {tagData.techList.join(', ') || 'N/A'}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>NDEF Message:</Text>
            <Text style={styles.resultValue}>
              {tagData.message || 'No NDEF message'}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 30,
  },
  buttonStart: {
    backgroundColor: '#007AFF',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: 300,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#007AFF',
  },
  resultRow: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    color: '#333',
  },
});

export default NfcScreen;
