import { NativeModules } from 'react-native';

const { BatteryModule, BrightnessModule } = NativeModules;

export interface BatteryModuleType {
  getBatteryPercentage: () => Promise<number>;
  getBatteryStatus: () => Promise<string>;
}

export interface BrightnessModuleType {
  setBrightness: (value: number) => Promise<boolean>;
  getBrightness: () => Promise<number>;
  getSystemBrightness: () => Promise<number>;
}

export const Battery = BatteryModule as BatteryModuleType;
export const Brightness = BrightnessModule as BrightnessModuleType;
