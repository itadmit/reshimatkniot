import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/postgres';

interface User {
  id: number;
  phone: string;
  name: string;
}

interface FamilyMember {
  family_id: number;
  family_name: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'נדרש מספר טלפון' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/[\s-]/g, '');

    // Find user
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1',
      [normalizedPhone]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'מספר טלפון לא נמצא. האם להירשם?' },
        { status: 404 }
      );
    }

    // Get user's families
    const families = await query<FamilyMember>(
      `SELECT fm.family_id, f.name as family_name, fm.role 
       FROM family_members fm 
       JOIN families f ON f.id = fm.family_id 
       WHERE fm.user_id = $1`,
      [user.id]
    );

    // Use first family as default (or the one they own)
    const defaultFamily = families.find(f => f.role === 'owner') || families[0];

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name
      },
      families: families.map(f => ({
        id: f.family_id,
        name: f.family_name,
        role: f.role
      })),
      currentFamily: defaultFamily ? {
        id: defaultFamily.family_id,
        name: defaultFamily.family_name
      } : null
    });

    // Set auth cookie
    response.cookies.set('auth_phone', normalizedPhone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    if (defaultFamily) {
      response.cookies.set('current_family', defaultFamily.family_id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}

