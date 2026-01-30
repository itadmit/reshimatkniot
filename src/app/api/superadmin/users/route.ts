import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Check if user is super admin
async function isSuperAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const userPhone = cookieStore.get("user_phone")?.value;
  const adminPhone = process.env.ADMIN_USER;
  
  return userPhone === adminPhone;
}

// GET - Get all users with their stats
export async function GET() {
  try {
    const isAdmin = await isSuperAdmin();
    console.log("Is super admin:", isAdmin);
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();
    
    try {
      // First, get all users
      const usersResult = await client.query(`
        SELECT id, phone, name, created_at
        FROM users
        ORDER BY created_at DESC
      `);

      const users = [];

      for (const user of usersResult.rows) {
        // Get families for this user
        const familiesResult = await client.query(`
          SELECT 
            f.id,
            f.name,
            fm.is_owner,
            f.created_at,
            (SELECT COUNT(*)::int FROM categories WHERE family_id = f.id) as categories_count,
            (SELECT COUNT(*)::int FROM products WHERE family_id = f.id) as products_count,
            (SELECT COUNT(*)::int FROM list_items WHERE family_id = f.id) as list_items_count,
            (SELECT COUNT(*)::int FROM family_members WHERE family_id = f.id) as members_count
          FROM family_members fm
          JOIN families f ON fm.family_id = f.id
          WHERE fm.user_id = $1
        `, [user.id]);

        // Get WhatsApp settings (from family where user is owner)
        let whatsappSettings = null;
        const ownerFamily = familiesResult.rows.find(f => f.is_owner);
        if (ownerFamily) {
          const settingsResult = await client.query(`
            SELECT 
              whatsapp_api_url,
              whatsapp_instance_id,
              CASE WHEN whatsapp_token IS NOT NULL AND whatsapp_token != '' THEN true ELSE false END as whatsapp_token,
              whatsapp_default_phone
            FROM settings
            WHERE family_id = $1
            LIMIT 1
          `, [ownerFamily.id]);
          
          if (settingsResult.rows.length > 0) {
            whatsappSettings = settingsResult.rows[0];
          }
        }

        users.push({
          ...user,
          families: familiesResult.rows.length > 0 ? familiesResult.rows : null,
          whatsapp_settings: whatsappSettings
        });
      }

      return NextResponse.json({ 
        success: true, 
        users,
        total: users.length
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Super admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

