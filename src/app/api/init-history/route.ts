import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// GET - Initialize list_history table
export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS list_history (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        items JSONB NOT NULL,
        total_items INTEGER NOT NULL,
        sent_to VARCHAR(20),
        created_by INTEGER REFERENCES users(id),
        sent_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index for faster queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_list_history_family_id ON list_history(family_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_list_history_sent_at ON list_history(sent_at DESC)
    `);

    return NextResponse.json({ success: true, message: 'Table list_history created successfully' });
  } catch (error) {
    console.error('Init history table error:', error);
    return NextResponse.json({ error: 'Failed to create table', details: String(error) }, { status: 500 });
  }
}

