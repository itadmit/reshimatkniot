import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/postgres';
import { cookies } from 'next/headers';

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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;
    const currentFamilyId = cookieStore.get('current_family')?.value;

    if (!authPhone) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Find user
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!user) {
      // Cookie exists but user doesn't - clear cookies
      const response = NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
      response.cookies.delete('auth_phone');
      response.cookies.delete('current_family');
      return response;
    }

    // Get user's families
    const families = await query<FamilyMember>(
      `SELECT fm.family_id, f.name as family_name, fm.role 
       FROM family_members fm 
       JOIN families f ON f.id = fm.family_id 
       WHERE fm.user_id = $1`,
      [user.id]
    );

    // Determine current family
    let currentFamily = families.find(f => f.family_id.toString() === currentFamilyId);
    if (!currentFamily) {
      currentFamily = families.find(f => f.role === 'owner') || families[0];
    }

    return NextResponse.json({
      authenticated: true,
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
      currentFamily: currentFamily ? {
        id: currentFamily.family_id,
        name: currentFamily.family_name
      } : null
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'שגיאה בבדיקת התחברות' },
      { status: 500 }
    );
  }
}

