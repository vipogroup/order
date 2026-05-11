const STORAGE_KEY_V2 = 'vipo_inventory_state_v2';
const STORAGE_KEY_V1 = 'vipo_inventory_sales_v1';
const STORAGE_KEY_SAMPLES = 'vipo_samples_catalog_v1';

/** כניסה לממשק — בלי קוד אין גישה (נשמר לטאב בלבד ב־sessionStorage) */
const VIPO_ACCESS_PIN = '1985';
const VIPO_GATE_SESSION_KEY = 'VIPO_GATE_OK';
/** מפתח עבודה ב־Firestore: SHA-256(קוד_הגישה|salt) — אותו קוד כניסה = אותו מסלול נתונים */
const VIPO_WORKSPACE_SALT = 'vipo-order-sharing-v1';

/** סנכרון ענן (Firestore); כבוי כש־firebase-config ללא apiKey */
let vipoApplyingRemote = false;
const vipoCloudCtx = {
  enabled: false,
  pushTimer: null,
  unsubs: [],
  db: null,
  workspaceKey: null,
  rootRef: null,
  lastLocalPushAt: 0,
  pendingWhileOffline: false
};

const vipoRemoteCache = {
  meta: null,
  sales: new Map(),
  orders: new Map(),
  arrivals: new Map(),
  payments: null,
  products: new Map()
};
let vipoRemoteMergeTimer = null;

/** debounce לדחיפה לענן (0 = מיידי אחרי אותו tick) */
const VIPO_CLOUD_PUSH_DEBOUNCE_MS = 0;

let vipoSyncUiState = 'init';
let vipoSyncSavedTimer = null;
let vipoOfflineToastShown = false;
const LEGACY_DORON_ID = 'doron-table-180x90x70';
const DORON_ID = 'doron-table-80x90x70';
const LAST_PANEL_KEY = 'vipo_last_panel';
const VALID_PANELS = ['dashboard', 'nissim', 'doron', 'received', 'gaps', 'orders', 'sales', 'samples', 'payments'];

/** localStorage: vipo_debug_layout = "1" — הדפסת אירועי layout לקונסול (סיבוב מסך / BFCache) */
function layoutDebug(...args) {
  try {
    if (localStorage.getItem('vipo_debug_layout') === '1') console.log('[VIPO layout]', ...args);
  } catch (_) { /* private mode */ }
}

function getActivePanelId() {
  const fromNav = [...els.navBtns].find(b => b.classList.contains('is-active'))?.dataset?.panel;
  if (fromNav && VALID_PANELS.includes(fromNav)) return fromNav;
  try {
    const last = sessionStorage.getItem(LAST_PANEL_KEY);
    if (last && VALID_PANELS.includes(last)) return last;
  } catch (_) { /* quota / private */ }
  return 'dashboard';
}

/** אחרי סיבוב מסך / חזרה ממטמון — מסנכרן שוב פאנלים וגלילה (תיקון ידוע ב־Safari iOS) */
function recoverLayoutAfterViewportChange(reason) {
  const id = getActivePanelId();
  layoutDebug(reason, { w: window.innerWidth, h: window.innerHeight, panel: id });
  showPanel(id, { scrollMode: 'instant' });
}

function initLayoutRecovery() {
  let lastPortrait = window.innerHeight >= window.innerWidth;
  let resizeTimer = null;

  window.addEventListener('orientationchange', () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => recoverLayoutAfterViewportChange('orientationchange'));
    });
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const portrait = window.innerHeight >= window.innerWidth;
      if (portrait !== lastPortrait) {
        lastPortrait = portrait;
        recoverLayoutAfterViewportChange('resize-portrait-toggle');
      }
    }, 200);
  });

  window.addEventListener('pageshow', ev => {
    if (!ev.persisted) return;
    layoutDebug('pageshow bfcache');
    recoverLayoutAfterViewportChange('pageshow-bfcache');
    renderAll();
  });
}

const BUSINESS_LABEL = { nissim: 'ניסים', doron: 'דורון' };

const ORDER_STATUSES = ['חדש', 'מאושר', 'בהכנה', 'נשלח', 'הושלם', 'בוטל'];

/** יומן תשלומים: אלינו (שילם) / החזרה ממנו אליו */
const PAY_FLOW_TO_ME = 'to_me';
const PAY_FLOW_FROM_ME = 'from_me';

