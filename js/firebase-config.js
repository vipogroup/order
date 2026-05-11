/**
 * סנכרון ענן (Firebase Firestore)
 *
 * חשוב להבין — GitHub לעומת Firebase:
 * - GitHub / GitHub Pages שומרים רק את קבצי האתר (דפים, JS). כמויות במלאי, מכירות והזמנות
 *   לא נשמרות "בגיט" אוטומטית מהדפדפן, וזה לא מה שאתר סטטי עושה.
 * - Firebase Firestore הוא מסד נתונים בענן (של Google). האתר שולח אליו כל שינוי — ואז
 *   כל טלפון שפותח את אותו אתר + אותו קונפיג רואה את אותם נתונים (אחרי קוד הכניסה באפליקציה).
 *
 * מה הכי נוח לצוות עם הרבה מכשירים:
 * 1) ממלאים פעם אחת את אובייקט הקונפיג כאן (או בפריסה).
 * 2) commit + push ל־GitHub — מעכשיו כל מי שנכנס לקישור כבר טוען את הקונפיג מהאתר.
 * 3) בכל מכשיר רק קוד הכניסה למערכת (1985) — בלי הדבקת JSON בכל טלפון.
 *
 * חלופה: כפתור «שיתוף נתונים» באתר → הדבקת JSON (נשמר בדפדפן בלבד — צריך לחזור על זה בכל מכשיר).
 *
 * הגדרת Firebase:
 * 1) Firebase Console → פרויקט → Firestore.
 * 2) Project settings → אפליקציית Web → firebaseConfig.
 * 3) Firestore → Rules (פנימי בלבד): match /vipo_state/{doc} { allow read, write: if true; }
 * 4) מסמך: collection `vipo_state` , מזהה מסמך קבוע בקוד האפליקציה.
 *
 * כדי לכבות סנכרון: השאירו apiKey ריק '' או מחקו מהממשק.
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
