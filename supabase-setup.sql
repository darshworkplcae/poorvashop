-- ============================================================
-- OM SHOP — Supabase Database Schema
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Bills table (every sale recorded here)
CREATE TABLE IF NOT EXISTS bills (
  id          BIGSERIAL PRIMARY KEY,
  bill_no     INTEGER NOT NULL,
  date        TIMESTAMPTZ DEFAULT NOW(),
  date_str    TEXT NOT NULL,          -- 'YYYY-MM-DD' for easy day filter
  total       DECIMAL(10,2) NOT NULL DEFAULT 0,
  item_count  INTEGER DEFAULT 0,
  is_deleted  BOOLEAN DEFAULT FALSE,  -- soft delete
  deleted_at  TIMESTAMPTZ,
  delete_note TEXT                    -- reason for deletion (optional)
);

-- Bill items (each row = one item in one bill)
CREATE TABLE IF NOT EXISTS bill_items (
  id          BIGSERIAL PRIMARY KEY,
  bill_id     BIGINT REFERENCES bills(id) ON DELETE CASCADE,
  item_no     INTEGER,
  item_name   TEXT,                   -- Hindi/Marathi name
  item_name_en TEXT,                  -- English name
  weight      DECIMAL(8,3),
  price_per_kg DECIMAL(8,2),
  amount      DECIMAL(10,2)
);

-- Products (item number → name + price list)
CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  item_no     INTEGER UNIQUE NOT NULL,
  name        TEXT,
  name_hindi  TEXT,
  category    TEXT DEFAULT 'Vegetables',
  price       DECIMAL(8,2) NOT NULL DEFAULT 0,
  unit        TEXT DEFAULT 'kg',
  active      BOOLEAN DEFAULT TRUE
);

-- Farmer purchases (stock that came in from farmers)
CREATE TABLE IF NOT EXISTS purchases (
  id          BIGSERIAL PRIMARY KEY,
  date        TIMESTAMPTZ DEFAULT NOW(),
  date_str    TEXT NOT NULL,
  farmer_name TEXT DEFAULT 'Unknown',
  total_cost  DECIMAL(10,2) DEFAULT 0
);

-- Farmer purchase items
CREATE TABLE IF NOT EXISTS purchase_items (
  id          BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT REFERENCES purchases(id) ON DELETE CASCADE,
  item_no     INTEGER,
  item_name   TEXT,
  quantity    DECIMAL(8,3),
  price_per_kg DECIMAL(8,2),
  total_cost  DECIMAL(10,2)
);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- ── Disable Row Level Security (single-shop app, no multi-user) ──
ALTER TABLE bills          DISABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items     DISABLE ROW LEVEL SECURITY;
ALTER TABLE products       DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases      DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings       DISABLE ROW LEVEL SECURITY;

-- ── Indexes for fast queries ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bills_date_str   ON bills(date_str);
CREATE INDEX IF NOT EXISTS idx_bills_is_deleted ON bills(is_deleted);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill  ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date   ON purchases(date_str);

-- ── Default settings ──────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
  ('shopName',    'POORVA SHOP'),
  ('shopAddress', 'Pune, Maharashtra'),
  ('startBillNo', '1000')
ON CONFLICT (key) DO NOTHING;

