// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// إعدادات Firebase من مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyD4emifuWufoNsMD0HmDuDkucnd__l5NYs",
  authDomain: "achievo-48842.firebaseapp.com",
  projectId: "achievo-48842",
  storageBucket: "achievo-48842.firebasestorage.app",
  messagingSenderId: "183275563866",
  appId: "1:183275563866:web:f35894959ec4cd5d48a163",
  measurementId: "G-4E8Q1MGSMM",
};

// 🔹 تهيئة Firebase
const app = initializeApp(firebaseConfig);

// 🔹 الخدمات اللي هنستخدمها
export const db = getFirestore(app); // قاعدة بيانات Firestore
export const auth = getAuth(app); // تسجيل الدخول / المستخدمين
