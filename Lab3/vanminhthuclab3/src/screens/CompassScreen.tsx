import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import {
  startCompass,
  stopCompass,
  addCompassListener,
  removeCompassListeners,
} from '../native/CompassModule';

function CompassScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [heading, setHeading] = useState(0);
  const rotateAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const subscription = addCompassListener(event => {
      setHeading(event.heading);
    });

    return () => {
      subscription.remove();
      removeCompassListeners();
      if (isRunning) {
        stopCompass().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: -heading,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [heading, rotateAnim]);

  const handleStart = useCallback(async () => {
    try {
      await startCompass();
      setIsRunning(true);
    } catch (error: any) {
      Alert.alert('Compass Error', error.message || 'Failed to start compass');
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await stopCompass();
      setIsRunning(false);
    } catch (error: any) {
      Alert.alert('Compass Error', error.message || 'Failed to stop compass');
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Compass</Text>
      <Text style={styles.subtitle}>
        {isRunning
          ? 'Rotate your phone to see the direction'
          : 'Tap Start to activate the compass'}
      </Text>

      <View style={styles.compassContainer}>
        <Animated.View
          style={[
            styles.compassRose,
            {transform: [{rotate: rotateAnim.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            })}]},
          ]}>
          <View style={styles.compassOuter} />
          <View style={styles.compassInner} />
          <Text style={styles.northLabel}>N</Text>
          <Text style={styles.eastLabel}>E</Text>
          <Text style={styles.southLabel}>S</Text>
          <Text style={styles.westLabel}>W</Text>
        </Animated.View>
        <View style={styles.needle}>
          <View style={styles.needleNorth} />
          <View style={styles.needleSouth} />
        </View>
      </View>

      <Text style={styles.headingText}>
        {isRunning ? `${heading.toFixed(1)}°` : '--'}
      </Text>

      <TouchableOpacity
        style={[styles.button, isRunning ? styles.buttonStop : styles.buttonStart]}
        onPress={isRunning ? handleStop : handleStart}>
        <Text style={styles.buttonText}>
          {isRunning ? 'Stop Compass' : 'Start Compass'}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  compassContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  compassRose: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  compassOuter: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4,
    borderColor: '#333',
    position: 'absolute',
  },
  compassInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#999',
    position: 'absolute',
  },
  northLabel: {
    position: 'absolute',
    top: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  eastLabel: {
    position: 'absolute',
    right: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  southLabel: {
    position: 'absolute',
    bottom: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  westLabel: {
    position: 'absolute',
    left: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  needle: {
    width: 10,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  needleNorth: {
    width: 10,
    height: 80,
    backgroundColor: '#FF3B30',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    position: 'absolute',
    top: 0,
  },
  needleSouth: {
    width: 10,
    height: 80,
    backgroundColor: '#333',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    position: 'absolute',
    bottom: 0,
  },
  headingText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonStart: {
    backgroundColor: '#34C759',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CompassScreen;
