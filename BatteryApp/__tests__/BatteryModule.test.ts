/**
 * Tests for BatteryModule TypeScript bridge.
 *
 * Uses Jest with manual mocks for NativeModules and NativeEventEmitter.
 */

import { NativeModules, NativeEventEmitter } from 'react-native';

// ─── Mock NativeModules ─────────────────────────────────────────

const mockBatteryInfo = {
  batteryLevel: 85,
  batteryStatus: 'Charging',
  batteryStatusCode: 2,
  batteryHealth: 'Good',
  batteryHealthCode: 2,
  isCharging: true,
  chargingSource: 'AC Charger',
  chargingSourceCode: 1,
  temperature: 28.5,
  voltage: 3.9,
};

NativeModules.BatteryModule = {
  getBatteryInfo: jest.fn().mockResolvedValue(mockBatteryInfo),
  startTracking: jest.fn().mockResolvedValue('Tracking started'),
  stopTracking: jest.fn().mockResolvedValue('Tracking stopped'),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

// ─── Tests ──────────────────────────────────────────────────────

describe('BatteryModule (native bridge)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getBatteryInfo returns battery data', async () => {
    const { getBatteryInfo } = require('../src/native/BatteryModule');
    const data = await getBatteryInfo();

    expect(data).toEqual(mockBatteryInfo);
    expect(NativeModules.BatteryModule.getBatteryInfo).toHaveBeenCalledTimes(1);
  });

  it('startTracking returns success message', async () => {
    const { startTracking } = require('../src/native/BatteryModule');
    const result = await startTracking();

    expect(result).toBe('Tracking started');
    expect(NativeModules.BatteryModule.startTracking).toHaveBeenCalledTimes(1);
  });

  it('stopTracking returns success message', async () => {
    const { stopTracking } = require('../src/native/BatteryModule');
    const result = await stopTracking();

    expect(result).toBe('Tracking stopped');
    expect(NativeModules.BatteryModule.stopTracking).toHaveBeenCalledTimes(1);
  });

  it('getBatteryInfo handles error gracefully', async () => {
    NativeModules.BatteryModule.getBatteryInfo.mockRejectedValueOnce(
      new Error('Sensor not available'),
    );

    const { getBatteryInfo } = require('../src/native/BatteryModule');

    await expect(getBatteryInfo()).rejects.toThrow('Sensor not available');
  });

  it('startTracking handles error gracefully', async () => {
    NativeModules.BatteryModule.startTracking.mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    const { startTracking } = require('../src/native/BatteryModule');

    await expect(startTracking()).rejects.toThrow('Permission denied');
  });

  it('addBatteryListener subscribes to BatteryUpdate event', () => {
    const { addBatteryListener } = require('../src/native/BatteryModule');
    const callback = jest.fn();

    const subscription = addBatteryListener(callback);

    // Simulate event emission
    const emitter = new NativeEventEmitter(NativeModules.BatteryModule);
    emitter.emit('BatteryUpdate', mockBatteryInfo);

    expect(callback).toHaveBeenCalledWith(mockBatteryInfo);
    subscription.remove();
  });

  it('removeBatteryListeners clears all listeners', () => {
    const {
      addBatteryListener,
      removeBatteryListeners,
    } = require('../src/native/BatteryModule');

    const cb1 = jest.fn();
    const cb2 = jest.fn();

    addBatteryListener(cb1);
    addBatteryListener(cb2);
    removeBatteryListeners();

    const emitter = new NativeEventEmitter(NativeModules.BatteryModule);
    emitter.emit('BatteryUpdate', mockBatteryInfo);

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });
});
