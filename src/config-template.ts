const config = {
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
    databaseURL: 'https://YOUR_PROJECT_ID.firebaseio.com',
    projectId: 'YOUR_FIREBASE_PROJECT_ID',
    storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID'
  },
  FEATURES: {
    presence: true,
    typing: true,
    reactions: true,
    threads: true,
    gifsLinksOnly: true,
    fcm: false
  },
  LIMITS: {
    maxMessageChars: 4000,
    maxUploadMB: 10,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  },
  THEME: {
    brandName: 'StaticQuasar931',
    darkDefault: true
  },
  RETENTION: {
    messageDays: null,
    softDeleteVisibleToAdminsOnly: true
  },
  RATE: {
    messagesPerMinute: 20,
    uploadsPerMinute: 3
  }
};

export default config;
