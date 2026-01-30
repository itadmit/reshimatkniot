import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST - Return to admin account from impersonation
export async function POST() {
  try {
    const cookieStore = await cookies();
    const originalPhone = cookieStore.get("original_admin_phone")?.value;
    const adminPhone = process.env.ADMIN_USER;

    if (!originalPhone || originalPhone !== adminPhone) {
      return NextResponse.json({ error: "No impersonation session found" }, { status: 400 });
    }

    // Restore admin phone
    cookieStore.set("user_phone", originalPhone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    // Clear original admin cookie
    cookieStore.delete("original_admin_phone");
    
    // Clear current family (admin will need to select)
    cookieStore.delete("current_family_id");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Return to admin error:", error);
    return NextResponse.json(
      { error: "Failed to return to admin" },
      { status: 500 }
    );
  }
}

