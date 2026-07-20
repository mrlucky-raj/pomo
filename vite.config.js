export default {
  esbuild: {
    jsx: 'automatic',
  },
  envPrefix: [
    'VITE_',
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
    'measurementId',
    'databaseUrl'
  ],
  server: {
    port: 3000,
    open: true
  }
};
