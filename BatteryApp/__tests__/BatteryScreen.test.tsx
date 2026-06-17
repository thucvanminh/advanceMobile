/**
 * Tests for minimalist BatteryScreen UI.
 * All info as plain text, white background, bordered frame, no CSS.
 */

jest.mock('../src/native/BatteryModule', () => {
  const mockInfo = {
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

  return {
    getBatteryInfo: jest.fn().mockResolvedValue(mockInfo),
    startTracking: jest.fn().mockResolvedValue('Tracking started'),
    stopTracking: jest.fn().mockResolvedValue('Tracking stopped'),
    addBatteryListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeBatteryListeners: jest.fn(),
  };
});

jest.setTimeout(10000);

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import BatteryScreen from '../src/screens/BatteryScreen';

describe('Minimalist BatteryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title "Battery Monitor"', async () => {
    await render(<BatteryScreen />);
    await waitFor(() => expect(screen.getByText('Battery Monitor')).toBeTruthy());
  });

  it('displays battery level as text line', async () => {
    await render(<BatteryScreen />);
    await waitFor(() => expect(screen.getByText('Battery Level: 85%')).toBeTruthy());
  });

  it('shows Start Tracking and Refresh buttons', async () => {
    await render(<BatteryScreen />);
    await waitFor(() => {
      expect(screen.getByText('Start Tracking')).toBeTruthy();
      expect(screen.getByText('Refresh')).toBeTruthy();
    });
  });

  it('toggles button text when Start is pressed', async () => {
    await render(<BatteryScreen />);
    await waitFor(() => expect(screen.getByText('Start Tracking')).toBeTruthy());

    fireEvent.press(screen.getByText('Start Tracking'));

    await waitFor(() => {
      expect(screen.getByText('Stop Tracking')).toBeTruthy();
      expect(screen.queryByText('Start Tracking')).toBeNull();
    });
  });

  it('displays all battery info as text lines', async () => {
    await render(<BatteryScreen />);
    await waitFor(() => {
      expect(screen.getByText('Status: Charging')).toBeTruthy();
      expect(screen.getByText('Health: Good')).toBeTruthy();
      expect(screen.getByText('Is Charging: Yes')).toBeTruthy();
      expect(screen.getByText('Source: AC Charger')).toBeTruthy();
      expect(screen.getByText('Temperature: 28.5°C')).toBeTruthy();
      expect(screen.getByText('Voltage: 3.900V')).toBeTruthy();
    });
  });
});
