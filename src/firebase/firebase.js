import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAbmqZMT1gQxbKt6a3-jIP03m9kb0g8PQg",
  authDomain: "chat-6ca50.firebaseapp.com",
  projectId: "chat-6ca50",
  storageBucket: "chat-6ca50.appspot.com",
  messagingSenderId: "892265154356",
  appId: "1:892265154356:web:a152dc85f540f7c4424761"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

export { storage };