const openingInventory = [
  { id: 'father-2layer-100x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 2 מדפים', original: '2-LAYERS WORKTABLE', size: '100*60*90CM', qtyPerCtn: 1, ttlCtns: 4, openingQty: 4, unit: 'PC', priceUsd: 57.14, amountUsd: 228.56, cbmCtn: 0.10, ttlCbm: 0.39 },
  { id: 'father-2layer-120x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 2 מדפים', original: '2-LAYERS WORKTABLE', size: '120*60*90CM', qtyPerCtn: 1, ttlCtns: 3, openingQty: 3, unit: 'PC', priceUsd: 62.50, amountUsd: 187.50, cbmCtn: 0.12, ttlCbm: 0.35 },
  { id: 'father-2layer-140x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 2 מדפים', original: '2-LAYERS WORKTABLE', size: '140*60*90CM', qtyPerCtn: 1, ttlCtns: 3, openingQty: 3, unit: 'PC', priceUsd: 67.86, amountUsd: 203.58, cbmCtn: 0.14, ttlCbm: 0.41 },
  { id: 'father-2layer-160x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 2 מדפים', original: '2-LAYERS WORKTABLE', size: '160*60*90CM', qtyPerCtn: 1, ttlCtns: 3, openingQty: 3, unit: 'PC', priceUsd: 73.21, amountUsd: 219.63, cbmCtn: 0.15, ttlCbm: 0.46 },
  { id: 'father-2layer-180x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 2 מדפים', original: '2-LAYERS WORKTABLE', size: '180*60*90CM', qtyPerCtn: 1, ttlCtns: 130, openingQty: 130, unit: 'PC', priceUsd: 78.57, amountUsd: 10214.10, cbmCtn: 0.17, ttlCbm: 22.48 },
  { id: 'father-2layer-200x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 2 מדפים', original: '2-LAYERS WORKTABLE', size: '200*60*90CM', qtyPerCtn: 1, ttlCtns: 5, openingQty: 5, unit: 'PC', priceUsd: 85.71, amountUsd: 428.55, cbmCtn: 0.19, ttlCbm: 0.96 },
  { id: 'father-3layer-60x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 3 מדפים', original: '3-LAYERS WORKTABLE', size: '60*60*90CM', qtyPerCtn: 1, ttlCtns: 5, openingQty: 5, unit: 'PC', priceUsd: 58.93, amountUsd: 294.65, cbmCtn: 0.07, ttlCbm: 0.36 },
  { id: 'father-3layer-80x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 3 מדפים', original: '3-LAYERS WORKTABLE', size: '80*60*90CM', qtyPerCtn: 1, ttlCtns: 6, openingQty: 6, unit: 'PC', priceUsd: 62.50, amountUsd: 375.00, cbmCtn: 0.09, ttlCbm: 0.56 },
  { id: 'father-3layer-100x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 3 מדפים', original: '3-LAYERS WORKTABLE', size: '100*60*90CM', qtyPerCtn: 1, ttlCtns: 4, openingQty: 4, unit: 'PC', priceUsd: 66.07, amountUsd: 264.28, cbmCtn: 0.12, ttlCbm: 0.47 },
  { id: 'father-3layer-120x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 3 מדפים', original: '3-LAYERS WORKTABLE', size: '120*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 73.21, amountUsd: 146.42, cbmCtn: 0.14, ttlCbm: 0.28 },
  { id: 'father-3layer-140x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 3 מדפים', original: '3-LAYERS WORKTABLE', size: '140*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 78.57, amountUsd: 157.14, cbmCtn: 0.16, ttlCbm: 0.32 },
  { id: 'father-3layer-160x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 3 מדפים', original: '3-LAYERS WORKTABLE', size: '160*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 87.50, amountUsd: 175.00, cbmCtn: 0.18, ttlCbm: 0.37 },
  { id: 'father-3layer-180x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 3 מדפים', original: '3-LAYERS WORKTABLE', size: '180*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 92.86, amountUsd: 185.72, cbmCtn: 0.21, ttlCbm: 0.42 },
  { id: 'father-3layer-200x60x90', business: 'nissim', source: 'ניסים', product: 'שולחן עבודה נירוסטה 3 מדפים', original: '3-LAYERS WORKTABLE', size: '200*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 101.79, amountUsd: 203.58, cbmCtn: 0.23, ttlCbm: 0.46 },
  { id: 'father-single-sink-60x60x90', business: 'nissim', source: 'ניסים', product: 'כיור נירוסטה יחיד', original: 'SINGLE SINK', size: '60*60*90CM', qtyPerCtn: 1, ttlCtns: 10, openingQty: 10, unit: 'PC', priceUsd: 33.00, amountUsd: 330.00, cbmCtn: 0.18, ttlCbm: 1.79 },
  { id: 'father-cabinet-100x60x90', business: 'nissim', source: 'ניסים', product: 'ארון עבודה נירוסטה', original: 'WORK CABINET', size: '100*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 86.00, amountUsd: 172.00, cbmCtn: 0.14, ttlCbm: 0.29 },
  { id: 'father-cabinet-120x60x90', business: 'nissim', source: 'ניסים', product: 'ארון עבודה נירוסטה', original: 'WORK CABINET', size: '120*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 81.00, amountUsd: 162.00, cbmCtn: 0.17, ttlCbm: 0.34 },
  { id: 'father-cabinet-150x60x90', business: 'nissim', source: 'ניסים', product: 'ארון עבודה נירוסטה', original: 'WORK CABINET', size: '150*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 113.00, amountUsd: 226.00, cbmCtn: 0.21, ttlCbm: 0.42 },
  { id: 'father-cabinet-180x60x90', business: 'nissim', source: 'ניסים', product: 'ארון עבודה נירוסטה', original: 'WORK CABINET', size: '180*60*90CM', qtyPerCtn: 1, ttlCtns: 2, openingQty: 2, unit: 'PC', priceUsd: 93.00, amountUsd: 186.00, cbmCtn: 0.25, ttlCbm: 0.51 },
  { id: DORON_ID, business: 'doron', source: 'דורון', product: 'שולחן דורון', original: 'DORON WORKTABLE', size: '80*90*70CM', qtyPerCtn: '', ttlCtns: '', openingQty: 78, unit: 'PC', priceUsd: null, amountUsd: null, cbmCtn: null, ttlCbm: null }
];

/** דוגמאות (¥ / US$) — לא משפיע על מלאי. שלוש הזמנות: א׳ / ב׳ / ג׳ FedEx אוויר. */
const SAMPLE_BATCH_ORDER_A = 'הזמנה א׳';
const SAMPLE_BATCH_ORDER_B = 'הזמנה ב׳';
const SAMPLE_BATCH_ORDER_AIR = 'הזמנה ג׳ · FedEx אוויר';

const SAMPLES_CATALOG = [
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'VCT-L50S', desc: 'כורסת עיסוי לבן/זהב', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 9317, lineTotal: 9317, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'VCT-889Pro', desc: 'כורסת עיסוי לבן/אפור', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 4873, lineTotal: 4873, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'IA-6120HD', desc: 'סאונדבר', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 1638, lineTotal: 1638, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'M50', desc: 'שואב רובוטי', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 1759, lineTotal: 1759, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'SC-616DE', desc: 'מיקסר 16 ל׳', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 700, lineTotal: 700, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'SM-1576', desc: 'מיקסר 10 ל׳ אדום', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 799, lineTotal: 799, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'E1212', desc: 'סט רמקול עמוד + בס', qty: 1, unit: 'SET', currency: 'CNY', unitPrice: null, lineTotal: 2365, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'IHDWFAB2 010', desc: 'מיטה מתנפחת', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 360, lineTotal: 360, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'EC5188', desc: 'גלשן חשמלי', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 19359, lineTotal: 19359, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'Mengqi17.2', desc: 'אוהל מתנפח', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 3800, lineTotal: 3800, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'RTK2WT 1800', desc: 'שולחן נירוסטה 180×70×92', qty: 38, unit: 'PC', currency: 'USD', unitPrice: 91, lineTotal: 3458, ref: 'ME004# VC', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_A, sku: 'RTK2WT 1800', desc: 'שולחן נירוסטה 180×70×92', qty: 38, unit: 'PC', currency: 'USD', unitPrice: 91, lineTotal: 3458, ref: 'ME003# YB', kind: 'product' },

  { batch: SAMPLE_BATCH_ORDER_B, sku: 'RT-WC-180', desc: 'גלגלים לשולחן', qty: 2, unit: 'PC', currency: 'USD', unitPrice: 94.5, lineTotal: 189, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'F203DH', desc: 'שואב ידני לח/יבש', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 850, lineTotal: 850, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'BVC-T20Pro', desc: 'שואב קיטור', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 1165, lineTotal: 1165, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'V501', desc: 'שואב רובוטי', qty: 2, unit: 'PC', currency: 'CNY', unitPrice: 1700, lineTotal: 3400, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'IA-8360DMAX', desc: 'סאונדבר 7.1', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 2450, lineTotal: 2450, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'TSAC-012N8B-01', desc: 'מזגן סולארי 12K BTU', qty: 1, unit: 'SET', currency: 'USD', unitPrice: 340, lineTotal: 340, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'TSAC-018N8B-01', desc: 'מזגן סולארי 18K BTU', qty: 1, unit: 'SET', currency: 'USD', unitPrice: 450, lineTotal: 450, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'TSAC-024N8B-01', desc: 'מזגן סולארי 24K BTU', qty: 1, unit: 'SET', currency: 'USD', unitPrice: 600, lineTotal: 600, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'E1212', desc: 'סט רמקול עמוד + בס', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 2315, lineTotal: 2315, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'A10', desc: 'שואב רובוטי Ultra', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 2556, lineTotal: 2556, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'DWFB-01', desc: 'מיטה מתנפחת', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 529.73, lineTotal: 529.73, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'IST-01', desc: 'שולחן מתנפח', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 529.73, lineTotal: 529.73, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'ISS-04', desc: 'ספה מתנפחת 150×76', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 211.89, lineTotal: 211.89, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'ISS-06', desc: 'ספה מתנפחת 160×90', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 494.41, lineTotal: 494.41, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'ISS-07', desc: 'ספה מתנפחת 160×90', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 353.15, lineTotal: 353.15, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'BJKL808', desc: 'מכונית על שלט כחול', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 2116.9, lineTotal: 2116.9, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'KP-6699', desc: 'מכונית על שלט לבן', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 493, lineTotal: 493, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: '9FT-PT (1+2+3)', desc: 'בריכת ביליארד 9 רגל', qty: 1, unit: 'SET', currency: 'CNY', unitPrice: 2343.5, lineTotal: 2343.5, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'SC-616DE', desc: 'מיקסר 16 ל׳ ×2 סטים', qty: 2, unit: 'SET', currency: 'CNY', unitPrice: 700, lineTotal: 1400, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'משלוח', desc: 'שולחן נירוסטה', qty: 1, unit: '—', currency: 'USD', unitPrice: null, lineTotal: 685, ref: '', kind: 'freight' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'משלוח', desc: 'סאונדבר', qty: 1, unit: '—', currency: 'CNY', unitPrice: null, lineTotal: 100, ref: '', kind: 'freight' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'משלוח', desc: 'מזגנים', qty: 1, unit: '—', currency: 'USD', unitPrice: null, lineTotal: 100, ref: '', kind: 'freight' },
  { batch: SAMPLE_BATCH_ORDER_B, sku: 'משלוח', desc: 'רובוט A10', qty: 1, unit: '—', currency: 'CNY', unitPrice: null, lineTotal: 50, ref: '', kind: 'freight' },

  { batch: SAMPLE_BATCH_ORDER_AIR, sku: 'V501', desc: 'שואב רובוטי', qty: 1, unit: 'PC', currency: 'CNY', unitPrice: 1700, lineTotal: 1700, ref: '', kind: 'product' },
  { batch: SAMPLE_BATCH_ORDER_AIR, sku: 'FedEx', desc: 'משלוח אוויר', qty: 1, unit: '—', currency: 'CNY', unitPrice: null, lineTotal: 1595, ref: '', kind: 'freight' }
];

/** עותק עריכה של דוגמאות (מקומי בדפדפן); ברירת מחדל נטענת מ־SAMPLES_CATALOG */
let samplesCatalog = [];

function cloneDefaultSamplesWithIds() {
  return SAMPLES_CATALOG.map(row => ({ ...row, id: newId() }));
}

function loadSamplesCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAMPLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        samplesCatalog = parsed.map(row => ({
          batch: row.batch,
          sku: row.sku,
          desc: row.desc,
          qty: row.qty,
          unit: row.unit,
          currency: row.currency,
          unitPrice: row.unitPrice,
          lineTotal: row.lineTotal,
          ref: row.ref ?? '',
          kind: row.kind === 'freight' ? 'freight' : 'product',
          id: row.id || newId()
        }));
        return;
      }
    }
  } catch (e) {
    console.error(e);
  }
  samplesCatalog = cloneDefaultSamplesWithIds();
  saveSamplesCatalog();
}

function saveSamplesCatalog() {
  try {
    localStorage.setItem(STORAGE_KEY_SAMPLES, JSON.stringify(samplesCatalog));
  } catch (e) {
    console.error(e);
  }
  scheduleVipoCloudPush();
}

function deleteSampleRow(id) {
  if (!id || !samplesCatalog.some(r => r.id === id)) return;
  if (!confirm('למחוק שורה זו מרשימת הדוגמאות?')) return;
  samplesCatalog = samplesCatalog.filter(r => r.id !== id);
  saveSamplesCatalog();
  renderSamplesTable();
  showToast('השורה נמחקה');
}

let sales = [];
let orders = [];
/** כמויות שהגיעו בפועל אצלך; אם אין מפתח — נחשב כמו ההזמנה */
let receivedByItemId = {};
/** יומני תשלומים, שער דולר, עלויות דורון */
let payments = defaultPaymentsState();

function defaultPaymentsState() {
  return {
    usdToIls: 3.7,
    nissimLedger: [],
    doronLedger: [],
    doronProductIls: 0,
    doronShippingIls: 0,
    doronExtrasIls: 0
  };
}

function numOr(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLedgerEntry(row) {
  if (!row || typeof row !== 'object') return null;
  const amount = numOr(row.amountIls ?? row.amount, 0);
  if (amount < 0) return null;
  let flow = row.flow === PAY_FLOW_FROM_ME ? PAY_FLOW_FROM_ME : PAY_FLOW_TO_ME;
  if (row.direction === 'out' || row.kind === 'refund') flow = PAY_FLOW_FROM_ME;
  return {
    id: String(row.id || newId()),
    date: String(row.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    amountIls: amount,
    flow,
    note: String(row.note ?? '').trim()
  };
}

function mergePaymentsState(raw) {
  const d = defaultPaymentsState();
  if (!raw || typeof raw !== 'object') return d;
  const rate = Number(raw.usdToIls);
  if (Number.isFinite(rate) && rate > 0) d.usdToIls = rate;
  if (Array.isArray(raw.nissimLedger)) {
    d.nissimLedger = raw.nissimLedger.map(normalizeLedgerEntry).filter(Boolean);
  }
  if (Array.isArray(raw.doronLedger)) {
    d.doronLedger = raw.doronLedger.map(normalizeLedgerEntry).filter(Boolean);
  }
  d.doronProductIls = Math.max(0, numOr(raw.doronProductIls, 0));
  d.doronShippingIls = Math.max(0, numOr(raw.doronShippingIls, 0));
  d.doronExtrasIls = Math.max(0, numOr(raw.doronExtrasIls, 0));
  return d;
}

function ledgerTotalIls(ledger) {
  if (!Array.isArray(ledger)) return 0;
  return ledger.reduce((s, r) => s + numOr(r.amountIls, 0), 0);
}

function ledgerSumByFlow(ledger, flow) {
  if (!Array.isArray(ledger)) return 0;
  return ledger.reduce((s, r) => {
    const f = r.flow === PAY_FLOW_FROM_ME ? PAY_FLOW_FROM_ME : PAY_FLOW_TO_ME;
    return f === flow ? s + numOr(r.amountIls, 0) : s;
  }, 0);
}

function flowLabel(flow) {
  return flow === PAY_FLOW_FROM_ME ? 'החזרה ממני' : 'שילם / אליי';
}

/** עלות מפעל $ לניסים לפי כמות שהגיעה / הוזמנה × amountUsd לשורה */
function factoryCostUsdNissimByReceived() {
  return inventoryForBusiness('nissim').reduce((sum, item) => {
    const amt = numOr(item.amountUsd, NaN);
    const ord = item.openingQty;
    if (!Number.isFinite(amt) || ord <= 0) return sum;
    const rec = getReceivedQty(item.id);
    return sum + (rec / ord) * amt;
  }, 0);
}

function doronTotalCostIls() {
  return numOr(payments.doronProductIls, 0) + numOr(payments.doronShippingIls, 0) + numOr(payments.doronExtrasIls, 0);
}

const els = {
  panels: document.querySelectorAll('.panel'),
  navBtns: document.querySelectorAll('.app-nav__btn'),
  inventoryBodyNissim: document.getElementById('inventoryBodyNissim'),
  inventoryBodyDoron: document.getElementById('inventoryBodyDoron'),
  inventorySearchNissim: document.getElementById('inventorySearchNissim'),
  salesBody: document.getElementById('salesBody'),
  salesSearch: document.getElementById('salesSearch'),
  emptySalesState: document.getElementById('emptySalesState'),
  ordersBody: document.getElementById('ordersBody'),
  emptyOrdersState: document.getElementById('emptyOrdersState'),
  orderForm: document.getElementById('orderForm'),
  orderBusiness: document.getElementById('orderBusiness'),
  orderDate: document.getElementById('orderDate'),
  orderCustomer: document.getElementById('orderCustomer'),
  orderPhone: document.getElementById('orderPhone'),
  orderStatus: document.getElementById('orderStatus'),
  orderNotes: document.getElementById('orderNotes'),
  orderLinesContainer: document.getElementById('orderLinesContainer'),
  addOrderLineBtn: document.getElementById('addOrderLineBtn'),
  orderFilterBusiness: document.getElementById('orderFilterBusiness'),
  orderFilterStatus: document.getElementById('orderFilterStatus'),
  saleFormNissim: document.getElementById('saleFormNissim'),
  saleFormDoron: document.getElementById('saleFormDoron'),
  saleFormGlobal: document.getElementById('saleFormGlobal'),
  saleBusinessSelect: document.getElementById('saleBusinessSelect'),
  dashNissimOpening: document.getElementById('dashNissimOpening'),
  dashNissimSold: document.getElementById('dashNissimSold'),
  dashNissimRev: document.getElementById('dashNissimRev'),
  dashDoronOpening: document.getElementById('dashDoronOpening'),
  dashDoronSold: document.getElementById('dashDoronSold'),
  dashDoronRev: document.getElementById('dashDoronRev'),
  statSoldQty: document.getElementById('statSoldQty'),
  statKnownCost: document.getElementById('statKnownCost'),
  statRevenue: document.getElementById('statRevenue'),
  statOpenOrders: document.getElementById('statOpenOrders'),
  doronRemainingHero: document.getElementById('doronRemainingHero'),
  dashNissimReceived: document.getElementById('dashNissimReceived'),
  dashNissimShortage: document.getElementById('dashNissimShortage'),
  dashNissimPhysical: document.getElementById('dashNissimPhysical'),
  dashDoronReceived: document.getElementById('dashDoronReceived'),
  dashDoronShortage: document.getElementById('dashDoronShortage'),
  dashDoronPhysical: document.getElementById('dashDoronPhysical'),
  statOrderedTotal: document.getElementById('statOrderedTotal'),
  statReceivedTotal: document.getElementById('statReceivedTotal'),
  statShortageTotal: document.getElementById('statShortageTotal'),
  statPhysicalTotal: document.getElementById('statPhysicalTotal'),
  receivedBodyNissim: document.getElementById('receivedBodyNissim'),
  receivedBodyDoron: document.getElementById('receivedBodyDoron'),
  receivedSaveBtn: document.getElementById('receivedSaveBtn'),
  gapsBody: document.getElementById('gapsBody'),
  exportGapsCsvBtn: document.getElementById('exportGapsCsvBtn'),
  printReportBtn: document.getElementById('printReportBtn'),
  exportBackupBtn: document.getElementById('exportBackupBtn'),
  importBackupInput: document.getElementById('importBackupInput'),
  exportSalesCsvBtn: document.getElementById('exportSalesCsvBtn'),
  exportInventoryNissimCsvBtn: document.getElementById('exportInventoryNissimCsvBtn'),
  exportInventoryDoronCsvBtn: document.getElementById('exportInventoryDoronCsvBtn'),
  exportInventoryFullCsvBtn: document.getElementById('exportInventoryFullCsvBtn'),
  exportOrdersCsvBtn: document.getElementById('exportOrdersCsvBtn'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  resetSalesBtn: document.getElementById('resetSalesBtn'),
  resetOrdersBtn: document.getElementById('resetOrdersBtn'),
  clearInventorySearchBtn: document.getElementById('clearInventorySearchBtn'),
  paymentsUsdRate: document.getElementById('paymentsUsdRate'),
  paymentsSaveRateBtn: document.getElementById('paymentsSaveRateBtn'),
  exportPaymentsCsvBtn: document.getElementById('exportPaymentsCsvBtn'),
  paymentsNissimAddForm: document.getElementById('paymentsNissimAddForm'),
  paymentsDoronAddForm: document.getElementById('paymentsDoronAddForm'),
  paymentsDoronCostsForm: document.getElementById('paymentsDoronCostsForm'),
  payDoronProductIls: document.getElementById('payDoronProductIls'),
  payDoronShippingIls: document.getElementById('payDoronShippingIls'),
  payDoronExtrasIls: document.getElementById('payDoronExtrasIls'),
  paymentsNissimLedgerBody: document.getElementById('paymentsNissimLedgerBody'),
  paymentsDoronLedgerBody: document.getElementById('paymentsDoronLedgerBody'),
  paymentsNissimLedgerEmpty: document.getElementById('paymentsNissimLedgerEmpty'),
  paymentsDoronLedgerEmpty: document.getElementById('paymentsDoronLedgerEmpty'),
  paySumNissimPaidIn: document.getElementById('paySumNissimPaidIn'),
  paySumNissimGoods: document.getElementById('paySumNissimGoods'),
  paySumNissimShort: document.getElementById('paySumNissimShort'),
  paySumNissimCredit: document.getElementById('paySumNissimCredit'),
  paySumNissimRefunded: document.getElementById('paySumNissimRefunded'),
  paySumNissimCreditRemain: document.getElementById('paySumNissimCreditRemain'),
  paySumNissimRev: document.getElementById('paySumNissimRev'),
  paySumNissimGross: document.getElementById('paySumNissimGross'),
  paySumDoronPaidIn: document.getElementById('paySumDoronPaidIn'),
  paySumDoronInv: document.getElementById('paySumDoronInv'),
  paySumDoronShort: document.getElementById('paySumDoronShort'),
  paySumDoronCredit: document.getElementById('paySumDoronCredit'),
  paySumDoronRefunded: document.getElementById('paySumDoronRefunded'),
  paySumDoronCreditRemain: document.getElementById('paySumDoronCreditRemain'),
  paySumDoronProfit: document.getElementById('paySumDoronProfit'),
  paySumDoronSoldQty: document.getElementById('paySumDoronSoldQty'),
  payNissimPaidIn: document.getElementById('payNissimPaidIn'),
  payNissimGoods: document.getElementById('payNissimGoods'),
  payNissimShort: document.getElementById('payNissimShort'),
  payNissimCredit: document.getElementById('payNissimCredit'),
  payNissimRefunded: document.getElementById('payNissimRefunded'),
  payNissimCreditRemain: document.getElementById('payNissimCreditRemain'),
  payNissimRev: document.getElementById('payNissimRev'),
  payNissimGrossProfit: document.getElementById('payNissimGrossProfit'),
  payDoronInv: document.getElementById('payDoronInv'),
  payDoronPaidIn: document.getElementById('payDoronPaidIn'),
  payDoronShort: document.getElementById('payDoronShort'),
  payDoronCredit: document.getElementById('payDoronCredit'),
  payDoronRefunded: document.getElementById('payDoronRefunded'),
  payDoronCreditRemain: document.getElementById('payDoronCreditRemain'),
  payDoronProfitOnInv: document.getElementById('payDoronProfitOnInv'),
  payDoronSold: document.getElementById('payDoronSold'),
  payDoronRev: document.getElementById('payDoronRev'),
  payDoronRemaining: document.getElementById('payDoronRemaining'),
  samplesBody: document.getElementById('samplesBody'),
  samplesSearch: document.getElementById('samplesSearch'),
  exportSamplesCsvBtn: document.getElementById('exportSamplesCsvBtn')
};

let toastHideTimer;
function showToast(message, ms = 2800) {
  const el = document.getElementById('appToast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-visible'));
  clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => {
    el.classList.remove('is-visible');
    setTimeout(() => {
      el.hidden = true;
    }, 280);
  }, ms);
}

function loadState() {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const p = JSON.parse(rawV2);
      const sales = Array.isArray(p.sales) ? migrateSalesItemIds(p.sales) : [];
      const orders = Array.isArray(p.orders) ? p.orders : [];
      let received = {};
      const ver = Number(p.version) || 2;
      if (ver >= 3 && p.receivedByItemId && typeof p.receivedByItemId === 'object') {
        received = { ...p.receivedByItemId };
      }
      const pay = mergePaymentsState(p.payments);
      return { sales, orders, receivedByItemId: received, payments: pay };
    }
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const p = JSON.parse(rawV1);
      const s = Array.isArray(p.sales) ? migrateSalesItemIds(p.sales) : [];
      return { sales: s, orders: [], receivedByItemId: {}, payments: defaultPaymentsState() };
    }
  } catch (e) {
    console.error(e);
  }
  return { sales: [], orders: [], receivedByItemId: {}, payments: defaultPaymentsState() };
}

function migrateSalesItemIds(list) {
  return list.map(sale => {
    let itemId = sale.itemId;
    if (itemId === LEGACY_DORON_ID) itemId = DORON_ID;
    return { ...sale, itemId };
  });
}

function saveState() {
  const payload = {
    version: 4,
    savedAt: new Date().toISOString(),
    sales,
    orders,
    receivedByItemId,
    payments
  };
  /** מטמון מקומי + גיבוי; כשהענן פעיל — Firestore הוא מקור האמת בין מכשירים */
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
  } catch (e) {
    console.error(e);
  }
  scheduleVipoCloudPush();
}

