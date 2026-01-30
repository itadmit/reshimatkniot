import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_AvIJSPH2G4Bc@ep-fragrant-bread-agpy8zhv-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function initDatabase() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  
  try {
    console.log('🔌 Connected to Neon PostgreSQL');
    
    // Create tables
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Families/Groups table
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Family members (many-to-many)
      CREATE TABLE IF NOT EXISTS family_members (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(family_id, user_id)
      );

      -- Categories (per family)
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        color VARCHAR(50),
        sort_order INTEGER DEFAULT 0
      );

      -- Products (per family)
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        unit VARCHAR(20) DEFAULT 'unit',
        barcode VARCHAR(50),
        price DECIMAL(10,2),
        image_url TEXT,
        manufacturer VARCHAR(100),
        quantity DECIMAL(10,2),
        quantity_unit VARCHAR(20),
        usage_count INTEGER DEFAULT 0
      );

      -- List items (per family)
      CREATE TABLE IF NOT EXISTS list_items (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        qty INTEGER DEFAULT 1,
        note TEXT,
        purchased BOOLEAN DEFAULT FALSE,
        added_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Settings (per family)
      CREATE TABLE IF NOT EXISTS family_settings (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE UNIQUE,
        dark_mode BOOLEAN DEFAULT FALSE,
        whatsapp_number VARCHAR(20)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
      CREATE INDEX IF NOT EXISTS idx_categories_family ON categories(family_id);
      CREATE INDEX IF NOT EXISTS idx_products_family ON products(family_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_list_items_family ON list_items(family_id);
    `);

    console.log('✅ Database schema created successfully!');
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Tables created:', tables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();

