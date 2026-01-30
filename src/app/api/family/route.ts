import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/postgres';
import { cookies } from 'next/headers';

interface User {
  id: number;
  phone: string;
  name: string;
}

interface Family {
  id: number;
  name: string;
  owner_id: number;
}

// Get current family data
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;
    const currentFamilyId = cookieStore.get('current_family')?.value;

    if (!authPhone || !currentFamilyId) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    // Verify user and family membership
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    // Get family details with members
    const family = await queryOne<Family & { role: string }>(
      `SELECT f.*, fm.role FROM families f
       JOIN family_members fm ON fm.family_id = f.id
       WHERE f.id = $1 AND fm.user_id = $2`,
      [currentFamilyId, user.id]
    );

    if (!family) {
      return NextResponse.json({ error: 'אין גישה למשפחה זו' }, { status: 403 });
    }

    // Get all members
    const members = await query<{ id: number; name: string; phone: string; role: string }>(
      `SELECT u.id, u.name, u.phone, fm.role
       FROM users u
       JOIN family_members fm ON fm.user_id = u.id
       WHERE fm.family_id = $1`,
      [currentFamilyId]
    );

    return NextResponse.json({
      family: {
        id: family.id,
        name: family.name,
        role: family.role
      },
      members
    });
  } catch (error) {
    console.error('Get family error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת נתוני משפחה' }, { status: 500 });
  }
}

// Create new family/group
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;

    if (!authPhone) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'נדרש שם לקבוצה' }, { status: 400 });
    }

    const user = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    // Create new family
    const [newFamily] = await query<Family>(
      'INSERT INTO families (name, owner_id) VALUES ($1, $2) RETURNING *',
      [name, user.id]
    );

    // Add user as owner
    await query(
      'INSERT INTO family_members (family_id, user_id, role) VALUES ($1, $2, $3)',
      [newFamily.id, user.id, 'owner']
    );

    // Create default settings
    await query(
      'INSERT INTO family_settings (family_id, dark_mode) VALUES ($1, $2)',
      [newFamily.id, false]
    );

    const response = NextResponse.json({
      success: true,
      family: newFamily
    });

    // Switch to new family
    response.cookies.set('current_family', newFamily.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    return response;
  } catch (error) {
    console.error('Create family error:', error);
    return NextResponse.json({ error: 'שגיאה ביצירת קבוצה' }, { status: 500 });
  }
}

