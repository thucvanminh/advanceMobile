

import { NativeModules, NativeEventEmitter } from 'react-native';

const { BatteryModule } = NativeModules;
const batteryEventEmitter = new NativeEventEmitter(BatteryModule);


export interface BatteryInfo {
  batteryLevel: number;           
  batteryStatus: string;          
  batteryStatusCode: number;
  batteryHealth: string;          
  batteryHealthCode: number;
  isCharging: boolean;
  chargingSource: string;         
  chargingSourceCode: number;
}


export const getBatteryInfo = (): Promise<BatteryInfo> =>
  BatteryModule.getBatteryInfo();

export const startTracking = (): Promise<string> =>
  BatteryModule.startTracking();

export const stopTracking = (): Promise<string> =>
  BatteryModule.stopTracking();


export const addBatteryListener = (
  callback: (event: BatteryInfo) => void,
) => {
  return batteryEventEmitter.addListener('BatteryUpdate', callback);
};

export const removeBatteryListeners = () => {
  batteryEventEmitter.removeAllListeners('BatteryUpdate');
};
