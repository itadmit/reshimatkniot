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
    if (!await isSuperAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();
    
    try {
      // Get all users with their family info and stats
      const result = await client.query(`
        SELECT 
          u.id,
          u.phone,
          u.name,
          u.created_at,
          (
            SELECT json_agg(json_build_object(
              'id', f.id,
              'name', f.name,
              'is_owner', fm.is_owner,
              'created_at', f.created_at,
              'categories_count', (SELECT COUNT(*) FROM categories WHERE family_id = f.id),
              'products_count', (SELECT COUNT(*) FROM products WHERE family_id = f.id),
              'list_items_count', (SELECT COUNT(*) FROM list_items WHERE family_id = f.id),
              'members_count', (SELECT COUNT(*) FROM family_members WHERE family_id = f.id)
            ))
            FROM family_members fm
            JOIN families f ON fm.family_id = f.id
            WHERE fm.user_id = u.id
          ) as families,
          (
            SELECT json_build_object(
              'whatsapp_api_url', s.whatsapp_api_url,
              'whatsapp_instance_id', s.whatsapp_instance_id,
              'whatsapp_token', CASE WHEN s.whatsapp_token IS NOT NULL AND s.whatsapp_token != '' THEN true ELSE false END,
              'whatsapp_default_phone', s.whatsapp_default_phone
            )
            FROM settings s
            JOIN family_members fm ON s.family_id = fm.family_id
            WHERE fm.user_id = u.id AND fm.is_owner = true
            LIMIT 1
          ) as whatsapp_settings
        FROM users u
        ORDER BY u.created_at DESC
      `);

      return NextResponse.json({ 
        success: true, 
        users: result.rows,
        total: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Super admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

