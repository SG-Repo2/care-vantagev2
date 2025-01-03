declare var __DEV__: boolean;

// Add other global type declarations as needed
declare global {
  interface Window {
    __DEV__?: boolean;
  }
}

export {};
