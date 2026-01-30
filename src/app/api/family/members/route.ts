import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/postgres';
import { cookies } from 'next/headers';

interface User {
  id: number;
  phone: string;
  name: string;
}

// Add member to family
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;
    const currentFamilyId = cookieStore.get('current_family')?.value;

    if (!authPhone || !currentFamilyId) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    const { phone, name } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'נדרש מספר טלפון' }, { status: 400 });
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/[\s-]/g, '');

    // Verify current user is owner of the family
    const currentUser = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!currentUser) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const membership = await queryOne<{ role: string }>(
      'SELECT role FROM family_members WHERE family_id = $1 AND user_id = $2',
      [currentFamilyId, currentUser.id]
    );

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'רק הבעלים יכול להוסיף חברים' }, { status: 403 });
    }

    // Check if user exists, if not create them
    let targetUser = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1',
      [normalizedPhone]
    );

    if (!targetUser) {
      // Create new user (they'll set their name when they first login)
      const userName = name || `חבר חדש`;
      const [newUser] = await query<User>(
        'INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING *',
        [normalizedPhone, userName]
      );
      targetUser = newUser;
    }

    // Check if already a member
    const existingMembership = await queryOne(
      'SELECT * FROM family_members WHERE family_id = $1 AND user_id = $2',
      [currentFamilyId, targetUser.id]
    );

    if (existingMembership) {
      return NextResponse.json({ error: 'המשתמש כבר חבר בקבוצה' }, { status: 409 });
    }

    // Add to family
    await query(
      'INSERT INTO family_members (family_id, user_id, role) VALUES ($1, $2, $3)',
      [currentFamilyId, targetUser.id, 'member']
    );

    return NextResponse.json({
      success: true,
      member: {
        id: targetUser.id,
        name: targetUser.name,
        phone: targetUser.phone,
        role: 'member'
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'שגיאה בהוספת חבר' }, { status: 500 });
  }
}

// Remove member from family
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;
    const currentFamilyId = cookieStore.get('current_family')?.value;

    if (!authPhone || !currentFamilyId) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'נדרש מזהה משתמש' }, { status: 400 });
    }

    // Verify current user is owner
    const currentUser = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!currentUser) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const membership = await queryOne<{ role: string }>(
      'SELECT role FROM family_members WHERE family_id = $1 AND user_id = $2',
      [currentFamilyId, currentUser.id]
    );

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'רק הבעלים יכול להסיר חברים' }, { status: 403 });
    }

    // Can't remove yourself as owner
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'לא ניתן להסיר את עצמך' }, { status: 400 });
    }

    // Remove from family
    await query(
      'DELETE FROM family_members WHERE family_id = $1 AND user_id = $2',
      [currentFamilyId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'שגיאה בהסרת חבר' }, { status: 500 });
  }
}

