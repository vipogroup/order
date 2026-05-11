/**
 * סנכרון ענן (Firebase Firestore) — כדי שכל מי שפותח את האתר יראה את אותם נתונים.
 *
 * אפשרות א׳: למלא כאן (או בפריסה) את אובייקט הקונפיג.
 * אפשרות ב׳: מהאתר — כפתור «שיתוף נתונים» → הדבקת ה־JSON (נשמר בדפדפן בלבד).
 *
 * 1) Firebase Console → צרו פרויקט → הפעילו Firestore.
 * 2) Project settings → האפליקציה שלך → העתיקו את firebaseConfig.
 * 3) Firestore → Rules — חובה להגדיר הרשאות. לבדיקות פנימיות בלבד (מסוכן לציבור):
 *    match /vipo_state/{doc} { allow read, write: if true; }
 *    לפרודקשן: הגבילו לפי auth / מזהה משתמש.
 * 4) המסמך ב־Firestore: collection `vipo_state` , מזהה מסמך = קוד הארגון (ברירת מחדל main אם לא הוגדר).
 *
 * כדי לכבות סנכרון: מחקו את ההגדרה מהממשק או השאירו apiKey ריק ''.
 */
window.VIPO_FIREBASE_STORAGE_KEY = 'VIPO_FIREBASE_CONFIG';
/** מזהה מסמך Firestore — נשמר בדפדפן; אותו קוד בכל המכשירים */
window.VIPO_ORG_DOC_STORAGE_KEY = 'VIPO_ORG_DOC_ID';

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