-- ── Seed products (89 items) ───────────────
INSERT INTO products (item_no, name, name_hindi, category, price, unit) VALUES
(1,'Onion','कांदा','Vegetables',0,'kg'),
(2,'Potato','बटाटा','Vegetables',0,'kg'),
(3,'Ginger','अद्रक','Vegetables',0,'kg'),
(4,'Garlic','लसूण','Vegetables',0,'पेंडी'),
(5,'Tomato','टोमॅटो','Vegetables',0,'kg'),
(6,'Black Pepper','काळी मिरची','Vegetables',0,'kg'),
(7,'White Pepper','पांढरी मिरची','Vegetables',0,'kg'),
(8,'Capsicum','शिमला','Vegetables',0,'kg'),
(9,'Cluster Beans','गवार','Vegetables',0,'kg'),
(10,'Cabbage','कोबी','Vegetables',0,'kg'),
(11,'Cauliflower','फ्लावर','Vegetables',0,'kg'),
(12,'Green Beans','हिरव्या शेंगा','Vegetables',0,'kg'),
(13,'Lady Finger','भेंडी','Vegetables',0,'kg'),
(14,'Cowpea','चवळी','Vegetables',0,'kg'),
(15,'Beans','बीन्स','Vegetables',0,'kg'),
(16,'Ridge Gourd','दोंडका','Vegetables',0,'kg'),
(17,'Val Papdi','वालवर','Vegetables',0,'kg'),
(18,'Bitter Gourd','कारली','Vegetables',0,'kg'),
(19,'Bottle Gourd','दुधी','Vegetables',0,'kg'),
(20,'Black Field Beans','काळा घेवडा','Vegetables',0,'kg'),
(21,'White Field Beans','पांढरा घेवडा','Vegetables',0,'kg'),
(22,'Lima Beans','पावटे','Vegetables',0,'kg'),
(23,'Green Peas','वाटाणा','Vegetables',0,'kg'),
(24,'Amla','आवळी','Vegetables',0,'kg'),
(25,'Yam','सुरण','Vegetables',0,'kg'),
(26,'Gharvar','घरवर','Vegetables',0,'kg'),
(27,'Red Pumpkin','लाल भोपळा','Vegetables',0,'kg'),
(28,'Brinjal','वांगी','Vegetables',0,'kg'),
(29,'Drumstick','शेवगा','Vegetables',0,'kg'),
(30,'Cowpea','चवळी','Vegetables',0,'kg'),
(31,'Moth Beans','मटकी','Vegetables',0,'kg'),
(32,'Shelled Field Beans','घेवडा सोललेला','Vegetables',0,'kg'),
(33,'Shelled Black Beans','काळा सोललेला','Vegetables',0,'kg'),
(34,'Cucumber','काकडी','Vegetables',0,'kg'),
(35,'Lemon','लिंबू','Vegetables',0,'kg'),
(36,'Carrot','गाजर','Vegetables',0,'kg'),
(37,'Beetroot','बीट','Vegetables',0,'kg'),
(38,'Radish','मुळा','Vegetables',0,'kg'),
(39,'Black Brinjal','काळा वांग','Vegetables',0,'kg'),
(40,'Chandara Brinjal','चांदरा वांग','Vegetables',0,'kg'),
(41,'Broccoli','ब्रोकोली','Vegetables',0,'kg'),
(42,'Papdi','पापडी','Vegetables',0,'kg'),
(43,'Sweet Potato','रताळे','Vegetables',0,'kg'),
(44,'Turmeric','हळद','Vegetables',0,'kg'),
(45,'Red Curry','रेड क्युरी','Vegetables',0,'kg'),
(46,'Fenugreek Leaves','मेथी','Herbs',0,'पेंडी'),
(47,'Red Chilli','लाल मिरची','Vegetables',0,'kg'),
(48,'Indian Gooseberry','आवळा','Fruits',0,'kg'),
(49,'Snake Gourd','घोसावळी','Vegetables',0,'kg'),
(50,'Karaduli','करदुळी','Vegetables',0,'kg'),
(51,'Ivy Gourd','तोंडली','Vegetables',0,'kg'),
(52,'Broccoli','ब्रोकोली','Vegetables',0,'kg'),
(53,'Zhakalee','झाकळी','Vegetables',0,'kg'),
(54,'Jackfruit','फणस','Vegetables',0,'kg'),
(55,'Unknown','———','Other',0,'kg'),
(56,'Curry Leaves','कढीपत्ता','Herbs',0,'पेंडी'),
(57,'Coriander Leaves','कोथिंबीर','Herbs',0,'पेंडी'),
(58,'Fenugreek Leaves','मेथी','Herbs',0,'पेंडी'),
(59,'Dill Leaves','शेपू','Herbs',0,'पेंडी'),
(60,'Spinach','पालक','Herbs',0,'पेंडी'),
(61,'Spring Onion','कांद्यापात','Vegetables',0,'पेंडी'),
(62,'Radish','मुळा','Vegetables',0,'पेंडी'),
(63,'Mint Leaves','पुदिना','Herbs',0,'पेंडी'),
(64,'Sorrel Leaves','चुका','Herbs',0,'पेंडी'),
(65,'Cowpea','चवळी','Vegetables',0,'पेंडी'),
(66,'Red Amaranth','लालमाठ','Herbs',0,'पेंडी'),
(67,'Beetroot','बीट','Vegetables',0,'kg'),
(68,'Karadali','करदळी','Vegetables',0,'kg'),
(69,'Papaya','पपई','Fruits',0,'kg'),
(70,'Banana','केळी','Fruits',0,'kg'),
(71,'Apple-1','सफरचंद-१','Fruits',0,'kg'),
(72,'Apple-2','सफरचंद-२','Fruits',0,'kg'),
(73,'Guava-1','पेरू-१','Fruits',0,'kg'),
(74,'Guava-2','पेरू-२','Fruits',0,'kg'),
(75,'Orange','संत्रे','Fruits',0,'kg'),
(76,'Sweet Lime','मोसंबी','Fruits',0,'kg'),
(77,'Pomegranate','डाळिंब','Fruits',0,'kg'),
(78,'Chikoo','चिक्कू','Fruits',0,'kg'),
(79,'Papaya','पपई','Fruits',0,'kg'),
(80,'Raw Mango','कैरी','Fruits',0,'kg'),
(81,'Mango','आंबा','Fruits',0,'kg'),
(82,'Custard Apple','सिताफळ','Fruits',0,'kg'),
(83,'Cashew','काजू','Fruits',0,'kg'),
(84,'Corn','मका','Vegetables',0,'piece'),
(85,'Cabbage','कोबी','Vegetables',0,'kg'),
(86,'Strawberry','स्ट्रॉबेरी','Fruits',0,'kg'),
(87,'Dragon Fruit','ड्रॅगनफ्रूट','Fruits',0,'kg'),
(88,'Pineapple','अननस','Fruits',0,'kg'),
(89,'Tamarind','चिंच','Other',0,'kg')
ON CONFLICT (item_no) DO NOTHING;

-- ============================================================
-- DONE! Your database is ready.
-- Now go to Project Settings → API → copy URL and anon key
-- Paste them in your .env file
-- ============================================================