function getLocalSavedAt() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) return '';
    return String(JSON.parse(raw).savedAt || '');
  } catch (_) {
    return '';
  }
}

async function deriveVipoWorkspaceKey(accessPin) {
  const pin = String(accessPin || '').trim();
  if (!pin) throw new Error('no-workspace-pin');
  if (!globalThis.crypto?.subtle?.digest) throw new Error('crypto-unavailable');
  const text = pin + '|' + VIPO_WORKSPACE_SALT;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function resetRemoteCache() {
  vipoRemoteCache.meta = null;
  vipoRemoteCache.sales = new Map();
  vipoRemoteCache.orders = new Map();
  vipoRemoteCache.arrivals = new Map();
  vipoRemoteCache.payments = null;
  vipoRemoteCache.products = new Map();
}

function toFirestoreSafe(data) {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(x => toFirestoreSafe(x));
  const o = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    o[k] = toFirestoreSafe(v);
  }
  return o;
}

function clearCloudUnsubs() {
  if (!Array.isArray(vipoCloudCtx.unsubs)) return;
  vipoCloudCtx.unsubs.forEach(u => {
    try {
      u();
    } catch (_) {
      /* */
    }
  });
  vipoCloudCtx.unsubs = [];
}

function buildReceivedByItemIdFromArrivalsCache() {
  const out = {};
  for (const [id, row] of vipoRemoteCache.arrivals) {
    const qty = Number(row?.qty);
    if (!Number.isFinite(qty)) continue;
    const it = getItem(id);
    if (!it) continue;
    const v = Math.floor(qty);
    if (v !== it.openingQty) out[id] = v;
  }
  return out;
}

function buildRemoteCloudPayload() {
  if (!vipoRemoteCache.meta?.savedAt) return null;
  const samples = [...vipoRemoteCache.products.values()];
  return {
    version: 5,
    savedAt: vipoRemoteCache.meta.savedAt,
    sales: [...vipoRemoteCache.sales.values()].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    ),
    orders: [...vipoRemoteCache.orders.values()].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    ),
    receivedByItemId: buildReceivedByItemIdFromArrivalsCache(),
    payments: vipoRemoteCache.payments ? mergePaymentsState(vipoRemoteCache.payments) : defaultPaymentsState(),
    samplesCatalog: samples.length ? samples : undefined
  };
}

function applyFromRemoteCachesFull() {
  const payload = buildRemoteCloudPayload();
  if (!payload) return;
  applyVipoCloudDocument(payload);
}

function remoteCachesUpdated() {
  if (!vipoCloudCtx.enabled) return;
  clearTimeout(vipoRemoteMergeTimer);
  vipoRemoteMergeTimer = setTimeout(() => {
    vipoRemoteMergeTimer = null;
    void tryApplyRemoteFromCaches();
  }, 120);
}

async function tryApplyRemoteFromCaches() {
  if (!vipoCloudCtx.enabled || !vipoCloudCtx.db || !vipoCloudCtx.workspaceKey) return;
  if (Date.now() - vipoCloudCtx.lastLocalPushAt < 900) return;
  try {
    await hydrateInventoryFromServer(vipoCloudCtx.db, vipoCloudCtx.workspaceKey);
  } catch (e) {
    console.error(e);
    setVipoSyncState('error');
    return;
  }
  if (!vipoRemoteCache.meta?.savedAt) return;
  const remote = String(vipoRemoteCache.meta.savedAt || '');
  const local = getLocalSavedAt();
  if (remote && remote > local) {
    applyFromRemoteCachesFull();
    if (navigator.onLine) setVipoSyncState('connected');
    showToast('עודכנו נתונים ממכשיר אחר', 2600);
  }
}

async function hydrateInventoryFromServer(db, ws) {
  resetRemoteCache();
  const root = db.collection('inventory').doc(ws);
  const metaSnap = await root.collection('settings').doc('meta').get();
  if (!metaSnap.exists) return false;
  vipoRemoteCache.meta = metaSnap.data();
  const [salesSn, ordSn, arrSn, paySn, prodSn] = await Promise.all([
    root.collection('sales').get(),
    root.collection('orders').get(),
    root.collection('arrivals').get(),
    root.collection('payments').doc('summary').get(),
    root.collection('products').get()
  ]);
  salesSn.forEach(d => {
    if (d.exists) vipoRemoteCache.sales.set(d.id, { ...d.data(), id: d.id });
  });
  ordSn.forEach(d => {
    if (d.exists) vipoRemoteCache.orders.set(d.id, { ...d.data(), id: d.id });
  });
  arrSn.forEach(d => {
    if (d.exists) vipoRemoteCache.arrivals.set(d.id, d.data());
  });
  if (paySn.exists) vipoRemoteCache.payments = paySn.data();
  prodSn.forEach(d => {
    if (d.exists) vipoRemoteCache.products.set(d.id, { ...d.data(), id: d.id });
  });
  return true;
}

function wireInventoryCloudListeners(db, ws) {
  clearCloudUnsubs();
  const root = db.collection('inventory').doc(ws);
  vipoCloudCtx.rootRef = root;
  const onListenErr = err => {
    console.error(err);
    setVipoSyncState('error');
    showToast('שגיאה בקריאת הענן — נמשיך עם מטמון מקומי', 4500);
  };

  vipoCloudCtx.unsubs.push(
    root.collection('settings').doc('meta').onSnapshot(snap => {
      vipoRemoteCache.meta = snap.exists ? snap.data() : null;
      remoteCachesUpdated();
    }, onListenErr)
  );
  vipoCloudCtx.unsubs.push(
    root.collection('sales').onSnapshot(snap => {
      vipoRemoteCache.sales.clear();
      snap.forEach(d => vipoRemoteCache.sales.set(d.id, { ...d.data(), id: d.id }));
      remoteCachesUpdated();
    }, onListenErr)
  );
  vipoCloudCtx.unsubs.push(
    root.collection('orders').onSnapshot(snap => {
      vipoRemoteCache.orders.clear();
      snap.forEach(d => vipoRemoteCache.orders.set(d.id, { ...d.data(), id: d.id }));
      remoteCachesUpdated();
    }, onListenErr)
  );
  vipoCloudCtx.unsubs.push(
    root.collection('arrivals').onSnapshot(snap => {
      vipoRemoteCache.arrivals.clear();
      snap.forEach(d => vipoRemoteCache.arrivals.set(d.id, d.data()));
      remoteCachesUpdated();
    }, onListenErr)
  );
  vipoCloudCtx.unsubs.push(
    root.collection('products').onSnapshot(snap => {
      vipoRemoteCache.products.clear();
      snap.forEach(d => vipoRemoteCache.products.set(d.id, { ...d.data(), id: d.id }));
      remoteCachesUpdated();
    }, onListenErr)
  );
  vipoCloudCtx.unsubs.push(
    root
      .collection('payments')
      .doc('summary')
      .onSnapshot(snap => {
        vipoRemoteCache.payments = snap.exists ? snap.data() : defaultPaymentsState();
        remoteCachesUpdated();
      }, onListenErr)
  );
}

async function pruneCollectionNotIn(db, collRef, keepIds) {
  const snap = await collRef.get();
  let batch = db.batch();
  let n = 0;
  for (const d of snap.docs) {
    if (keepIds.has(d.id)) continue;
    batch.delete(d.ref);
    n++;
    if (n >= 450) {
      await batch.commit();
      batch = db.batch();
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
}

async function pushFullInventoryState() {
  const db = vipoCloudCtx.db;
  const ws = vipoCloudCtx.workspaceKey;
  if (!db || !ws) return;
  const root = db.collection('inventory').doc(ws);
  const savedAt = getLocalSavedAt() || new Date().toISOString();

  let batch = db.batch();
  let n = 0;
  const addSet = (ref, data) => {
    batch.set(ref, toFirestoreSafe(data));
    n++;
  };
  const flushIfNeeded = async () => {
    if (n >= 450) {
      await batch.commit();
      batch = db.batch();
      n = 0;
    }
  };

  for (const s of sales) {
    addSet(root.collection('sales').doc(s.id), { ...s });
    await flushIfNeeded();
  }
  for (const o of orders) {
    addSet(root.collection('orders').doc(o.id), { ...o });
    await flushIfNeeded();
  }
  for (const item of openingInventory) {
    const q = getReceivedQty(item.id);
    addSet(root.collection('arrivals').doc(item.id), { qty: q });
    await flushIfNeeded();
  }
  for (const row of samplesCatalog) {
    addSet(root.collection('products').doc(row.id), { ...row });
    await flushIfNeeded();
  }
  addSet(root.collection('payments').doc('summary'), { ...payments });
  await flushIfNeeded();
  addSet(root.collection('settings').doc('meta'), {
    version: 6,
    savedAt,
    schema: 'vipo_inventory_v1'
  });
  if (n > 0) await batch.commit();

  const saleIds = new Set(sales.map(s => s.id));
  const orderIds = new Set(orders.map(o => o.id));
  const productIds = new Set(samplesCatalog.map(r => r.id));
  await pruneCollectionNotIn(db, root.collection('sales'), saleIds);
  await pruneCollectionNotIn(db, root.collection('orders'), orderIds);
  await pruneCollectionNotIn(db, root.collection('products'), productIds);
}

function getVipoCloudDocumentPayload() {
  return {
    version: 5,
    savedAt: new Date().toISOString(),
    sales,
    orders,
    receivedByItemId,
    payments,
    samplesCatalog
  };
}

function applyVipoCloudDocument(data) {
  if (!data || typeof data !== 'object') return;
  vipoApplyingRemote = true;
  try {
    if (Array.isArray(data.sales)) sales = migrateSalesItemIds(data.sales);
    if (Array.isArray(data.orders)) orders = data.orders;
    else if (!data.orders) orders = [];
    if (data.receivedByItemId && typeof data.receivedByItemId === 'object') {
      receivedByItemId = { ...data.receivedByItemId };
    }
    if (data.payments && typeof data.payments === 'object') {
      payments = mergePaymentsState(data.payments);
    }
    if (Array.isArray(data.samplesCatalog) && data.samplesCatalog.length) {
      samplesCatalog = data.samplesCatalog.map(row => ({
        batch: row.batch,
        sku: row.sku,
        desc: row.desc,
        qty: row.qty,
        unit: row.unit,
        currency: row.currency,
        unitPrice: row.unitPrice,
        lineTotal: row.lineTotal,
        ref: row.ref ?? '',
        kind: row.kind === 'freight' ? 'freight' : 'product',
        id: row.id || newId()
      }));
    }
    const payload = {
      version: 4,
      savedAt: data.savedAt || new Date().toISOString(),
      sales,
      orders,
      receivedByItemId,
      payments
    };
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
    try {
      localStorage.setItem(STORAGE_KEY_SAMPLES, JSON.stringify(samplesCatalog));
    } catch (e) {
      console.error(e);
    }
    syncPaymentsFormInputs();
    renderAll();
  } finally {
    vipoApplyingRemote = false;
  }
}

function loadFirebaseCompatScripts() {
  return new Promise((resolve, reject) => {
    if (typeof firebase !== 'undefined' && firebase.apps) return resolve();
    const one = src =>
      new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => res();
        s.onerror = () => rej(new Error(src));
        document.head.appendChild(s);
      });
    one('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
      .then(() => one('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js'))
      .then(() => one('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'))
      .then(() => resolve())
      .catch(reject);
  });
}

function setVipoSyncState(next, customText) {
  vipoSyncUiState = next;
  const bar = document.getElementById('vipoSyncBar');
  const txt = document.getElementById('vipoSyncBarText');
  if (!bar || !txt) return;
  bar.hidden = false;
  bar.className = 'vipo-sync-bar vipo-sync-bar--' + next;
  const labels = {
    init: 'בודק חיבור…',
    no_config: 'אין חיבור לענן — נדרש Firebase',
    connecting: 'מתחבר לענן…',
    connected: 'מחובר לענן',
    syncing: 'מסנכרן…',
    saved: 'נשמר בענן',
    offline: 'אין אינטרנט — נשמר מקומית, יסונכרן בחזרה',
    error: 'שגיאת סנכרון',
    local_only: 'מקומי בלבד (ללא ענן)'
  };
  txt.textContent = customText || labels[next] || next;
}

async function ensureFirebaseAnonymousAuth() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    throw new Error('firebase-auth-missing');
  }
  const auth = firebase.auth();
  if (!auth.currentUser) {
    await auth.signInAnonymously();
  }
}

