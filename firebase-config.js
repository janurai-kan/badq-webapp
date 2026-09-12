import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDRMEeptvrtc-RtbQf-eOEKfEusbgT-7bc",
    authDomain: "badminton-queue-2cefa.firebaseapp.com",
    projectId: "badminton-queue-2cefa",
    storageBucket: "badminton-queue-2cefa.firebasestorage.app",
    messagingSenderId: "526610085382",
    appId: "1:526610085382:web:74f9578db8cac42306f587"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };