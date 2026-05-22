import {NativeModules, NativeEventEmitter} from 'react-native';

const {CompassModule} = NativeModules;
const compassEventEmitter = new NativeEventEmitter(CompassModule);

export const startCompass = (): Promise<string> => CompassModule.startCompass();
export const stopCompass = (): Promise<string> => CompassModule.stopCompass();

export const addCompassListener = (callback: (event: {heading: number}) => void) => {
  return compassEventEmitter.addListener('CompassUpdate', callback);
};

export const removeCompassListeners = () => {
  compassEventEmitter.removeAllListeners('CompassUpdate');
};