async function runVipoCloudPush() {
  if (!vipoCloudCtx.enabled || !vipoCloudCtx.workspaceKey || vipoApplyingRemote) return;
  if (!navigator.onLine) {
    vipoCloudCtx.pendingWhileOffline = true;
    setVipoSyncState('offline');
    if (!vipoOfflineToastShown) {
      vipoOfflineToastShown = true;
      showToast('אין אינטרנט — השינויים נשמרים במכשיר ויסונכרנו לענן כשיחזור החיבור.', 5200);
    }
    return;
  }
  vipoOfflineToastShown = false;
  vipoCloudCtx.lastLocalPushAt = Date.now();
  setVipoSyncState('syncing');
  try {
    await pushFullInventoryState();
    vipoCloudCtx.pendingWhileOffline = false;
    setVipoSyncState('saved');
    clearTimeout(vipoSyncSavedTimer);
    vipoSyncSavedTimer = setTimeout(() => {
      if (vipoSyncUiState === 'saved' && vipoCloudCtx.enabled) setVipoSyncState('connected');
    }, 1600);
  } catch (e) {
    console.error(e);
    vipoCloudCtx.pendingWhileOffline = true;
    setVipoSyncState('error');
    showToast('שמירה לענן נכשלה — הנתונים במטמון המקומי; ננסה שוב כשיהיה חיבור.', 5200);
  }
}

function scheduleVipoCloudPush() {
  if (!vipoCloudCtx.enabled || vipoApplyingRemote) return;
  clearTimeout(vipoCloudCtx.pushTimer);
  vipoCloudCtx.pushTimer = setTimeout(() => {
    void runVipoCloudPush();
  }, VIPO_CLOUD_PUSH_DEBOUNCE_MS);
}

/** דחיפה מיידית לפני סגירת טאב/רקע */
function flushVipoCloudPushNow() {
  if (!vipoCloudCtx.enabled || !vipoCloudCtx.workspaceKey || vipoApplyingRemote) return;
  clearTimeout(vipoCloudCtx.pushTimer);
  vipoCloudCtx.pushTimer = null;
  void runVipoCloudPush();
}

function wireVipoCloudFlushOnHide() {
  const run = () => {
    if (document.visibilityState !== 'hidden') return;
    flushVipoCloudPushNow();
  };
  document.addEventListener('visibilitychange', run);
  window.addEventListener('pagehide', () => flushVipoCloudPushNow());
}

function wireVipoOnlineOffline() {
  window.addEventListener('online', () => {
    vipoOfflineToastShown = false;
    if (vipoCloudCtx.enabled) {
      if (vipoCloudCtx.pendingWhileOffline) {
        showToast('חיבור חזר — מסנכרן לענן…', 3200);
        flushVipoCloudPushNow();
      }
      setVipoSyncState('connected');
    }
  });
  window.addEventListener('offline', () => {
    if (vipoCloudCtx.enabled) {
      setVipoSyncState('offline');
      showToast('אין אינטרנט — השינויים נשמרים במכשיר ויסונכרנו כשיחזור החיבור.', 5200);
    }
  });
}

function updateLocalOnlyBanner() {
  const b = document.getElementById('localOnlyBanner');
  if (!b) return;
  b.hidden = !!vipoCloudCtx.enabled;
}

function updateVipoCloudHint() {
  const el = document.getElementById('vipoCloudHint');
  const setupBtn = document.getElementById('cloudSyncSetupBtn');
  if (el) {
    if (vipoCloudCtx.enabled) {
      el.hidden = false;
      el.textContent = 'סנכרון ענן פעיל — ראו סטטוס למעלה';
    } else {
      el.hidden = true;
      el.textContent = '';
    }
  }
  if (setupBtn) {
    setupBtn.hidden = false;
    setupBtn.textContent = vipoCloudCtx.enabled
      ? 'ניהול שיתוף נתונים'
      : 'שיתוף נתונים בין מכשירים (הפעלה)';
  }
  updateLocalOnlyBanner();
}

function getFirebaseStorageKey() {
  return window.VIPO_FIREBASE_STORAGE_KEY || 'VIPO_FIREBASE_CONFIG';
}

function normalizeFirebaseWebConfig(o) {
  return {
    apiKey: String(o.apiKey || ''),
    authDomain: String(o.authDomain || ''),
    projectId: String(o.projectId || ''),
    storageBucket: String(o.storageBucket || ''),
    messagingSenderId: String(o.messagingSenderId || ''),
    appId: String(o.appId || '')
  };
}

function parseFirebaseConfigPaste(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const tryParse = str => {
    try {
      const o = JSON.parse(str);
      if (o && typeof o === 'object' && o.apiKey && o.projectId) return normalizeFirebaseWebConfig(o);
    } catch (_) {
      /* continue */
    }
    return null;
  };
  let cfg = tryParse(s);
  if (cfg) return cfg;
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i >= 0 && j > i) cfg = tryParse(s.slice(i, j + 1));
  return cfg;
}

function closeCloudSyncDialog() {
  const d = document.getElementById('cloudSyncDialog');
  if (d && typeof d.close === 'function' && d.open) d.close();
}

function openCloudSyncDialog() {
  const d = document.getElementById('cloudSyncDialog');
  const ta = document.getElementById('cloudSyncJsonInput');
  const err = document.getElementById('cloudSyncError');
  if (err) {
    err.hidden = true;
    err.textContent = '';
  }
  if (ta) {
    try {
      const saved = localStorage.getItem(getFirebaseStorageKey());
      ta.value = saved || '';
    } catch (_) {
      ta.value = '';
    }
  }
  if (d && typeof d.showModal === 'function') d.showModal();
  ta?.focus();
}

function initCloudSyncDialog() {
  const d = document.getElementById('cloudSyncDialog');
  const save = document.getElementById('cloudSyncSaveBtn');
  const clear = document.getElementById('cloudSyncClearBtn');
  const cancel = document.getElementById('cloudSyncCancelBtn');
  const x = document.getElementById('cloudSyncCloseX');
  const setup = document.getElementById('cloudSyncSetupBtn');
  const ta = document.getElementById('cloudSyncJsonInput');
  const err = document.getElementById('cloudSyncError');

  setup?.addEventListener('click', () => openCloudSyncDialog());
  document.getElementById('localOnlyOpenSyncBtn')?.addEventListener('click', () => openCloudSyncDialog());
  x?.addEventListener('click', () => closeCloudSyncDialog());
  cancel?.addEventListener('click', () => closeCloudSyncDialog());
  d?.addEventListener('click', ev => {
    if (ev.target === d) closeCloudSyncDialog();
  });

  save?.addEventListener('click', () => {
    const rawJs = String(ta?.value || '').trim();
    if (!rawJs) {
      try {
        localStorage.removeItem(getFirebaseStorageKey());
      } catch (_) {
        /* */
      }
    } else {
      const cfg = parseFirebaseConfigPaste(rawJs);
      if (!cfg) {
        if (err) {
          err.hidden = false;
          err.textContent = 'לא הצלחנו לקרוא JSON תקין. השארו את השדה ריק אם הקונפיג כבר מוטמע באתר.';
        }
        return;
      }
      try {
        localStorage.setItem(getFirebaseStorageKey(), JSON.stringify(cfg));
      } catch (e) {
        if (err) {
          err.hidden = false;
          err.textContent = 'שמירה בדפדפן נכשלה (למשל במצב גלישה פרטית).';
        }
        return;
      }
    }

    location.reload();
  });

  clear?.addEventListener('click', () => {
    if (!confirm('למחוק את הגדרת השיתוף ממכשיר זה ולחזור לשמירה מקומית בלבד?')) return;
    try {
      localStorage.removeItem(getFirebaseStorageKey());
    } catch (_) {
      /* */
    }
    location.reload();
  });
}

function isVipoAccessUnlocked() {
  try {
    return sessionStorage.getItem(VIPO_GATE_SESSION_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function unlockVipoAccessUi() {
  try {
    sessionStorage.setItem(VIPO_GATE_SESSION_KEY, '1');
  } catch (_) {
    /* */
  }
  document.documentElement.classList.add('vipo-unlocked');
  const gate = document.getElementById('accessGate');
  if (gate) gate.hidden = true;
}

function initAccessGate() {
  const gate = document.getElementById('accessGate');
  const form = document.getElementById('accessGateForm');
  const input = document.getElementById('accessGatePin');
  const errEl = document.getElementById('accessGateError');

  if (!gate || !form) {
    init().catch(e => console.error(e));
    return;
  }

  if (isVipoAccessUnlocked()) {
    gate.hidden = true;
    init().catch(e => console.error(e));
    return;
  }

  gate.hidden = false;
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const v = String(input?.value || '').trim();
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }
    if (v === VIPO_ACCESS_PIN) {
      unlockVipoAccessUi();
      init().catch(e => console.error(e));
    } else {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = 'קוד שגוי.';
      }
      if (input) input.value = '';
      input?.focus();
    }
  });
  queueMicrotask(() => input?.focus());
}

async function initVipoCloudSync() {
  const cfg = window.VIPO_FIREBASE;
  if (!cfg?.apiKey || !cfg?.projectId) {
    vipoCloudCtx.enabled = false;
    clearCloudUnsubs();
    setVipoSyncState('no_config');
    updateVipoCloudHint();
    return;
  }
  setVipoSyncState('connecting');
  try {
    await loadFirebaseCompatScripts();
    if (typeof firebase === 'undefined' || !firebase.initializeApp) {
      vipoCloudCtx.enabled = false;
      setVipoSyncState('local_only');
      updateVipoCloudHint();
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(cfg);

    await ensureFirebaseAnonymousAuth();

    const db = firebase.firestore();
    vipoCloudCtx.db = db;
    const ws = await deriveVipoWorkspaceKey(VIPO_ACCESS_PIN);
    vipoCloudCtx.workspaceKey = ws;

    const legacyRef = db.collection('vipo_state').doc('1985');
    const [hadNewStructure, legacySnap] = await Promise.all([hydrateInventoryFromServer(db, ws), legacyRef.get()]);

    if (!hadNewStructure && legacySnap.exists) {
      applyVipoCloudDocument(legacySnap.data());
      vipoCloudCtx.lastLocalPushAt = Date.now();
      await pushFullInventoryState();
      showToast('הועבר מבנה ישן לענן — מבנה מסמכים מעודכן', 3600);
    } else if (!hadNewStructure) {
      vipoCloudCtx.lastLocalPushAt = Date.now();
      await pushFullInventoryState();
    } else {
      const remote = String(vipoRemoteCache.meta?.savedAt || '');
      const local = getLocalSavedAt();
      if (remote && (!local || remote > local)) {
        applyFromRemoteCachesFull();
        showToast('נטענו נתונים מהענן', 2400);
      } else if (local && remote && local > remote) {
        vipoCloudCtx.lastLocalPushAt = Date.now();
        await pushFullInventoryState();
      }
    }

    wireInventoryCloudListeners(db, ws);
    vipoCloudCtx.enabled = true;

    if (!navigator.onLine) {
      setVipoSyncState('offline');
    } else {
      setVipoSyncState('connected');
    }
    updateVipoCloudHint();
  } catch (e) {
    console.error(e);
    vipoCloudCtx.enabled = false;
    vipoCloudCtx.workspaceKey = null;
    vipoCloudCtx.rootRef = null;
    clearCloudUnsubs();
    const msg = String(e?.message || e || '');
    const hint =
      msg.includes('auth/operation-not-allowed') || msg.includes('anonymous')
        ? 'הפעילו ב־Firebase Console → Authentication → Sign-in method → Anonymous.'
        : '';
    setVipoSyncState('error', hint ? 'שגיאת התחברות — ' + hint : undefined);
    showToast(
      hint
        ? 'סנכרון ענן: נדרש Anonymous sign-in ב־Firebase. ' + hint
        : 'סנכרון ענן לא זמין — עובדים במצב מקומי (מטמון בדפדפן).',
      6500
    );
    updateVipoCloudHint();
  }
}

function inventoryForBusiness(biz) {
  return openingInventory.filter(i => i.business === biz);
}

function getItem(itemId) {
  return openingInventory.find(r => r.id === itemId);
}

function getSoldQty(itemId) {
  return sales.filter(s => s.itemId === itemId).reduce((sum, s) => sum + Number(s.qty || 0), 0);
}

function getReceivedQty(itemId) {
  const item = getItem(itemId);
  if (!item) return 0;
  if (Object.prototype.hasOwnProperty.call(receivedByItemId, itemId)) {
    const v = Number(receivedByItemId[itemId]);
    if (Number.isFinite(v) && v >= 0) return Math.floor(v);
  }
  return item.openingQty;
}

/** חיובי = חסר מההזמנה (לא הגיע); שלילי = עודף שהגיע מעבר להזמנה */
function getShortageFromOrder(itemId) {
  const item = getItem(itemId);
  if (!item) return 0;
  return item.openingQty - getReceivedQty(itemId);
}

function getRemainingQty(itemId) {
  return Math.max(0, getReceivedQty(itemId) - getSoldQty(itemId));
}

function revenueForBusiness(biz) {
  return sales.reduce((sum, sale) => {
    const it = getItem(sale.itemId);
    if (!it || it.business !== biz) return sum;
    return sum + Number(sale.qty || 0) * Number(sale.unitPrice || 0);
  }, 0);
}

function soldQtyForBusiness(biz) {
  return sales.reduce((sum, sale) => {
    const it = getItem(sale.itemId);
    if (!it || it.business !== biz) return sum;
    return sum + Number(sale.qty || 0);
  }, 0);
}

function openingQtyForBusiness(biz) {
  return openingInventory.filter(i => i.business === biz).reduce((s, i) => s + i.openingQty, 0);
}

function receivedQtyForBusiness(biz) {
  return openingInventory.filter(i => i.business === biz).reduce((s, i) => s + getReceivedQty(i.id), 0);
}

function shortageQtyForBusiness(biz) {
  return openingInventory.filter(i => i.business === biz).reduce((s, i) => {
    const sh = getShortageFromOrder(i.id);
    return s + (sh > 0 ? sh : 0);
  }, 0);
}

function physicalRemainingForBusiness(biz) {
  return openingInventory.filter(i => i.business === biz).reduce((s, i) => s + getRemainingQty(i.id), 0);
}

function remainingQtyForBusiness(biz) {
  return physicalRemainingForBusiness(biz);
}

function openOrdersCount() {
  return orders.filter(o => !['הושלם', 'בוטל'].includes(o.status)).length;
}

function formatUsd(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}

function formatCny(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(Number(value));
}

function formatSampleMoney(currency, value) {
  if (value === null || value === undefined || value === '') return '—';
  return currency === 'USD' ? formatUsd(value) : formatCny(value);
}

function formatIls(value) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatIlsMoney(value) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '—';
  return Number(value).toLocaleString('he-IL', { maximumFractionDigits: digits });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[ch]));
}

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

