import Dexie from 'dexie';

export const db = new Dexie('OmShopDB');

db.version(1).stores({
  products:  '++id, itemNo, name, nameHindi, category, price, unit, active',
  bills:     '++id, billNo, date, dateStr, total, itemCount, printed',
  billItems: '++id, billId, itemNo, itemName, weight, pricePerKg, amount',
  purchases: '++id, date, dateStr, farmerName, totalCost',
  purchaseItems: '++id, purchaseId, itemNo, itemName, quantity, pricePerKg, totalCost',
  settings:  'key',
});

// ─── Seed default products on first run ────────────────────────────────────
db.on('ready', async () => {
  const count = await db.products.count();
  if (count === 0) await seedProducts();
});

async function seedProducts() {
  const defaults = [
    { itemNo:1,  name:'Onion',        nameHindi:'कांदा',         category:'Vegetables', price:25,  unit:'kg', active:1 },
    { itemNo:2,  name:'Potato',       nameHindi:'बटाटा',         category:'Vegetables', price:20,  unit:'kg', active:1 },
    { itemNo:3,  name:'Ginger',       nameHindi:'अद्रक',         category:'Vegetables', price:80,  unit:'kg', active:1 },
    { itemNo:4,  name:'Garlic',       nameHindi:'लसूण',          category:'Vegetables', price:120, unit:'kg', active:1 },
    { itemNo:5,  name:'Tomato',       nameHindi:'टमाटर',         category:'Vegetables', price:30,  unit:'kg', active:1 },
    { itemNo:6,  name:'Lady Finger',  nameHindi:'भेंडी',         category:'Vegetables', price:40,  unit:'kg', active:1 },
    { itemNo:7,  name:'Brinjal',      nameHindi:'वांगी',         category:'Vegetables', price:30,  unit:'kg', active:1 },
    { itemNo:8,  name:'Cauliflower',  nameHindi:'फ्लावर',        category:'Vegetables', price:35,  unit:'kg', active:1 },
    { itemNo:9,  name:'Cabbage',      nameHindi:'कोबी',          category:'Vegetables', price:25,  unit:'kg', active:1 },
    { itemNo:10, name:'Carrot',       nameHindi:'गाजर',          category:'Vegetables', price:40,  unit:'kg', active:1 },
    { itemNo:11, name:'Radish',       nameHindi:'मूळा',          category:'Vegetables', price:20,  unit:'kg', active:1 },
    { itemNo:12, name:'Spinach',      nameHindi:'पालक',          category:'Vegetables', price:30,  unit:'kg', active:1 },
    { itemNo:13, name:'Fenugreek',    nameHindi:'मेथी',          category:'Vegetables', price:25,  unit:'kg', active:1 },
    { itemNo:14, name:'Coriander',    nameHindi:'कोथिंबीर',      category:'Vegetables', price:20,  unit:'kg', active:1 },
    { itemNo:15, name:'Drumstick',    nameHindi:'शेवगा',         category:'Vegetables', price:60,  unit:'kg', active:1 },
    { itemNo:16, name:'Ridge Gourd',  nameHindi:'दोडका',         category:'Vegetables', price:25,  unit:'kg', active:1 },
    { itemNo:17, name:'Bottle Gourd', nameHindi:'दुधी',          category:'Vegetables', price:20,  unit:'kg', active:1 },
    { itemNo:18, name:'Bitter Gourd', nameHindi:'कारले',         category:'Vegetables', price:40,  unit:'kg', active:1 },
    { itemNo:19, name:'Cucumber',     nameHindi:'काकडी',         category:'Vegetables', price:25,  unit:'kg', active:1 },
    { itemNo:20, name:'Green Chili',  nameHindi:'मिरची',         category:'Vegetables', price:60,  unit:'kg', active:1 },
    { itemNo:21, name:'Capsicum',     nameHindi:'शिमला मिर्च',   category:'Vegetables', price:80,  unit:'kg', active:1 },
    { itemNo:22, name:'Lemon',        nameHindi:'लिंबू',         category:'Vegetables', price:60,  unit:'kg', active:1 },
    { itemNo:23, name:'Turmeric',     nameHindi:'हळद',           category:'Vegetables', price:100, unit:'kg', active:1 },
    { itemNo:24, name:'Yam',          nameHindi:'सुरण',          category:'Vegetables', price:30,  unit:'kg', active:1 },
    { itemNo:25, name:'Beetroot',     nameHindi:'बीट',           category:'Vegetables', price:30,  unit:'kg', active:1 },
    { itemNo:26, name:'Spring Onion', nameHindi:'कांदापात',      category:'Vegetables', price:30,  unit:'kg', active:1 },
    { itemNo:27, name:'Cluster Beans',nameHindi:'गवार',          category:'Vegetables', price:35,  unit:'kg', active:1 },
    { itemNo:28, name:'Field Beans',  nameHindi:'पावटा',         category:'Vegetables', price:40,  unit:'kg', active:1 },
    { itemNo:29, name:'Val Beans',    nameHindi:'वाल',           category:'Vegetables', price:60,  unit:'kg', active:1 },
    { itemNo:30, name:'Chavli',       nameHindi:'चवळी',          category:'Vegetables', price:45,  unit:'kg', active:1 },
    { itemNo:31, name:'Ivy Gourd',    nameHindi:'तोंडली',        category:'Vegetables', price:30,  unit:'kg', active:1 },
    { itemNo:32, name:'French Beans', nameHindi:'घेवडा',         category:'Vegetables', price:50,  unit:'kg', active:1 },
    { itemNo:33, name:'Pumpkin',      nameHindi:'भोपळा',         category:'Vegetables', price:20,  unit:'kg', active:1 },
    { itemNo:34, name:'Sweet Corn',   nameHindi:'मका',           category:'Vegetables', price:30,  unit:'piece', active:1 },
    { itemNo:35, name:'Raw Banana',   nameHindi:'कच्चं केळ',     category:'Vegetables', price:25,  unit:'kg', active:1 },
    { itemNo:36, name:'Jackfruit',    nameHindi:'फणस',           category:'Vegetables', price:40,  unit:'kg', active:1 },
    { itemNo:37, name:'Raw Mango',    nameHindi:'कैरी',          category:'Fruits', price:50,  unit:'kg', active:1 },
    { itemNo:38, name:'Banana',       nameHindi:'केळी',          category:'Fruits', price:40,  unit:'kg', active:1 },
    { itemNo:39, name:'Mango',        nameHindi:'आंबा',          category:'Fruits', price:80,  unit:'kg', active:1 },
    { itemNo:40, name:'Apple',        nameHindi:'सफरचंद',        category:'Fruits', price:150, unit:'kg', active:1 },
    { itemNo:41, name:'Orange',       nameHindi:'संत्रा',        category:'Fruits', price:60,  unit:'kg', active:1 },
    { itemNo:42, name:'Grapes',       nameHindi:'द्राक्ष',       category:'Fruits', price:80,  unit:'kg', active:1 },
    { itemNo:43, name:'Watermelon',   nameHindi:'टरबूज',         category:'Fruits', price:25,  unit:'kg', active:1 },
    { itemNo:44, name:'Papaya',       nameHindi:'पपई',           category:'Fruits', price:30,  unit:'kg', active:1 },
    { itemNo:45, name:'Pineapple',    nameHindi:'अनानस',         category:'Fruits', price:50,  unit:'kg', active:1 },
    { itemNo:46, name:'Coconut',      nameHindi:'नारळ',          category:'Fruits', price:25,  unit:'piece', active:1 },
    { itemNo:47, name:'Chiku',        nameHindi:'चिकू',          category:'Fruits', price:60,  unit:'kg', active:1 },
    { itemNo:48, name:'Guava',        nameHindi:'पेरू',          category:'Fruits', price:40,  unit:'kg', active:1 },
    { itemNo:49, name:'Custard Apple',nameHindi:'सीताफळ',        category:'Fruits', price:80,  unit:'kg', active:1 },
    { itemNo:50, name:'Pomegranate',  nameHindi:'डाळिंब',        category:'Fruits', price:120, unit:'kg', active:1 },
    { itemNo:51, name:'Strawberry',   nameHindi:'स्ट्रॉबेरी',    category:'Fruits', price:200, unit:'kg', active:1 },
    { itemNo:52, name:'Sapota',       nameHindi:'चिकू',          category:'Fruits', price:50,  unit:'kg', active:1 },
    { itemNo:53, name:'Kiwi',         nameHindi:'कीवी',          category:'Fruits', price:200, unit:'kg', active:1 },
    { itemNo:54, name:'Dragon Fruit', nameHindi:'ड्रैगन फ्रूट',  category:'Fruits', price:300, unit:'kg', active:1 },
    { itemNo:55, name:'Pear',         nameHindi:'नाशपाती',       category:'Fruits', price:100, unit:'kg', active:1 },
    { itemNo:56, name:'Plum',         nameHindi:'बेर',           category:'Fruits', price:80,  unit:'kg', active:1 },
    { itemNo:57, name:'Peach',        nameHindi:'आड़ू',          category:'Fruits', price:120, unit:'kg', active:1 },
    { itemNo:58, name:'Litchi',       nameHindi:'लीची',          category:'Fruits', price:100, unit:'kg', active:1 },
    { itemNo:59, name:'Tamarind',     nameHindi:'चिंच',          category:'Other',  price:80,  unit:'kg', active:1 },
    { itemNo:60, name:'Pudina',       nameHindi:'पुदिना',        category:'Herbs',  price:10,  unit:'bunch', active:1 },
    { itemNo:61, name:'Curry Leaves', nameHindi:'कढीपत्ता',      category:'Herbs',  price:10,  unit:'bunch', active:1 },
    { itemNo:62, name:'Drumstick Leaves',nameHindi:'शेवग्याची पाने',category:'Herbs',price:20, unit:'bunch', active:1 },
    { itemNo:63, name:'Ambat Chukka', nameHindi:'चुका',          category:'Herbs',  price:20,  unit:'kg', active:1 },
    { itemNo:64, name:'Broccoli',     nameHindi:'ब्रोकोली',      category:'Vegetables', price:80, unit:'kg', active:1 },
    { itemNo:65, name:'Celery',       nameHindi:'सेलरी',         category:'Vegetables', price:60, unit:'kg', active:1 },
    { itemNo:66, name:'Zucchini',     nameHindi:'झुकिनी',        category:'Vegetables', price:60, unit:'kg', active:1 },
  ];
  await db.products.bulkAdd(defaults);
}

