const STORAGE_KEY_V2 = 'vipo_inventory_state_v2';
const STORAGE_KEY_V1 = 'vipo_inventory_sales_v1';
const LEGACY_DORON_ID = 'doron-table-180x90x70';
const DORON_ID = 'doron-table-80x90x70';
const LAST_PANEL_KEY = 'vipo_last_panel';
const VALID_PANELS = ['dashboard', 'nissim', 'doron', 'received', 'gaps', 'orders', 'sales', 'payments'];

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
  saleItemGlobal: document.getElementById('saleItemGlobal'),
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
  payDoronRemaining: document.getElementById('payDoronRemaining')
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
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
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

function showPanel(id) {
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateSaleSelect(selectEl, business) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  const items = openingInventory.filter(i => i.business === business);
  for (const item of items) {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.product} · ${item.size} · נותר אצלי ${getRemainingQty(item.id)}`;
    selectEl.appendChild(opt);
  }
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

function readSaleFields(form) {
  return {
    date: form.querySelector('.js-sale-date')?.value,
    itemId: form.querySelector('.js-sale-item')?.value,
    qty: Number(form.querySelector('.js-sale-qty')?.value),
    unitPrice: Number(form.querySelector('.js-sale-price')?.value || 0),
    customer: form.querySelector('.js-sale-customer')?.value?.trim() || '',
    status: form.querySelector('.js-sale-status')?.value || 'שולם',
    notes: form.querySelector('.js-sale-notes')?.value?.trim() || ''
  };
}

function addSaleFromForm(form, business) {
  const f = readSaleFields(form);
  const item = getItem(f.itemId);
  if (!item || item.business !== business) {
    alert('בחרו מוצר תקין לעסק שנבחר.');
    return;
  }
  const remaining = getRemainingQty(f.itemId);
  if (!Number.isInteger(f.qty) || f.qty <= 0) {
    alert('יש להזין כמות שלמה חיובית.');
    return;
  }
  if (f.qty > remaining) {
    alert(`אין מספיק במלאי. נותרו ${remaining}.`);
    return;
  }
  sales.unshift({
    id: newId(),
    date: f.date,
    itemId: f.itemId,
    qty: f.qty,
    unitPrice: f.unitPrice,
    customer: f.customer,
    status: f.status,
    notes: f.notes,
    createdAt: new Date().toISOString()
  });
  saveState();
  form.reset();
  setSaleFormDates(form);
  const qtyInput = form.querySelector('.js-sale-qty');
  if (qtyInput) qtyInput.value = '1';
  if (form.id === 'saleFormGlobal' && els.saleBusinessSelect) {
    populateSaleSelect(els.saleItemGlobal, els.saleBusinessSelect.value);
  }
  renderAll();
  showToast('המכירה נשמרה והמלאי עודכן');
  const itemSel = form.querySelector('.js-sale-item');
  if (itemSel) requestAnimationFrame(() => itemSel.focus());
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
  els.salesBody.innerHTML = list.map((sale, idx) => {
    const item = getItem(sale.itemId) || {};
    const biz = item.business;
    const badge = biz === 'doron' ? 'badge--doron' : 'badge--nissim';
    const total = Number(sale.qty || 0) * Number(sale.unitPrice || 0);
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(sale.date)}</td>
        <td><span class="badge ${badge}">${escapeHtml(BUSINESS_LABEL[biz] || '')}</span></td>
        <td>${escapeHtml(item.product || '')}</td>
        <td><strong>${escapeHtml(item.size || '')}</strong></td>
        <td>${Number(sale.qty || 0)}</td>
        <td>${sale.unitPrice ? formatIls(sale.unitPrice) : '—'}</td>
        <td>${sale.unitPrice ? formatIls(total) : '—'}</td>
        <td>${escapeHtml(sale.customer || '—')}</td>
        <td>${escapeHtml(sale.status || '—')}</td>
        <td>${escapeHtml(sale.notes || '—')}</td>
        <td><button type="button" class="btn btn--small btn--danger" onclick="deleteSale('${sale.id}')">מחק</button></td>
      </tr>`;
  }).join('');
}

function deleteSale(id) {
  if (!confirm('למחוק מכירה? הכמות תוחזר למלאי.')) return;
  sales = sales.filter(s => s.id !== id);
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
  for (const line of o.lines) {
    sales.unshift({
      id: newId(),
      date: new Date().toISOString().slice(0, 10),
      itemId: line.itemId,
      qty: Number(line.qty),
      unitPrice: 0,
      customer: o.customer,
      status: 'בהמתנה',
      notes: `${notePrefix} · ${o.phone || ''}`.trim(),
      createdAt: new Date().toISOString(),
      relatedOrderId: o.id
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
    ['date', 'business', 'product', 'size', 'qty', 'unit_price_ils', 'total_ils', 'customer', 'payment_status', 'notes'],
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
        sale.notes
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
    payments
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

function renderAll() {
  renderDashboard();
  renderInventoryNissim();
  renderInventoryDoron();
  renderReceivedTables();
  renderGapsTable();
  renderSalesTable();
  renderOrdersTable();
  renderPayments();
  populateSaleSelect(els.saleFormNissim?.querySelector('.js-sale-item'), 'nissim');
  populateSaleSelect(els.saleFormDoron?.querySelector('.js-sale-item'), 'doron');
  if (els.saleBusinessSelect && els.saleItemGlobal) {
    populateSaleSelect(els.saleItemGlobal, els.saleBusinessSelect.value);
  }
}

function initNavigation() {
  els.navBtns.forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panel));
  });
  document.querySelectorAll('[data-go-panel]').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.getAttribute('data-go-panel')));
  });
}

function init() {
  const state = loadState();
  sales = state.sales;
  orders = state.orders;
  receivedByItemId = state.receivedByItemId || {};
  payments = state.payments || defaultPaymentsState();
  saveState();
  syncPaymentsFormInputs();

  els.orderDate.valueAsDate = new Date();
  addOrderLineRow();

  initNavigation();

  let startPanel = 'dashboard';
  try {
    const last = sessionStorage.getItem(LAST_PANEL_KEY);
    if (last && VALID_PANELS.includes(last)) startPanel = last;
  } catch (_) {}
  showPanel(startPanel);

  bindSaleForm(els.saleFormNissim, 'nissim');
  bindSaleForm(els.saleFormDoron, 'doron');
  bindSaleForm(els.saleFormGlobal, null);

  els.saleBusinessSelect?.addEventListener('change', () => {
    populateSaleSelect(els.saleItemGlobal, els.saleBusinessSelect.value);
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

init();
