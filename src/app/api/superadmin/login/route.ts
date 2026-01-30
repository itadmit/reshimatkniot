import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST - Login as super admin
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    const adminPhone = process.env.ADMIN_USER;

    if (!phone) {
      return NextResponse.json({ error: "מספר טלפון נדרש" }, { status: 400 });
    }

    // Check if phone matches admin
    if (phone !== adminPhone) {
      return NextResponse.json({ error: "אין הרשאת גישה. מספר זה אינו מורשה." }, { status: 401 });
    }

    // Set admin cookie
    const cookieStore = await cookies();
    cookieStore.set("user_phone", phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Mark as super admin session
    cookieStore.set("is_super_admin", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Super admin login error:", error);
    return NextResponse.json(
      { error: "שגיאה בהתחברות" },
      { status: 500 }
    );
  }
}