function generateOrderCode() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${y}${m}${day}-${r}`;
}

/**
 * @param {string} id
 * @param {{ scrollMode?: 'smooth' | 'instant' | 'none' }} [opts]
 */
function showPanel(id, opts = {}) {
  if (!VALID_PANELS.includes(id)) id = 'dashboard';
  els.panels.forEach(p => {
    const match = p.dataset.panelId === id;
    p.classList.toggle('is-active', match);
    p.hidden = !match;
  });
  els.navBtns.forEach(btn => {
    const active = btn.dataset.panel === id;
    btn.classList.toggle('is-active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  try {
    sessionStorage.setItem(LAST_PANEL_KEY, id);
  } catch (_) { /* quota / private */ }
  const scrollMode = opts.scrollMode ?? 'smooth';
  if (scrollMode === 'none') return;
  const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = scrollMode === 'smooth' && !reduceMotion ? 'smooth' : 'auto';
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch (_) {
    window.scrollTo(0, 0);
  }
}

function populateSaleSelect(selectEl, business) {
  if (!selectEl) return;
  const prev = selectEl.value;
  selectEl.innerHTML = '';
  const items = openingInventory.filter(i => i.business === business);
  for (const item of items) {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.product} · ${item.size} · נותר אצלי ${getRemainingQty(item.id)}`;
    selectEl.appendChild(opt);
  }
  if (prev && items.some(i => i.id === prev)) selectEl.value = prev;
}

function getSaleFormBusiness(form, fixedBusiness) {
  if (fixedBusiness) return fixedBusiness;
  return form?.querySelector('#saleBusinessSelect')?.value || '';
}

function addSaleLineRow(form, business) {
  if (!form || !business) return;
  const wrap = form.querySelector('.js-sale-lines');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = 'sale-line-row';
  div.innerHTML = `
    <label class="sale-line-product">מוצר <select class="js-sale-item" required></select></label>
    <label class="sale-line-qty">כמות <input class="js-sale-qty" type="number" min="1" step="1" value="1" required /></label>
    <label class="sale-line-price">מחיר יח׳ ₪ <input class="js-sale-price" type="number" min="0" step="0.01" placeholder="אופציונלי" /></label>
    <button type="button" class="btn btn--small btn--muted js-remove-sale-line" title="הסר שורה">×</button>
  `;
  wrap.appendChild(div);
  populateSaleSelect(div.querySelector('.js-sale-item'), business);
}

function setupSaleLineListeners(form, fixedBusiness) {
  if (!form) return;
  const addBtn = form.querySelector('.js-add-sale-line');
  if (addBtn && !addBtn.dataset.bound) {
    addBtn.dataset.bound = '1';
    addBtn.addEventListener('click', e => {
      e.preventDefault();
      const biz = getSaleFormBusiness(form, fixedBusiness);
      if (!biz) {
        alert('בחרו עסק.');
        return;
      }
      addSaleLineRow(form, biz);
    });
  }
  if (!form.dataset.saleLineClickBound) {
    form.dataset.saleLineClickBound = '1';
    form.addEventListener('click', e => {
      if (!e.target.closest('.js-remove-sale-line')) return;
      e.preventDefault();
      const wrap = form.querySelector('.js-sale-lines');
      if (!wrap || wrap.querySelectorAll('.sale-line-row').length <= 1) {
        alert('נדרשת לפחות שורת מוצר אחת.');
        return;
      }
      e.target.closest('.sale-line-row')?.remove();
    });
  }
}

function repopulateAllSaleFormLineSelects() {
  [els.saleFormNissim, els.saleFormDoron, els.saleFormGlobal].forEach(form => {
    if (!form) return;
    const biz = getSaleFormBusiness(form, form.id === 'saleFormNissim' ? 'nissim' : form.id === 'saleFormDoron' ? 'doron' : null);
    if (!biz) return;
    form.querySelectorAll('.js-sale-lines .js-sale-item').forEach(sel => populateSaleSelect(sel, biz));
  });
}

function readSharedSaleMeta(form) {
  return {
    date: form.querySelector('.js-sale-date')?.value,
    customer: form.querySelector('.js-sale-customer')?.value?.trim() || '',
    status: form.querySelector('.js-sale-status')?.value || 'שולם',
    notes: form.querySelector('.js-sale-notes')?.value?.trim() || ''
  };
}

function readSaleLineRows(form) {
  const lines = [];
  const rows = form.querySelectorAll('.js-sale-lines .sale-line-row');
  for (const row of rows) {
    const itemId = row.querySelector('.js-sale-item')?.value;
    const qty = Number(row.querySelector('.js-sale-qty')?.value);
    const unitPrice = Number(row.querySelector('.js-sale-price')?.value || 0);
    if (!itemId) continue;
    if (!Number.isInteger(qty) || qty <= 0) return { error: 'בכל שורה עם מוצר יש להזין כמות שלמה חיובית.' };
    lines.push({ itemId, qty, unitPrice });
  }
  if (!lines.length) return { error: 'הוסיפו לפחות מוצר אחד עם כמות.' };
  return { lines };
}

function validateLinesAgainstStock(business, lines) {
  const need = {};
  for (const l of lines) {
    need[l.itemId] = (need[l.itemId] || 0) + l.qty;
  }
  for (const itemId of Object.keys(need)) {
    const it = getItem(itemId);
    if (!it || it.business !== business) return 'מוצר לא תואם לעסק שנבחר.';
    const rem = getRemainingQty(itemId);
    if (need[itemId] > rem) {
      return `אין מספיק במלאי עבור «${it.product}». נדרש ${need[itemId]}, נותר ${rem}.`;
    }
  }
  return '';
}

function resetSaleFormAfterSubmit(form, business) {
  const cust = form.querySelector('.js-sale-customer');
  if (cust) cust.value = '';
  const notes = form.querySelector('.js-sale-notes');
  if (notes) notes.value = '';
  const statusSel = form.querySelector('.js-sale-status');
  if (statusSel) statusSel.selectedIndex = 0;
  const wrap = form.querySelector('.js-sale-lines');
  if (wrap) {
    wrap.innerHTML = '';
    addSaleLineRow(form, business);
  }
  setSaleFormDates(form);
}

function chunkSalesByGroup(list) {
  const chunks = [];
  let i = 0;
  while (i < list.length) {
    const gid = list[i].saleGroupId;
    if (gid) {
      const row = [];
      while (i < list.length && list[i].saleGroupId === gid) {
        row.push(list[i]);
        i++;
      }
      chunks.push(row);
    } else {
      chunks.push([list[i]]);
      i++;
    }
  }
  return chunks;
}

function setSaleFormDates(form) {
  if (!form) return;
  const dateInput = form.querySelector('.js-sale-date');
  if (dateInput) dateInput.valueAsDate = new Date();
}

function bindSaleForm(form, fixedBusiness) {
  if (!form) return;
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const biz = fixedBusiness || form.querySelector('#saleBusinessSelect')?.value;
    if (!biz) return;
    addSaleFromForm(form, biz);
  });
}

function addSaleFromForm(form, business) {
  const biz = business || getSaleFormBusiness(form, null);
  if (!biz) {
    alert('בחרו עסק.');
    return;
  }
  const parsed = readSaleLineRows(form);
  if (parsed.error) {
    alert(parsed.error);
    return;
  }
  const stockErr = validateLinesAgainstStock(biz, parsed.lines);
  if (stockErr) {
    alert(stockErr);
    return;
  }
  const meta = readSharedSaleMeta(form);
  const createdAt = new Date().toISOString();
  const groupId = parsed.lines.length > 1 ? newId() : null;
  const batch = parsed.lines.map((line, idx) => ({
    id: newId(),
    date: meta.date,
    itemId: line.itemId,
    qty: line.qty,
    unitPrice: line.unitPrice,
    customer: meta.customer,
    status: meta.status,
    notes: meta.notes,
    createdAt,
    saleGroupId: groupId,
    lineInGroup: groupId ? idx : undefined
  }));
  for (let i = batch.length - 1; i >= 0; i--) sales.unshift(batch[i]);
  saveState();
  resetSaleFormAfterSubmit(form, biz);
  renderAll();
  showToast(parsed.lines.length > 1 ? `נשמרה מכירה עם ${parsed.lines.length} מוצרים` : 'המכירה נשמרה והמלאי עודכן');
  const firstSel = form.querySelector('.js-sale-lines .js-sale-item');
  if (firstSel) requestAnimationFrame(() => firstSel.focus());
}

function renderDashboard() {
  const nOrd = openingQtyForBusiness('nissim');
  const nRec = receivedQtyForBusiness('nissim');
  const nShort = shortageQtyForBusiness('nissim');
  const nSold = soldQtyForBusiness('nissim');
  const nPhys = physicalRemainingForBusiness('nissim');
  if (els.dashNissimOpening) els.dashNissimOpening.textContent = nOrd.toLocaleString('he-IL');
  if (els.dashNissimReceived) els.dashNissimReceived.textContent = nRec.toLocaleString('he-IL');
  if (els.dashNissimShortage) els.dashNissimShortage.textContent = nShort.toLocaleString('he-IL');
  if (els.dashNissimSold) els.dashNissimSold.textContent = nSold.toLocaleString('he-IL');
  if (els.dashNissimPhysical) els.dashNissimPhysical.textContent = nPhys.toLocaleString('he-IL');
  if (els.dashNissimRev) els.dashNissimRev.textContent = formatIls(revenueForBusiness('nissim'));

  const dOrd = openingQtyForBusiness('doron');
  const dRec = receivedQtyForBusiness('doron');
  const dShort = shortageQtyForBusiness('doron');
  const dSold = soldQtyForBusiness('doron');
  const dPhys = physicalRemainingForBusiness('doron');
  if (els.dashDoronOpening) els.dashDoronOpening.textContent = dOrd.toLocaleString('he-IL');
  if (els.dashDoronReceived) els.dashDoronReceived.textContent = dRec.toLocaleString('he-IL');
  if (els.dashDoronShortage) els.dashDoronShortage.textContent = dShort.toLocaleString('he-IL');
  if (els.dashDoronSold) els.dashDoronSold.textContent = dSold.toLocaleString('he-IL');
  if (els.dashDoronPhysical) els.dashDoronPhysical.textContent = dPhys.toLocaleString('he-IL');
  if (els.dashDoronRev) els.dashDoronRev.textContent = formatIls(revenueForBusiness('doron'));

  const orderedAll = openingInventory.reduce((s, i) => s + i.openingQty, 0);
  const receivedAll = openingInventory.reduce((s, i) => s + getReceivedQty(i.id), 0);
  const shortageAll = openingInventory.reduce((s, i) => {
    const sh = getShortageFromOrder(i.id);
    return s + (sh > 0 ? sh : 0);
  }, 0);
  const soldAll = sales.reduce((s, x) => s + Number(x.qty || 0), 0);
  const physicalAll = openingInventory.reduce((s, i) => s + getRemainingQty(i.id), 0);
  const knownCost = openingInventory.reduce((s, i) => s + Number(i.amountUsd || 0), 0);
  const revenueAll = sales.reduce((s, x) => s + Number(x.qty || 0) * Number(x.unitPrice || 0), 0);

  if (els.statOrderedTotal) els.statOrderedTotal.textContent = orderedAll.toLocaleString('he-IL');
  if (els.statReceivedTotal) els.statReceivedTotal.textContent = receivedAll.toLocaleString('he-IL');
  if (els.statShortageTotal) els.statShortageTotal.textContent = shortageAll.toLocaleString('he-IL');
  if (els.statSoldQty) els.statSoldQty.textContent = soldAll.toLocaleString('he-IL');
  if (els.statPhysicalTotal) els.statPhysicalTotal.textContent = physicalAll.toLocaleString('he-IL');
  if (els.statKnownCost) els.statKnownCost.textContent = formatUsd(knownCost);
  if (els.statRevenue) els.statRevenue.textContent = formatIls(revenueAll);
  if (els.statOpenOrders) els.statOpenOrders.textContent = openOrdersCount().toLocaleString('he-IL');

  const doronRem = getRemainingQty(DORON_ID);
  if (els.doronRemainingHero) els.doronRemainingHero.textContent = String(doronRem);
}

