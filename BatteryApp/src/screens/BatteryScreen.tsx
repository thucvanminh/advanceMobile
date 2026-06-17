import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import {
  getBatteryInfo,
  startTracking,
  stopTracking,
  addBatteryListener,
  removeBatteryListeners,
  BatteryInfo,
} from '../native/BatteryModule';

function formatTemp(value: number): string {
  if (value < 0) return '--';
  return `${value.toFixed(1)}°C`;
}

function formatVoltage(value: number): string {
  if (value < 0) return '--';
  return `${value.toFixed(3)}V`;
}

function BatteryScreen() {
  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBatteryInfo()
      .then(data => {
        setBattery(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStart = useCallback(async () => {
    try {
      await startTracking();
      setTracking(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start tracking');
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await stopTracking();
      setTracking(false);
      removeBatteryListeners();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to stop tracking');
    }
  }, []);

  useEffect(() => {
    if (!tracking) return;
    const subscription = addBatteryListener(event => setBattery(event));
    return () => subscription.remove();
  }, [tracking]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ borderWidth: 1, borderColor: '#000', padding: 20, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          Battery Monitor
        </Text>
        <Text>Battery Level: {battery ? `${battery.batteryLevel}%` : '--'}</Text>
        <Text>Status: {battery?.batteryStatus ?? '--'}</Text>
        <Text>Health: {battery?.batteryHealth ?? '--'}</Text>
        <Text>Is Charging: {battery ? (battery.isCharging ? 'Yes' : 'No') : '--'}</Text>
        <Text>Source: {battery?.chargingSource ?? '--'}</Text>
        <Text>Temperature: {battery ? formatTemp(battery.temperature) : '--'}</Text>
        <Text>Voltage: {battery ? formatVoltage(battery.voltage) : '--'}</Text>

        <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
          <TouchableOpacity onPress={tracking ? handleStop : handleStart}>
            <Text>{tracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                const data = await getBatteryInfo();
                setBattery(data);
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            }}>
            <Text>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default BatteryScreen;
