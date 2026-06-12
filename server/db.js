import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, 'store.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'buyer' CHECK(role IN ('buyer', 'farmer', 'admin')),
    avatar_color TEXT DEFAULT '#4ade80',
    buyer_lat REAL,
    buyer_lng REAL,
    buyer_region TEXT,
    buyer_location TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS farms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    disease_safe INTEGER DEFAULT 0,
    certified_clean INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    lat REAL DEFAULT 0,
    lng REAL DEFAULT 0,
    owner_email TEXT,
    owner_phone TEXT,
    user_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('seed', 'fertiliser', 'produce')),
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    farm_id TEXT NOT NULL,
    disease_risk_tag TEXT NOT NULL CHECK(disease_risk_tag IN ('low', 'medium', 'high')),
    disease_type TEXT DEFAULT 'none',
    image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'archived')),
    quarantined INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (farm_id) REFERENCES farms(id)
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    product_id UNINDEXED,
    name,
    farm_name
  );

  CREATE TABLE IF NOT EXISTS region_disease_risk (
    region TEXT PRIMARY KEY,
    risk_level TEXT DEFAULT 'safe' CHECK(risk_level IN ('safe', 'watch', 'outbreak')),
    detection_count INTEGER DEFAULT 0,
    blight_type TEXT DEFAULT 'none',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS disease_alerts (
    id TEXT PRIMARY KEY,
    region TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'watch' CHECK(severity IN ('watch', 'outbreak')),
    blight_type TEXT DEFAULT 'early_blight',
    simulated_email INTEGER DEFAULT 0,
    simulated_sms INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    farm_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    buyer_name TEXT NOT NULL,
    approved INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id)
  );

  CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    farm_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('certified', 'revoked')),
    reason TEXT,
    blight_type TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (farm_id) REFERENCES farms(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    farm_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    revenue REAL NOT NULL,
    buyer_region TEXT,
    buyer_lat REAL,
    buyer_lng REAL,
    buyer_location TEXT,
    buyer_name TEXT,
    payment_method TEXT DEFAULT 'card',
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'paid',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id)
  );

  CREATE TABLE IF NOT EXISTS disease_scans (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    farm_id TEXT,
    image_url TEXT,
    disease_result TEXT NOT NULL,
    confidence REAL NOT NULL,
    severity TEXT NOT NULL,
    affected_area_pct REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

// ── SEED SINGLE ADMIN ACCOUNT ──
try {
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
  if (!adminExists) {
    const crypto = await import('crypto');
    const bcrypt = await import('bcryptjs');
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash('admin123', 10);
    db.prepare("INSERT INTO users (id, name, email, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, 'System Admin', 'admin@agrovision.com', hash, 'admin', '#f59e0b'
    );
    console.log('Seeded default admin account: admin@agrovision.com / admin123');
  }
} catch (e) {
  console.error('Failed to seed admin account:', e);
}

const addCol = (table, col, def) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name)
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`)
}
addCol('farms', 'lat', 'REAL DEFAULT 0')
addCol('farms', 'lng', 'REAL DEFAULT 0')
addCol('farms', 'owner_email', 'TEXT')
addCol('farms', 'owner_phone', 'TEXT')
addCol('farms', 'certified_clean', 'INTEGER DEFAULT 0')
addCol('farms', 'user_id', 'TEXT')
addCol('users', 'buyer_lat', 'REAL')
addCol('users', 'buyer_lng', 'REAL')
addCol('users', 'buyer_region', 'TEXT')
addCol('users', 'buyer_location', 'TEXT')
addCol('products', 'quarantined', 'INTEGER DEFAULT 0')
addCol('products', 'disease_type', 'TEXT DEFAULT "none"')
addCol('products', 'views', 'INTEGER DEFAULT 0')
addCol('products', 'description', 'TEXT DEFAULT ""')
addCol('region_disease_risk', 'blight_type', 'TEXT DEFAULT "none"')
addCol('disease_alerts', 'blight_type', 'TEXT DEFAULT "early_blight"')
addCol('sales', 'buyer_name', 'TEXT')
addCol('sales', 'buyer_lat', 'REAL')
addCol('sales', 'buyer_lng', 'REAL')
addCol('sales', 'buyer_location', 'TEXT')
addCol('sales', 'payment_method', 'TEXT DEFAULT "card"')
addCol('sales', 'payment_reference', 'TEXT')
addCol('sales', 'payment_status', 'TEXT DEFAULT "paid"')
addCol('disease_scans', 'heatmap', 'TEXT')

const seedData = db.transaction(() => {
  const insertFarm = db.prepare(`INSERT OR IGNORE INTO farms (id, name, region, disease_safe, certified_clean, rating, rating_count, lat, lng, owner_email, owner_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const farms = []
  farms.forEach(f => insertFarm.run(...f))

  const insertProduct = db.prepare(`INSERT OR IGNORE INTO products (id, name, category, price, quantity, farm_id, disease_risk_tag, disease_type, image_url, status, views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertFts = db.prepare(`INSERT OR IGNORE INTO products_fts (product_id, name, farm_name) VALUES (?, ?, ?)`)
  const products = []
  products.forEach(([id, name, cat, price, qty, fid, risk, dtype, img, status, views]) => {
    insertProduct.run(id, name, cat, price, qty, fid, risk, dtype, img, status, views)
    const farm = farms.find(f => f[0] === fid)
    insertFts.run(id, name, farm ? farm[1] : '')
  })

  const upsertRegion = db.prepare(`INSERT INTO region_disease_risk (region, risk_level, detection_count, blight_type) VALUES (?, ?, ?, ?)
    ON CONFLICT(region) DO UPDATE SET risk_level=excluded.risk_level, detection_count=excluded.detection_count, blight_type=excluded.blight_type`)
  
  upsertRegion.run('Nyandarua County', 'safe', 0, 'none')
  upsertRegion.run('Meru County', 'safe', 0, 'none')
  upsertRegion.run('Nakuru County', 'safe', 0, 'none')
  upsertRegion.run('Uasin Gishu', 'safe', 0, 'none')


  const insertAlert = db.prepare(`INSERT OR IGNORE INTO disease_alerts (id, region, message, severity, blight_type, simulated_email, simulated_sms) VALUES (?, ?, ?, ?, ?, ?, ?)`)


  const insertCert = db.prepare(`INSERT OR IGNORE INTO certifications (id, farm_id, status, reason, blight_type) VALUES (?, ?, ?, ?, ?)`)


  const insertReview = db.prepare(`INSERT OR IGNORE INTO reviews (id, product_id, farm_id, rating, comment, buyer_name, approved) VALUES (?, ?, ?, ?, ?, ?, ?)`)


  const insertSale = db.prepare(`INSERT OR IGNORE INTO sales (id, product_id, farm_id, quantity, revenue, buyer_region, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  const salesData = []
  salesData.forEach(s => insertSale.run(...s))
})

seedData()

export default db
