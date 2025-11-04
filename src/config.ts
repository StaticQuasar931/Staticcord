const config = {
  firebase: {
    apiKey: 'AIzaSyDG-YAOIURzxvjyL9vyqfXHB-OrkzSAO3Q',
    authDomain: 'staticquasar931-discord.firebaseapp.com',
    databaseURL: 'https://staticquasar931-discord-default-rtdb.firebaseio.com',
    projectId: 'staticquasar931-discord',
    storageBucket: 'staticquasar931-discord.firebasestorage.app',
    messagingSenderId: '397220487467',
    appId: '1:397220487467:web:d58f28b0c7fb103540656e',
    measurementId: 'G-9VSBB75DHL'
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
