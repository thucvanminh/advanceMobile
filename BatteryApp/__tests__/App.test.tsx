/**
 * App-level smoke test.
 */

jest.mock('../src/native/BatteryModule', () => ({
  getBatteryInfo: jest.fn().mockResolvedValue({
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
  }),
  startTracking: jest.fn().mockResolvedValue('Tracking started'),
  stopTracking: jest.fn().mockResolvedValue('Tracking stopped'),
  addBatteryListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeBatteryListeners: jest.fn(),
}));

jest.setTimeout(10000);

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';

it('renders without crashing', async () => {
  await render(<App />);
  await waitFor(() => expect(screen.getByText('Battery Monitor')).toBeTruthy());
});
