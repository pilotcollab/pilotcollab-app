import { registerRootComponent } from 'expo';
import 'expo/build/Expo.fx';
import 'mock-local-storage'; // Polyfill para localStorage

// Mock localStorage se não existir
if (typeof window !== 'undefined' && !window.localStorage) {
  window.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

import App from './app/index';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);