function renderInventoryNissim() {
  const q = els.inventorySearchNissim.value.trim().toLowerCase();
  const rows = inventoryForBusiness('nissim').filter(item => {
    const hay = `${item.product} ${item.original} ${item.size}`.toLowerCase();
    return !q || hay.includes(q);
  });
  els.inventoryBodyNissim.innerHTML = rows.map((item, idx) => {
    const sold = getSoldQty(item.id);
    const rec = getReceivedQty(item.id);
    const rem = getRemainingQty(item.id);
    const short = getShortageFromOrder(item.id);
    const shortCell = short > 0 ? String(short) : short < 0 ? `עודף ${-short}` : '—';
    const badge = rem === 0 ? 'badge--empty' : rem <= 2 ? 'badge--low' : '';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(item.product)}</td>
        <td>${escapeHtml(item.original)}</td>
        <td><strong>${escapeHtml(item.size)}</strong></td>
        <td>${item.openingQty}</td>
        <td>${rec}</td>
        <td>${sold}</td>
        <td><span class="badge badge--nissim ${badge}">${rem}</span></td>
        <td>${shortCell}</td>
        <td>${formatUsd(item.priceUsd)}</td>
        <td>${formatUsd(item.amountUsd)}</td>
      </tr>`;
  }).join('');
}

function renderInventoryDoron() {
  const item = getItem(DORON_ID);
  if (!item) {
    els.inventoryBodyDoron.innerHTML = '';
    return;
  }
  const sold = getSoldQty(item.id);
  const rec = getReceivedQty(item.id);
  const rem = getRemainingQty(item.id);
  const short = getShortageFromOrder(item.id);
  const shortCell = short > 0 ? String(short) : short < 0 ? `עודף ${-short}` : '—';
  const badge = rem === 0 ? 'badge--empty' : rem <= 5 ? 'badge--low' : '';
  els.inventoryBodyDoron.innerHTML = `
    <tr>
      <td>1</td>
      <td>${escapeHtml(item.product)}</td>
      <td><strong>${escapeHtml(item.size)}</strong></td>
      <td>${item.openingQty}</td>
      <td>${rec}</td>
      <td>${sold}</td>
      <td><span class="badge badge--doron ${badge}">${rem}</span></td>
      <td>${shortCell}</td>
    </tr>`;
}

function renderSalesTable() {
  const q = els.salesSearch.value.trim().toLowerCase();
  const list = sales.filter(sale => {
    const item = getItem(sale.itemId);
    const hay = `${sale.date} ${sale.customer} ${sale.status} ${sale.notes} ${item?.product} ${item?.size} ${BUSINESS_LABEL[item?.business] || ''}`.toLowerCase();
    return !q || hay.includes(q);
  });
  els.emptySalesState.style.display = sales.length ? 'none' : 'block';
  let displayIndex = 0;
  const rowsHtml = [];
  for (const chunk of chunkSalesByGroup(list)) {
    displayIndex += 1;
    const isMulti = chunk.length > 1;
    chunk.forEach((sale, j) => {
      const item = getItem(sale.itemId) || {};
      const biz = item.business;
      const badge = biz === 'doron' ? 'badge--doron' : 'badge--nissim';
    const total = Number(sale.qty || 0) * Number(sale.unitPrice || 0);
      const isFirst = j === 0;
      const bundlePill = isMulti && isFirst
        ? ' <span class="sale-bundle-pill" title="מכירה אחת עם כמה מוצרים">מרובה</span>'
        : '';
      const dateCell = isFirst ? escapeHtml(sale.date) : '<span class="sale-bundle-join" aria-hidden="true">↳</span>';
      const bizCell = isFirst ? `<span class="badge ${badge}">${escapeHtml(BUSINESS_LABEL[biz] || '')}</span>` : '';
      const custCell = isFirst ? escapeHtml(sale.customer || '—') : '';
      const statCell = isFirst ? escapeHtml(sale.status || '—') : '';
      const notesCell = isFirst ? escapeHtml(sale.notes || '—') : '';
      const delBtn = isFirst
        ? `<button type="button" class="btn btn--small btn--danger" onclick="deleteSale('${escapeHtml(sale.id)}')">מחק</button>`
        : '';
      const idxCell = isFirst ? `${String(displayIndex)}${bundlePill}` : '';
      const trClass = isMulti ? (isFirst ? 'sale-tr--bundle-start' : 'sale-tr--bundle-continuation') : '';
      rowsHtml.push(`
      <tr class="${trClass}">
        <td>${idxCell}</td>
        <td>${dateCell}</td>
        <td>${bizCell}</td>
        <td>${escapeHtml(item.product || '')}</td>
        <td><strong>${escapeHtml(item.size || '')}</strong></td>
        <td>${Number(sale.qty || 0)}</td>
        <td>${sale.unitPrice ? formatIls(sale.unitPrice) : '—'}</td>
        <td>${sale.unitPrice ? formatIls(total) : '—'}</td>
        <td>${custCell}</td>
        <td>${statCell}</td>
        <td>${notesCell}</td>
        <td>${delBtn}</td>
      </tr>`);
    });
  }
  els.salesBody.innerHTML = rowsHtml.join('');
}

function deleteSale(id) {
  const sale = sales.find(s => s.id === id);
  if (!sale) return;
  if (sale.saleGroupId) {
    const grp = sales.filter(s => s.saleGroupId === sale.saleGroupId);
    if (!confirm(`למחוק את כל השורות במכירה (${grp.length} מוצרים)? הכמויות יוחזרו למלאי.`)) return;
    sales = sales.filter(s => s.saleGroupId !== sale.saleGroupId);
  } else {
    if (!confirm('למחוק מכירה? הכמות תוחזר למלאי.')) return;
    sales = sales.filter(s => s.id !== id);
  }
  saveState();
  renderAll();
  showToast('המכירה נמחקה — המלאי עודכן');
}
window.deleteSale = deleteSale;

function getFilteredOrders() {
  const b = els.orderFilterBusiness.value;
  const st = els.orderFilterStatus.value;
  return orders.filter(o => {
    if (b !== 'all' && o.business !== b) return false;
    if (st !== 'all' && o.status !== st) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function summarizeOrderLines(order) {
  return (order.lines || []).map(l => {
    const it = getItem(l.itemId);
    return `${it ? it.product : '?'}×${l.qty}`;
  }).join(' · ');
}

function renderOrdersTable() {
  const filtered = getFilteredOrders();
  if (filtered.length === 0) {
    els.emptyOrdersState.hidden = false;
    els.emptyOrdersState.textContent = orders.length === 0 ? 'אין הזמנות עדיין.' : 'אין תוצאות לסינון הנוכחי.';
  } else {
    els.emptyOrdersState.hidden = true;
  }
  els.ordersBody.innerHTML = filtered.map((o, idx) => {
    const canFulfill = !['הושלם', 'בוטל'].includes(o.status);
    const linesPreview = summarizeOrderLines(o);
    const statusOpts = ORDER_STATUSES.map(s =>
      `<option value="${escapeHtml(s)}" ${o.status === s ? 'selected' : ''}>${escapeHtml(s)}</option>`
    ).join('');
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escapeHtml(o.code)}</strong></td>
        <td>${escapeHtml(o.date)}</td>
        <td><span class="badge ${o.business === 'doron' ? 'badge--doron' : 'badge--nissim'}">${escapeHtml(BUSINESS_LABEL[o.business])}</span></td>
        <td>${escapeHtml(o.customer)}</td>
        <td>${escapeHtml(o.phone || '—')}</td>
        <td>
          <select class="order-status-select" data-order-id="${escapeHtml(o.id)}" aria-label="סטטוס הזמנה">
            ${statusOpts}
          </select>
        </td>
        <td><small title="${escapeHtml(linesPreview)}">${escapeHtml(linesPreview.slice(0, 80))}${linesPreview.length > 80 ? '…' : ''}</small></td>
        <td class="order-actions">
          ${canFulfill ? `<button type="button" class="btn btn--small btn--primary js-fulfill" data-id="${escapeHtml(o.id)}">אספקה מהמלאי</button>` : ''}
          <button type="button" class="btn btn--small btn--danger js-delete-order" data-id="${escapeHtml(o.id)}">מחק</button>
        </td>
      </tr>`;
  }).join('');

  els.ordersBody.querySelectorAll('.order-status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const id = sel.getAttribute('data-order-id');
      updateOrderStatus(id, sel.value);
    });
  });
  els.ordersBody.querySelectorAll('.js-fulfill').forEach(btn => {
    btn.addEventListener('click', () => fulfillOrder(btn.getAttribute('data-id')));
  });
  els.ordersBody.querySelectorAll('.js-delete-order').forEach(btn => {
    btn.addEventListener('click', () => deleteOrder(btn.getAttribute('data-id')));
  });
}

function updateOrderStatus(orderId, status) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  o.status = status;
  o.updatedAt = new Date().toISOString();
  saveState();
  renderAll();
}

function deleteOrder(orderId) {
  if (!confirm('למחוק הזמנה לצמיתות?')) return;
  orders = orders.filter(x => x.id !== orderId);
  saveState();
  renderAll();
  showToast('ההזמנה נמחקה');
}

function fulfillOrder(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o || !Array.isArray(o.lines) || o.lines.length === 0) {
    alert('הזמנה לא תקינה.');
    return;
  }
  if (['הושלם', 'בוטל'].includes(o.status)) {
    alert('לא ניתן לספק הזמנה בסטטוס זה.');
    return;
  }
  const problems = [];
  const agg = {};
  for (const line of o.lines) {
    const it = getItem(line.itemId);
    const need = Number(line.qty || 0);
    if (!it || it.business !== o.business) problems.push('שורה לא תואמת לעסק שנבחר.');
    else if (!Number.isInteger(need) || need <= 0) problems.push('כמות לא תקינה באחת השורות.');
    else agg[line.itemId] = (agg[line.itemId] || 0) + need;
  }
  for (const itemId of Object.keys(agg)) {
    const it = getItem(itemId);
    const need = agg[itemId];
    const rem = getRemainingQty(itemId);
    if (need > rem) problems.push(`${it.product}: נדרש ${need}, נותר ${rem}`);
  }
  if (problems.length) {
    alert('לא ניתן לבצע אספקה:\n' + problems.join('\n'));
    return;
  }
  const notePrefix = `אספקה להזמנה ${o.code}`;
  const fulfillGroupId = newId();
  const fulfillCreated = new Date().toISOString();
  const fulfillDate = fulfillCreated.slice(0, 10);
  for (let li = o.lines.length - 1; li >= 0; li--) {
    const line = o.lines[li];
  sales.unshift({
      id: newId(),
      date: fulfillDate,
      itemId: line.itemId,
      qty: Number(line.qty),
      unitPrice: 0,
      customer: o.customer,
      status: 'בהמתנה',
      notes: `${notePrefix} · ${o.phone || ''}`.trim(),
      createdAt: fulfillCreated,
      relatedOrderId: o.id,
      saleGroupId: fulfillGroupId,
      lineInGroup: li
    });
  }
  o.status = 'הושלם';
  o.fulfilledAt = new Date().toISOString();
  o.updatedAt = o.fulfilledAt;
  saveState();
  renderAll();
  showToast('אספקה הושלמה — נוצרו מכירות (מחיר 0). ניתן למחוק ולרשום מחדש עם מחיר.', 4200);
}

function addOrderLineRow() {
  const biz = els.orderBusiness.value;
  const wrap = document.createElement('div');
  wrap.className = 'order-line';
  const sel = document.createElement('select');
  sel.className = 'js-order-item';
  sel.required = true;
  inventoryForBusiness(biz).forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.product} · ${item.size}`;
    sel.appendChild(opt);
  });
  const qty = document.createElement('input');
  qty.type = 'number';
  qty.min = '1';
  qty.step = '1';
  qty.className = 'js-order-qty';
  qty.required = true;
  qty.value = '1';
  const rm = document.createElement('button');
  rm.type = 'button';
  rm.textContent = '×';
  rm.addEventListener('click', () => {
    if (els.orderLinesContainer.querySelectorAll('.order-line').length <= 1) {
      alert('נדרשת לפחות שורת הזמנה אחת.');
      return;
    }
    wrap.remove();
  });
  wrap.appendChild(sel);
  wrap.appendChild(qty);
  wrap.appendChild(rm);
  els.orderLinesContainer.appendChild(wrap);
}

function refreshOrderLineSelects() {
  const biz = els.orderBusiness.value;
  els.orderLinesContainer.querySelectorAll('.order-line').forEach(row => {
    const sel = row.querySelector('.js-order-item');
    const prev = sel?.value;
    if (!sel) return;
    sel.innerHTML = '';
    inventoryForBusiness(biz).forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.product} · ${item.size}`;
      sel.appendChild(opt);
    });
    if (prev && inventoryForBusiness(biz).some(i => i.id === prev)) sel.value = prev;
  });
}

function onOrderSubmit(ev) {
  ev.preventDefault();
  const lines = [];
  els.orderLinesContainer.querySelectorAll('.order-line').forEach(row => {
    const itemId = row.querySelector('.js-order-item')?.value;
    const qty = Number(row.querySelector('.js-order-qty')?.value);
    if (itemId && Number.isInteger(qty) && qty > 0) lines.push({ itemId, qty });
  });
  if (!lines.length) {
    alert('הוסיפו לפחות שורת מוצר אחת.');
    return;
  }
  const biz = els.orderBusiness.value;
  for (const l of lines) {
    const it = getItem(l.itemId);
    if (!it || it.business !== biz) {
      alert('יש שורה שלא שייכת לעסק שנבחר.');
      return;
    }
  }
  const newOrderCode = generateOrderCode();
  orders.unshift({
    id: newId(),
    code: newOrderCode,
    date: els.orderDate.value,
    business: biz,
    customer: els.orderCustomer.value.trim(),
    phone: els.orderPhone.value.trim(),
    status: els.orderStatus.value,
    notes: els.orderNotes.value.trim(),
    lines,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fulfilledAt: null
  });
  saveState();
  els.orderForm.reset();
  els.orderDate.valueAsDate = new Date();
  els.orderLinesContainer.innerHTML = '';
  addOrderLineRow();
  renderAll();
  showToast(`ההזמנה נשמרה — קוד ${newOrderCode}`);
  els.orderCustomer?.focus();
}

function resetSales() {
  if (!confirm('לאפס את כל המכירות? הכמויות «נותר אצלי» יחושבו מחדש לפי «מה הגיע» (לא נמחק).')) return;
  sales = [];
  saveState();
  renderAll();
  showToast('כל המכירות אופסו');
}

function resetOrders() {
  if (!confirm('למחוק את כל ההזמנות?')) return;
  orders = [];
  saveState();
  renderAll();
  showToast('כל ההזמנות נמחקו');
}

function buildInventoryCsvRows(biz) {
  const items = biz ? openingInventory.filter(i => i.business === biz) : openingInventory;
  return [
    ['business', 'product', 'original', 'size', 'ordered_qty', 'received_qty', 'sold_qty', 'physical_remaining', 'shortage_from_order', 'unit_price_usd', 'amount_usd'],
    ...items.map(item => [
      BUSINESS_LABEL[item.business],
      item.product,
      item.original,
      item.size,
      item.openingQty,
      getReceivedQty(item.id),
      getSoldQty(item.id),
      getRemainingQty(item.id),
      getShortageFromOrder(item.id),
      item.priceUsd ?? '',
      item.amountUsd ?? ''
    ])
  ];
}

