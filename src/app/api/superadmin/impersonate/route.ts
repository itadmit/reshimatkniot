import { NextRequest, NextResponse } from "next/server";
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

// POST - Impersonate a user (login as them)
export async function POST(request: NextRequest) {
  try {
    if (!await isSuperAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Get user info
      const userResult = await client.query(
        "SELECT id, phone, name FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const user = userResult.rows[0];

      // Get user's families
      const familiesResult = await client.query(`
        SELECT f.id, f.name, fm.is_owner
        FROM families f
        JOIN family_members fm ON f.id = fm.family_id
        WHERE fm.user_id = $1
      `, [userId]);

      // Set cookies for impersonation
      const cookieStore = await cookies();
      
      // Save original admin phone for returning
      const originalPhone = cookieStore.get("user_phone")?.value;
      cookieStore.set("original_admin_phone", originalPhone || "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      });

      // Set impersonated user phone
      cookieStore.set("user_phone", user.phone, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      // Set current family if user has one
      if (familiesResult.rows.length > 0) {
        cookieStore.set("current_family_id", familiesResult.rows[0].id.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }

      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name
        },
        families: familiesResult.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Impersonate error:", error);
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500 }
    );
  }
}

