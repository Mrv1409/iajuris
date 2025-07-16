// firebase/firebaseConfig.ts
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBH9tJzWDPzEN3_5Ot9Aht0Me_vK33cpwc',
  authDomain: 'iajuris.firebaseapp.com',
  projectId: 'iajuris',
  storageBucket: 'iajuris.firebasestorage.app',
  messagingSenderId: '1066309052074',
  appId: '1:1066309052074:web:4805d4471ea07f1ef492d3',
};

export const app = initializeApp(firebaseConfig);
export const firebaseApp = app;