function buildGapsCsvRows() {
  return [
    ['business', 'product', 'size', 'ordered', 'received', 'sold', 'physical_remaining', 'shortage_positive'],
    ...openingInventory.map(item => [
      BUSINESS_LABEL[item.business],
      item.product,
      item.size,
      item.openingQty,
      getReceivedQty(item.id),
      getSoldQty(item.id),
      getRemainingQty(item.id),
      Math.max(0, getShortageFromOrder(item.id))
    ])
  ];
}

function renderReceivedTables() {
  if (!els.receivedBodyNissim) return;
  const rowsN = inventoryForBusiness('nissim');
  els.receivedBodyNissim.innerHTML = rowsN.map((item, idx) => {
    const short = getShortageFromOrder(item.id);
    const shortCell = short > 0 ? String(short) : short < 0 ? `עודף ${-short}` : '—';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(item.product)}</td>
        <td><strong>${escapeHtml(item.size)}</strong></td>
        <td>${item.openingQty}</td>
        <td><input class="table-input js-received-input" type="number" min="0" step="1" data-item-id="${escapeHtml(item.id)}" value="${getReceivedQty(item.id)}" aria-label="כמות שהגיעה" /></td>
        <td>${shortCell}</td>
      </tr>`;
  }).join('');

  const d = getItem(DORON_ID);
  if (!els.receivedBodyDoron || !d) {
    if (els.receivedBodyDoron) els.receivedBodyDoron.innerHTML = '';
    return;
  }
  const dShort = getShortageFromOrder(DORON_ID);
  const dShortCell = dShort > 0 ? String(dShort) : dShort < 0 ? `עודף ${-dShort}` : '—';
  els.receivedBodyDoron.innerHTML = `
    <tr>
      <td>1</td>
      <td>${escapeHtml(d.product)}</td>
      <td><strong>${escapeHtml(d.size)}</strong></td>
      <td>${d.openingQty}</td>
      <td><input class="table-input js-received-input" type="number" min="0" step="1" data-item-id="${escapeHtml(DORON_ID)}" value="${getReceivedQty(DORON_ID)}" aria-label="כמות שהגיעה דורון" /></td>
      <td>${dShortCell}</td>
    </tr>`;
}

function renderGapsTable() {
  if (!els.gapsBody) return;
  els.gapsBody.innerHTML = openingInventory.map((item, idx) => {
    const ord = item.openingQty;
    const rec = getReceivedQty(item.id);
    const sold = getSoldQty(item.id);
    const rem = getRemainingQty(item.id);
    const short = getShortageFromOrder(item.id);
    const shortShow = short > 0 ? String(short) : short < 0 ? `עודף ${-short}` : '0';
    const pill = item.business === 'doron' ? 'badge--doron' : 'badge--nissim';
    const low = rem === 0 ? 'badge--empty' : rem <= 2 && item.business === 'nissim' ? 'badge--low' : rem <= 5 && item.business === 'doron' ? 'badge--low' : '';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><span class="badge ${pill}">${escapeHtml(BUSINESS_LABEL[item.business])}</span></td>
        <td>${escapeHtml(item.product)}</td>
        <td><strong>${escapeHtml(item.size)}</strong></td>
        <td>${ord}</td>
        <td>${rec}</td>
        <td>${sold}</td>
        <td><span class="badge ${pill} ${low}">${rem}</span></td>
        <td>${shortShow}</td>
      </tr>`;
  }).join('');
}

function saveReceivedFromForm() {
  const inputs = document.querySelectorAll('.js-received-input');
  const next = { ...receivedByItemId };
  for (const inp of inputs) {
    const id = inp.getAttribute('data-item-id');
    if (!id || !getItem(id)) continue;
    const raw = String(inp.value ?? '').trim();
    const v = raw === '' ? NaN : Number(raw);
    if (!Number.isInteger(v) || v < 0) {
      alert('יש להזין מספר שלם ≥ 0 בכל שורת «הגיע בפועל».');
      return;
    }
    const sold = getSoldQty(id);
    if (v < sold) {
      alert(`לא ניתן לרשום פחות «הגיע» מכמות שנמכרה כבר (${sold}) עבור אותו מוצר.`);
      return;
    }
    next[id] = v;
  }
  receivedByItemId = next;
  saveState();
  showToast('נשמר: מה שהגיע בפועל אצלך');
  renderAll();
}

function buildSalesCsvRows() {
  return [
    ['date', 'business', 'product', 'size', 'qty', 'unit_price_ils', 'total_ils', 'customer', 'payment_status', 'notes', 'sale_group_id'],
    ...sales.map(sale => {
      const item = getItem(sale.itemId) || {};
      const total = Number(sale.qty || 0) * Number(sale.unitPrice || 0);
      return [
        sale.date,
        BUSINESS_LABEL[item.business] || '',
        item.product || '',
        item.size || '',
        sale.qty,
        sale.unitPrice,
        total,
        sale.customer,
        sale.status,
        sale.notes,
        sale.saleGroupId || ''
      ];
    })
  ];
}

function buildOrdersCsvRows() {
  return [
    ['code', 'date', 'business', 'customer', 'phone', 'status', 'lines', 'notes'],
    ...orders.map(o => [
      o.code,
      o.date,
      BUSINESS_LABEL[o.business],
      o.customer,
      o.phone,
      o.status,
      JSON.stringify(o.lines || []),
      o.notes
    ])
  ];
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  downloadBlob(filename, '\ufeff' + csv, 'text/csv;charset=utf-8;');
}

