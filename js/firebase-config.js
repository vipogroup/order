/**
 * VIPO — קונפיגורציית Firebase (אתר סטטי / GitHub Pages)
 *
 * ┌─ אבטחה: אל תעלו לריפו ציבורי מפתחות אמיתיים אם חוששים לחשיפה. אפשרויות: ┐
 * │  • GitHub Actions: בנייה שמזריקה ערכים מ־Repository secrets לקובץ זה בעת deploy   │
 * │  • או השארת השדות ריקים כאן + הדבקה חד־פעמית במכשיר דרך «שיתוף נתונים» (localStorage) │
 * └──────────────────────────────────────────────────────────────────────────────────┘
 *
 * בפרויקט Firebase:
 * 1) Authentication → Sign-in method → Anonymous — חובה (Firestore Rules דורשות auth).
 * 2) Firestore → יצירת מסד; Rules — העתיקו מ־firestore.rules בשורש הפרויקט ופרסמו.
 * 3) Project settings → האפליקציה שלכם (Web) → firebaseConfig.
 */
window.VIPO_FIREBASE_STORAGE_KEY = 'VIPO_FIREBASE_CONFIG';

window.VIPO_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

(function applyStoredFirebaseConfig() {
  try {
    var raw = localStorage.getItem(window.VIPO_FIREBASE_STORAGE_KEY);
    if (!raw) return;
    var o = JSON.parse(raw);
    if (!o || typeof o !== 'object' || !o.apiKey || !o.projectId) return;
    window.VIPO_FIREBASE = {
      apiKey: String(o.apiKey || ''),
      authDomain: String(o.authDomain || ''),
      projectId: String(o.projectId || ''),
      storageBucket: String(o.storageBucket || ''),
      messagingSenderId: String(o.messagingSenderId || ''),
      appId: String(o.appId || '')
    };
  } catch (e) {
    /* נתון שבור — מתעלמים */
  }
})();