// ─── Helper: next bill number ───────────────────────────────────────────────
export async function getNextBillNo() {
  const last = await db.bills.orderBy('id').last();
  const setting = await db.settings.get('startBillNo');
  const start = setting ? Number(setting.value) : 1000;
  return last ? last.billNo + 1 : start;
}

// ─── Today's date string ────────────────────────────────────────────────────
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Save a complete bill ───────────────────────────────────────────────────
export async function saveBill(items, total) {
  const billNo = await getNextBillNo();
  const now = new Date();
  const billId = await db.bills.add({
    billNo,
    date: now,
    dateStr: todayStr(),
    total,
    itemCount: items.length,
    printed: 0,
  });
  const billItems = items.map(it => ({ ...it, billId }));
  await db.billItems.bulkAdd(billItems);
  return { billNo, billId };
}

// ─── Daily report ───────────────────────────────────────────────────────────
export async function getDailyStats(dateStr) {
  const bills = await db.bills.where('dateStr').equals(dateStr).toArray();
  const total = bills.reduce((s, b) => s + b.total, 0);
  return { bills: bills.length, total };
}

// ─── Last N days data ───────────────────────────────────────────────────────
export async function getLastNDays(n = 7) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const bills = await db.bills.where('dateStr').equals(dateStr).toArray();
    const total = bills.reduce((s, b) => s + b.total, 0);
    const label = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
    result.push({ dateStr, label, total, billCount: bills.length });
  }
  return result;
}
