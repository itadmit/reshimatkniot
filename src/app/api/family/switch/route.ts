import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/postgres';
import { cookies } from 'next/headers';

interface User {
  id: number;
}

// Switch to different family
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;

    if (!authPhone) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    const { familyId } = await request.json();

    if (!familyId) {
      return NextResponse.json({ error: 'נדרש מזהה קבוצה' }, { status: 400 });
    }

    // Verify user has access to this family
    const user = await queryOne<User>(
      'SELECT id FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const membership = await queryOne(
      'SELECT * FROM family_members WHERE family_id = $1 AND user_id = $2',
      [familyId, user.id]
    );

    if (!membership) {
      return NextResponse.json({ error: 'אין גישה לקבוצה זו' }, { status: 403 });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set('current_family', familyId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    return response;
  } catch (error) {
    console.error('Switch family error:', error);
    return NextResponse.json({ error: 'שגיאה במעבר קבוצה' }, { status: 500 });
  }
}

