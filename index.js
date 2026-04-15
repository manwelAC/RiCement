import { registerRootComponent } from 'expo';
import App from './App';

// Add global error handlers to catch issues before app loads
if (__DEV__) {
  // Development error handler
  console.log('RiCement App starting...');
}

const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  originalError('[Error]', ...args);
};

console.warn = (...args) => {
  originalWarn('[Warning]', ...args);
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
try {
  registerRootComponent(App);
} catch (error) {
  console.error('Failed to register root component:', error);
}
