import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/postgres';
import { cookies } from 'next/headers';

interface User {
  id: number;
}

interface ListHistory {
  id: number;
  family_id: number;
  items: string; // JSON string of items
  total_items: number;
  sent_to: string | null;
  sent_at: Date;
  created_by: number;
}

// GET - Fetch list history for current family
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;
    const currentFamilyId = cookieStore.get('current_family')?.value;

    if (!authPhone || !currentFamilyId) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    // Verify user
    const user = await queryOne<User>(
      'SELECT id FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    // Verify membership
    const membership = await queryOne(
      'SELECT * FROM family_members WHERE family_id = $1 AND user_id = $2',
      [currentFamilyId, user.id]
    );

    if (!membership) {
      return NextResponse.json({ error: 'אין גישה לקבוצה' }, { status: 403 });
    }

    // Fetch history
    const history = await query<ListHistory>(
      `SELECT lh.id, lh.items, lh.total_items, lh.sent_to, lh.sent_at, u.name as created_by_name
       FROM list_history lh
       LEFT JOIN users u ON u.id = lh.created_by
       WHERE lh.family_id = $1
       ORDER BY lh.sent_at DESC
       LIMIT 50`,
      [currentFamilyId]
    );

    return NextResponse.json({ history });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת היסטוריה' }, { status: 500 });
  }
}

// POST - Save list to history
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;
    const currentFamilyId = cookieStore.get('current_family')?.value;

    if (!authPhone || !currentFamilyId) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    const user = await queryOne<User>(
      'SELECT id FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const membership = await queryOne(
      'SELECT * FROM family_members WHERE family_id = $1 AND user_id = $2',
      [currentFamilyId, user.id]
    );

    if (!membership) {
      return NextResponse.json({ error: 'אין גישה לקבוצה' }, { status: 403 });
    }

    const { items, totalItems, sentTo } = await request.json();

    // Save to history
    const [result] = await query(
      `INSERT INTO list_history (family_id, items, total_items, sent_to, created_by, sent_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [currentFamilyId, JSON.stringify(items), totalItems, sentTo, user.id]
    );

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('History save error:', error);
    return NextResponse.json({ error: 'שגיאה בשמירת היסטוריה' }, { status: 500 });
  }
}