function exportBackup() {
  const payload = {
    version: 4,
    exportedAt: new Date().toISOString(),
    sales,
    orders,
    receivedByItemId,
    payments,
    samplesCatalog
  };
  downloadBlob(`vipo-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

function importBackup(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (Array.isArray(payload.sales)) sales = migrateSalesItemIds(payload.sales);
      if (Array.isArray(payload.orders)) orders = payload.orders;
      else if (!payload.orders) orders = [];
      if (payload.receivedByItemId && typeof payload.receivedByItemId === 'object') {
        receivedByItemId = { ...payload.receivedByItemId };
      }
      if (payload.payments && typeof payload.payments === 'object') {
        payments = mergePaymentsState(payload.payments);
      }
      if (Array.isArray(payload.samplesCatalog) && payload.samplesCatalog.length) {
        samplesCatalog = payload.samplesCatalog.map(row => ({
          batch: row.batch,
          sku: row.sku,
          desc: row.desc,
          qty: row.qty,
          unit: row.unit,
          currency: row.currency,
          unitPrice: row.unitPrice,
          lineTotal: row.lineTotal,
          ref: row.ref ?? '',
          kind: row.kind === 'freight' ? 'freight' : 'product',
          id: row.id || newId()
        }));
        saveSamplesCatalog();
      }
      saveState();
      syncPaymentsFormInputs();
      renderAll();
      showToast('גיבוי נטען בהצלחה');
    } catch (e) {
      alert('קובץ לא תקין.');
    } finally {
      ev.target.value = '';
    }
  };
  reader.readAsText(file);
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setPaymentsAddFormDates() {
  const today = new Date().toISOString().slice(0, 10);
  const ni = els.paymentsNissimAddForm?.querySelector('input[name="date"]');
  const di = els.paymentsDoronAddForm?.querySelector('input[name="date"]');
  if (ni) ni.value = today;
  if (di) di.value = today;
}

function sortLedgerDesc(ledger) {
  return [...ledger].sort((a, b) => {
    const c = String(b.date || '').localeCompare(String(a.date || ''));
    if (c !== 0) return c;
    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}

function syncPaymentsFormInputs() {
  if (els.paymentsUsdRate) els.paymentsUsdRate.value = String(numOr(payments.usdToIls, 3.7));
  if (els.payDoronProductIls) els.payDoronProductIls.value = String(numOr(payments.doronProductIls, 0));
  if (els.payDoronShippingIls) els.payDoronShippingIls.value = String(numOr(payments.doronShippingIls, 0));
  if (els.payDoronExtrasIls) els.payDoronExtrasIls.value = String(numOr(payments.doronExtrasIls, 0));
}

function renderPayments() {
  const rate = Math.max(0.0001, numOr(payments.usdToIls, 3.7));
  const nFactoryUsd = factoryCostUsdNissimByReceived();
  const nFactoryIls = nFactoryUsd * rate;
  const nIn = ledgerSumByFlow(payments.nissimLedger, PAY_FLOW_TO_ME);
  const nOut = ledgerSumByFlow(payments.nissimLedger, PAY_FLOW_FROM_ME);
  const nRev = revenueForBusiness('nissim');
  const nGross = nRev - nFactoryIls;
  const nShortVsGoods = Math.max(0, nFactoryIls - nIn);
  const nCreditRaw = Math.max(0, nIn - nFactoryIls);
  const nCreditRemain = Math.max(0, nCreditRaw - nOut);

  const dCost = doronTotalCostIls();
  const dIn = ledgerSumByFlow(payments.doronLedger, PAY_FLOW_TO_ME);
  const dOut = ledgerSumByFlow(payments.doronLedger, PAY_FLOW_FROM_ME);
  const dSold = getSoldQty(DORON_ID);
  const dRem = getRemainingQty(DORON_ID);
  const dRev = revenueForBusiness('doron');
  const dShortVsInv = Math.max(0, dCost - dIn);
  const dCreditRaw = Math.max(0, dIn - dCost);
  const dCreditRemain = Math.max(0, dCreditRaw - dOut);
  const dProfitOnInv = dRev - dCost;

  const setDd = (el, text, neg) => {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('stat-dd--neg', !!neg);
  };

  setDd(els.paySumNissimPaidIn, formatIlsMoney(nIn), false);
  setDd(els.paySumNissimGoods, formatIlsMoney(nFactoryIls), false);
  setDd(els.paySumNissimShort, formatIlsMoney(nShortVsGoods), nShortVsGoods > 0);
  setDd(els.paySumNissimCredit, formatIlsMoney(nCreditRaw), false);
  setDd(els.paySumNissimRefunded, formatIlsMoney(nOut), false);
  setDd(els.paySumNissimCreditRemain, formatIlsMoney(nCreditRemain), nCreditRemain > 0);
  setDd(els.paySumNissimRev, formatIlsMoney(nRev), false);
  setDd(els.paySumNissimGross, formatIlsMoney(nGross), nGross < 0);

  setDd(els.paySumDoronPaidIn, formatIlsMoney(dIn), false);
  setDd(els.paySumDoronInv, formatIlsMoney(dCost), false);
  setDd(els.paySumDoronShort, formatIlsMoney(dShortVsInv), dShortVsInv > 0);
  setDd(els.paySumDoronCredit, formatIlsMoney(dCreditRaw), false);
  setDd(els.paySumDoronRefunded, formatIlsMoney(dOut), false);
  setDd(els.paySumDoronCreditRemain, formatIlsMoney(dCreditRemain), dCreditRemain > 0);
  setDd(els.paySumDoronProfit, formatIlsMoney(dProfitOnInv), dProfitOnInv < 0);
  if (els.paySumDoronSoldQty) els.paySumDoronSoldQty.textContent = dSold.toLocaleString('he-IL');

  setDd(els.payNissimPaidIn, formatIlsMoney(nIn), false);
  setDd(els.payNissimGoods, formatIlsMoney(nFactoryIls), false);
  setDd(els.payNissimShort, formatIlsMoney(nShortVsGoods), nShortVsGoods > 0);
  setDd(els.payNissimCredit, formatIlsMoney(nCreditRaw), false);
  setDd(els.payNissimRefunded, formatIlsMoney(nOut), false);
  setDd(els.payNissimCreditRemain, formatIlsMoney(nCreditRemain), nCreditRemain > 0);
  setDd(els.payNissimRev, formatIlsMoney(nRev), false);
  setDd(els.payNissimGrossProfit, formatIlsMoney(nGross), nGross < 0);

  setDd(els.payDoronInv, formatIlsMoney(dCost), false);
  setDd(els.payDoronPaidIn, formatIlsMoney(dIn), false);
  setDd(els.payDoronShort, formatIlsMoney(dShortVsInv), dShortVsInv > 0);
  setDd(els.payDoronCredit, formatIlsMoney(dCreditRaw), false);
  setDd(els.payDoronRefunded, formatIlsMoney(dOut), false);
  setDd(els.payDoronCreditRemain, formatIlsMoney(dCreditRemain), dCreditRemain > 0);
  setDd(els.payDoronProfitOnInv, formatIlsMoney(dProfitOnInv), dProfitOnInv < 0);
  if (els.payDoronSold) els.payDoronSold.textContent = dSold.toLocaleString('he-IL');
  setDd(els.payDoronRev, formatIlsMoney(dRev), false);
  if (els.payDoronRemaining) els.payDoronRemaining.textContent = dRem.toLocaleString('he-IL');

  const renderLedger = (tbody, ledger, kind) => {
    if (!tbody) return;
    const sorted = sortLedgerDesc(ledger);
    if (sorted.length === 0) {
      tbody.innerHTML = '';
      return;
    }
    tbody.innerHTML = sorted.map((r, idx) => {
      const f = r.flow === PAY_FLOW_FROM_ME ? PAY_FLOW_FROM_ME : PAY_FLOW_TO_ME;
      return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.date)}</td>
        <td><span class="payments-flow-tag ${f === PAY_FLOW_FROM_ME ? 'payments-flow-tag--out' : 'payments-flow-tag--in'}">${escapeHtml(flowLabel(f))}</span></td>
        <td>${formatIlsMoney(r.amountIls)}</td>
        <td>${escapeHtml(r.note || '—')}</td>
        <td><button type="button" class="btn btn--small btn--danger js-del-ledger" data-kind="${kind}" data-id="${escapeHtml(r.id)}">מחק</button></td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('.js-del-ledger').forEach(btn => {
      btn.addEventListener('click', () => deletePaymentLedgerRow(btn.getAttribute('data-kind'), btn.getAttribute('data-id')));
    });
  };

  renderLedger(els.paymentsNissimLedgerBody, payments.nissimLedger, 'nissim');
  renderLedger(els.paymentsDoronLedgerBody, payments.doronLedger, 'doron');

  if (els.paymentsNissimLedgerEmpty) {
    els.paymentsNissimLedgerEmpty.hidden = (payments.nissimLedger || []).length > 0;
  }
  if (els.paymentsDoronLedgerEmpty) {
    els.paymentsDoronLedgerEmpty.hidden = (payments.doronLedger || []).length > 0;
  }
}

function deletePaymentLedgerRow(kind, id) {
  if (!id || !confirm('למחוק רשומה מהיומן?')) return;
  const key = kind === 'doron' ? 'doronLedger' : 'nissimLedger';
  if (!payments[key]) return;
  payments[key] = payments[key].filter(r => r.id !== id);
  saveState();
  renderAll();
  showToast('הרשומה נמחקה');
}

function buildPaymentsCsvRows() {
  const rate = numOr(payments.usdToIls, 3.7);
  const fusd = factoryCostUsdNissimByReceived();
  const fils = fusd * rate;
  const nIn = ledgerSumByFlow(payments.nissimLedger, PAY_FLOW_TO_ME);
  const nOut = ledgerSumByFlow(payments.nissimLedger, PAY_FLOW_FROM_ME);
  const nRev = revenueForBusiness('nissim');
  const dCost = doronTotalCostIls();
  const dIn = ledgerSumByFlow(payments.doronLedger, PAY_FLOW_TO_ME);
  const dOut = ledgerSumByFlow(payments.doronLedger, PAY_FLOW_FROM_ME);
  const dRev = revenueForBusiness('doron');
  const rows = [
    ['type', 'date', 'flow', 'amount_ils', 'note_or_metric', 'extra'],
    ['summary', 'usd_to_ils', '', rate, '', ''],
    ['summary', 'nissim_factory_usd_received_basis', '', fusd, '', ''],
    ['summary', 'nissim_goods_ils', '', fils, '', ''],
    ['summary', 'nissim_paid_in_ils', '', nIn, '', ''],
    ['summary', 'nissim_refunded_out_ils', '', nOut, '', ''],
    ['summary', 'nissim_short_vs_goods', '', Math.max(0, fils - nIn), '', ''],
    ['summary', 'nissim_credit_remain', '', Math.max(0, Math.max(0, nIn - fils) - nOut), '', ''],
    ['summary', 'nissim_revenue_ils', '', nRev, '', ''],
    ['summary', 'nissim_gross_profit_ils', '', nRev - fils, '', ''],
    ['summary', 'doron_investment_ils', '', dCost, '', ''],
    ['summary', 'doron_paid_in_ils', '', dIn, '', ''],
    ['summary', 'doron_refunded_out_ils', '', dOut, '', ''],
    ['summary', 'doron_short_vs_investment', '', Math.max(0, dCost - dIn), '', ''],
    ['summary', 'doron_credit_remain', '', Math.max(0, Math.max(0, dIn - dCost) - dOut), '', ''],
    ['summary', 'doron_profit_sales_minus_investment', '', dRev - dCost, '', ''],
    ['summary', 'doron_sold_qty', '', getSoldQty(DORON_ID), '', '']
  ];
  for (const r of sortLedgerDesc(payments.nissimLedger)) {
    const f = r.flow === PAY_FLOW_FROM_ME ? PAY_FLOW_FROM_ME : PAY_FLOW_TO_ME;
    rows.push(['nissim_ledger', r.date, f, r.amountIls, r.note, '']);
  }
  for (const r of sortLedgerDesc(payments.doronLedger)) {
    const f = r.flow === PAY_FLOW_FROM_ME ? PAY_FLOW_FROM_ME : PAY_FLOW_TO_ME;
    rows.push(['doron_ledger', r.date, f, r.amountIls, r.note, '']);
  }
  return rows;
}

function renderSamplesTable() {
  if (!els.samplesBody) return;
  const q = (els.samplesSearch?.value || '').trim().toLowerCase();
  const rows = samplesCatalog.filter(row => {
    if (!q) return true;
    const hay = `${row.batch} ${row.sku} ${row.desc} ${row.ref || ''} ${row.kind} ${row.id || ''}`.toLowerCase();
    return hay.includes(q);
  });
  const COLS = 8;
  const parts = [];
  let prevBatch = null;
  let n = 0;
  for (const row of rows) {
    if (row.batch !== prevBatch) {
      prevBatch = row.batch;
      parts.push(`<tr class="samples-section-head"><td colspan="${COLS}">${escapeHtml(row.batch)}</td></tr>`);
    }
    n += 1;
    const trClass = row.kind === 'freight' ? 'samples-row--freight' : '';
    parts.push(`
      <tr class="${trClass}">
        <td>${n}</td>
        <td><strong>${escapeHtml(row.sku)}</strong></td>
        <td>${escapeHtml(row.desc)}</td>
        <td>${escapeHtml(String(row.qty))}</td>
        <td>${escapeHtml(row.unit)}</td>
        <td>${formatSampleMoney(row.currency, row.unitPrice)}</td>
        <td>${formatSampleMoney(row.currency, row.lineTotal)}</td>
        <td><button type="button" class="btn btn--small btn--danger js-delete-sample" data-sample-id="${escapeHtml(row.id)}">מחק</button></td>
      </tr>`);
  }
  els.samplesBody.innerHTML = parts.join('');
}

function buildSamplesCsvRows() {
  return [
    ['id', 'order', 'sku', 'description', 'qty', 'unit', 'currency', 'unit_price', 'line_total', 'ref', 'kind'],
    ...samplesCatalog.map(row => [
      row.id,
      row.batch,
      row.sku,
      row.desc,
      row.qty,
      row.unit,
      row.currency,
      row.unitPrice ?? '',
      row.lineTotal ?? '',
      row.ref,
      row.kind
    ])
  ];
}

function renderAll() {
  renderDashboard();
  renderInventoryNissim();
  renderInventoryDoron();
  renderReceivedTables();
  renderGapsTable();
  renderSalesTable();
  renderOrdersTable();
  renderPayments();
  renderSamplesTable();
  repopulateAllSaleFormLineSelects();
}

function initNavigation() {
  els.navBtns.forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panel));
  });
  document.querySelectorAll('[data-go-panel]').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.getAttribute('data-go-panel')));
  });
}

let vipoAppInitDone = false;

async function init() {
  if (vipoAppInitDone) return;
  vipoAppInitDone = true;
  setVipoSyncState('init');
  const state = loadState();
  sales = state.sales;
  orders = state.orders;
  receivedByItemId = state.receivedByItemId || {};
  payments = state.payments || defaultPaymentsState();
  loadSamplesCatalog();
  initCloudSyncDialog();
  await initVipoCloudSync();
  saveState();
  syncPaymentsFormInputs();

  els.orderDate.valueAsDate = new Date();
  addOrderLineRow();

  initNavigation();
  initLayoutRecovery();
  wireVipoCloudFlushOnHide();
  wireVipoOnlineOffline();

  let startPanel = 'dashboard';
  try {
    const last = sessionStorage.getItem(LAST_PANEL_KEY);
    if (last && VALID_PANELS.includes(last)) startPanel = last;
  } catch (_) {}
  showPanel(startPanel);

  bindSaleForm(els.saleFormNissim, 'nissim');
  bindSaleForm(els.saleFormDoron, 'doron');
  bindSaleForm(els.saleFormGlobal, null);

  setupSaleLineListeners(els.saleFormNissim, 'nissim');
  setupSaleLineListeners(els.saleFormDoron, 'doron');
  setupSaleLineListeners(els.saleFormGlobal, null);
  if (els.saleFormNissim?.querySelector('.js-sale-lines') && !els.saleFormNissim.querySelector('.sale-line-row')) {
    addSaleLineRow(els.saleFormNissim, 'nissim');
  }
  if (els.saleFormDoron?.querySelector('.js-sale-lines') && !els.saleFormDoron.querySelector('.sale-line-row')) {
    addSaleLineRow(els.saleFormDoron, 'doron');
  }
  if (els.saleFormGlobal?.querySelector('.js-sale-lines') && !els.saleFormGlobal.querySelector('.sale-line-row')) {
    addSaleLineRow(els.saleFormGlobal, els.saleBusinessSelect?.value || 'nissim');
  }

  els.saleBusinessSelect?.addEventListener('change', () => {
    repopulateAllSaleFormLineSelects();
  });

  els.orderBusiness.addEventListener('change', () => {
    refreshOrderLineSelects();
  });
  els.addOrderLineBtn.addEventListener('click', () => addOrderLineRow());
  els.orderForm.addEventListener('submit', onOrderSubmit);
  els.orderFilterBusiness.addEventListener('change', renderOrdersTable);
  els.orderFilterStatus.addEventListener('change', renderOrdersTable);

  els.inventorySearchNissim.addEventListener('input', renderInventoryNissim);
  els.clearInventorySearchBtn?.addEventListener('click', () => {
    els.inventorySearchNissim.value = '';
    renderInventoryNissim();
    els.inventorySearchNissim.focus();
  });
  els.salesSearch.addEventListener('input', renderSalesTable);
  els.samplesSearch?.addEventListener('input', renderSamplesTable);
  els.exportSamplesCsvBtn?.addEventListener('click', () => downloadCsv('vipo-samples-catalog.csv', buildSamplesCsvRows()));
  els.samplesBody?.addEventListener('click', e => {
    const btn = e.target.closest('.js-delete-sample');
    if (!btn) return;
    const sid = btn.getAttribute('data-sample-id');
    if (sid) deleteSampleRow(sid);
  });

  document.getElementById('accessLogoutBtn')?.addEventListener('click', () => {
    if (!confirm('לנעול את המערכת בטאב זה? יידרש קוד שוב.')) return;
    try {
      sessionStorage.removeItem(VIPO_GATE_SESSION_KEY);
    } catch (_) {
      /* */
    }
    document.documentElement.classList.remove('vipo-unlocked');
    location.reload();
  });

  els.printReportBtn.addEventListener('click', () => window.print());
  els.exportBackupBtn.addEventListener('click', exportBackup);
  els.importBackupInput.addEventListener('change', importBackup);
  els.exportSalesCsvBtn.addEventListener('click', () => downloadCsv('vipo-sales.csv', buildSalesCsvRows()));
  els.exportInventoryNissimCsvBtn.addEventListener('click', () => downloadCsv('vipo-inventory-nissim.csv', buildInventoryCsvRows('nissim')));
  els.exportInventoryDoronCsvBtn.addEventListener('click', () => downloadCsv('vipo-inventory-doron.csv', buildInventoryCsvRows('doron')));
  els.exportInventoryFullCsvBtn.addEventListener('click', () => downloadCsv('vipo-inventory-all.csv', buildInventoryCsvRows(null)));
  els.exportOrdersCsvBtn.addEventListener('click', () => downloadCsv('vipo-orders.csv', buildOrdersCsvRows()));
  els.clearFiltersBtn.addEventListener('click', () => {
    els.salesSearch.value = '';
    renderSalesTable();
  });
  els.resetSalesBtn.addEventListener('click', resetSales);
  els.resetOrdersBtn.addEventListener('click', resetOrders);
  els.receivedSaveBtn?.addEventListener('click', saveReceivedFromForm);
  els.exportGapsCsvBtn?.addEventListener('click', () => downloadCsv('vipo-gaps-ordered-vs-received.csv', buildGapsCsvRows()));

  els.paymentsSaveRateBtn?.addEventListener('click', () => {
    const r = Number(els.paymentsUsdRate?.value);
    if (!Number.isFinite(r) || r <= 0) {
      alert('שער לא תקין.');
      return;
    }
    payments.usdToIls = r;
    saveState();
    renderAll();
    showToast('שער הדולר נשמר');
  });

  els.exportPaymentsCsvBtn?.addEventListener('click', () => downloadCsv('vipo-payments.csv', buildPaymentsCsvRows()));

  els.paymentsNissimAddForm?.addEventListener('submit', ev => {
    ev.preventDefault();
    const fd = new FormData(els.paymentsNissimAddForm);
    const date = String(fd.get('date') || '').slice(0, 10);
    const amount = Number(fd.get('amount'));
    const note = String(fd.get('note') || '').trim();
    const flow = fd.get('flow') === PAY_FLOW_FROM_ME ? PAY_FLOW_FROM_ME : PAY_FLOW_TO_ME;
    if (!date || !Number.isFinite(amount) || amount < 0) {
      alert('תאריך וסכום תקינים נדרשים.');
      return;
    }
    payments.nissimLedger.unshift(normalizeLedgerEntry({ id: newId(), date, amountIls: amount, note, flow }));
    saveState();
    els.paymentsNissimAddForm.reset();
    setPaymentsAddFormDates();
    renderAll();
    showToast(flow === PAY_FLOW_FROM_ME ? 'החזרה לניסים נרשמה' : 'תשלום מניסים נרשם');
  });

  els.paymentsDoronAddForm?.addEventListener('submit', ev => {
    ev.preventDefault();
    const fd = new FormData(els.paymentsDoronAddForm);
    const date = String(fd.get('date') || '').slice(0, 10);
    const amount = Number(fd.get('amount'));
    const note = String(fd.get('note') || '').trim();
    const flow = fd.get('flow') === PAY_FLOW_FROM_ME ? PAY_FLOW_FROM_ME : PAY_FLOW_TO_ME;
    if (!date || !Number.isFinite(amount) || amount < 0) {
      alert('תאריך וסכום תקינים נדרשים.');
      return;
    }
    payments.doronLedger.unshift(normalizeLedgerEntry({ id: newId(), date, amountIls: amount, note, flow }));
    saveState();
    els.paymentsDoronAddForm.reset();
    setPaymentsAddFormDates();
    renderAll();
    showToast(flow === PAY_FLOW_FROM_ME ? 'החזרה לדורון נרשמה' : 'תשלום מדורון נרשם');
  });

  els.paymentsDoronCostsForm?.addEventListener('submit', ev => {
    ev.preventDefault();
    payments.doronProductIls = Math.max(0, numOr(els.payDoronProductIls?.value, 0));
    payments.doronShippingIls = Math.max(0, numOr(els.payDoronShippingIls?.value, 0));
    payments.doronExtrasIls = Math.max(0, numOr(els.payDoronExtrasIls?.value, 0));
    saveState();
    syncPaymentsFormInputs();
    renderAll();
    showToast('עלויות דורון נשמרו');
  });

  setSaleFormDates(els.saleFormNissim);
  setSaleFormDates(els.saleFormDoron);
  setSaleFormDates(els.saleFormGlobal);
  setPaymentsAddFormDates();
  renderAll();
}

initAccessGate();
