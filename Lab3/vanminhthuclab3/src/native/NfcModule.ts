import {NativeModules, NativeEventEmitter} from 'react-native';

const {NfcModule} = NativeModules;
const nfcEventEmitter = new NativeEventEmitter(NfcModule);

export const startNfcListener = (): Promise<string> => NfcModule.startNfcListener();
export const stopNfcListener = (): Promise<string> => NfcModule.stopNfcListener();

export const addNfcListener = (callback: (event: {
  tagId: string;
  techList: string[];
  message: string;
}) => void) => {
  return nfcEventEmitter.addListener('NfcDiscovered', callback);
};

export const removeNfcListeners = () => {
  nfcEventEmitter.removeAllListeners('NfcDiscovered');
};
