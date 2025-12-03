const config = {
  firebase: {
    apiKey: 'AIzaSyDvWeBouqx0xaODaQUPbtIXRgoPV0m3-jQ',
    authDomain: 'staticcord-48db3.firebaseapp.com',
    databaseURL: 'https://staticcord-48db3-default-rtdb.firebaseio.com',
    projectId: 'staticcord-48db3',
    storageBucket: 'staticcord-48db3.firebasestorage.app',
    messagingSenderId: '815263541941',
    appId: '1:815263541941:web:b9339fbd49b3ebd5a0acfc',
    measurementId: 'G-Z41Q7LBGHM'
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
