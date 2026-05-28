import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDNLtODxOIE6AFTvZ-md3kwDbKKv5zE5Sg',
  authDomain: 'wafar-6049c.firebaseapp.com',
  projectId: 'wafar-6049c',
  storageBucket: 'wafar-6049c.firebasestorage.app',
  messagingSenderId: '329464437093',
  appId: '1:329464437093:web:b6b180f41ce03fff3da98c',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
