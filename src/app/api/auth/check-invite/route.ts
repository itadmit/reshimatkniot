import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/postgres';

interface User {
  id: number;
  phone: string;
  name: string;
}

// POST - Check if phone has pending invitations (is member of any family)
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'מספר טלפון נדרש' }, { status: 400 });
    }

    // Check if user exists
    const user = await queryOne<User>(
      'SELECT id, phone, name FROM users WHERE phone = $1',
      [phone]
    );

    if (!user) {
      // User doesn't exist at all
      return NextResponse.json({ 
        hasInvite: false, 
        error: 'לא נמצאו הזמנות עבור מספר זה' 
      });
    }

    // Check if user is member of any family
    const families = await query(
      `SELECT f.id, f.name, fm.role
       FROM families f
       JOIN family_members fm ON f.id = fm.family_id
       WHERE fm.user_id = $1`,
      [user.id]
    );

    if (families.length === 0) {
      // User exists but not member of any family
      return NextResponse.json({ 
        hasInvite: false, 
        error: 'לא נמצאו הזמנות עבור מספר זה' 
      });
    }

    // User has families - they have an invite!
    return NextResponse.json({ 
      hasInvite: true,
      familyCount: families.length,
      userName: user.name
    });

  } catch (error) {
    console.error('Check invite error:', error);
    return NextResponse.json({ error: 'שגיאה בבדיקה' }, { status: 500 });
  }
}

