import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Battery, Brightness } from './src/nativeModules';




type Screen = 'battery' | 'brightness';

function BatteryVisual({ percentage }: { percentage: number }) {
  const fillWidth = Math.max(4, (percentage / 100) * 160);
  const fillColor =


    percentage > 50 ? '#4CAF50' : percentage > 20 ? '#FF9800' : '#F44336';

  return (
    <View style={styles.batteryContainer}>
      <View style={styles.batteryBody}>
        <View style={styles.batteryInner}>
          <View style={[styles.batteryFill, { width: fillWidth, backgroundColor: fillColor }]} />
        </View>
      </View>
      <View style={styles.batteryNub} />
    </View>
  );
}

function BatteryScreen() {
  const [batteryPercentage, setBatteryPercentage] = useState<number | null>(null);
  const [batteryStatus, setBatteryStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchBatteryInfo = async () => {
    try {
      const percentage = await Battery.getBatteryPercentage();
      setBatteryPercentage(percentage);
      const status = await Battery.getBatteryStatus();
      setBatteryStatus(status);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to get battery info');
    }
  };

  useEffect(() => {
    fetchBatteryInfo();
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Battery Information</Text>

      {batteryPercentage !== null ? (
        <BatteryVisual percentage={batteryPercentage} />
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Battery Level</Text>
        <Text style={styles.value}>
          {batteryPercentage !== null ? `${batteryPercentage}%` : 'Loading...'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{batteryStatus || 'Loading...'}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={fetchBatteryInfo}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function BrightnessScreen() {
  const [brightness, setBrightness] = useState(0.5);

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
    try {
      await Brightness.setBrightness(value);
    } catch (err: any) {
      console.error('Failed to set brightness:', err.message);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Screen Brightness</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Brightness Level</Text>
        <Text style={styles.value}>{Math.round(brightness * 100)}%</Text>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>0%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={brightness}
          onValueChange={handleBrightnessChange}
          minimumTrackTintColor="Failed"
          maximumTrackTintColor="#CCCCCC"
          thumbTintColor="#007AFF"
        />
        <Text style={styles.sliderLabel}>100%</Text>
      </View>

      <Text style={styles.hint}>
        Drag the slider to adjust screen brightness
      </Text>
    </View>
  );
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('battery');

  return (
    <View style={styles.container}>
      {activeScreen === 'battery' ? <BatteryScreen /> : <BrightnessScreen />}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeScreen === 'battery' && styles.tabActive,
          ]}
          onPress={() => setActiveScreen('battery')}
        >
          <Text
            style={[
              styles.tabText,
              activeScreen === 'battery' && styles.tabTextActive,
            ]}
          >
            Battery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeScreen === 'brightness' && styles.tabActive,
          ]}
          onPress={() => setActiveScreen('brightness')}
        >
          <Text
            style={[
              styles.tabText,
              activeScreen === 'brightness' && styles.tabTextActive,
            ]}
          >
            Brightness
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  screen: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#888',
    width: 40,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  batteryBody: {
    width: 170,
    height: 80,
    borderWidth: 3,
    borderColor: '#333',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  batteryInner: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 3,
  },
  batteryNub: {
    width: 8,
    height: 30,
    backgroundColor: '#333',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    marginLeft: -1,
  },
});
