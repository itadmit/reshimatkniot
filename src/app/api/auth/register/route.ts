import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/postgres';

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

interface FamilyMember {
  family_id: number;
  family_name: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json();

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'נדרש מספר טלפון ושם' },
        { status: 400 }
      );
    }

    // Normalize phone number (remove spaces, dashes)
    const normalizedPhone = phone.replace(/[\s-]/g, '');

    // Check if user already exists (might have been invited to a family)
    let existingUser = await queryOne<User>(
      'SELECT * FROM users WHERE phone = $1',
      [normalizedPhone]
    );

    if (existingUser) {
      // User exists (was invited) - update their name and log them in
      await query(
        'UPDATE users SET name = $1 WHERE id = $2',
        [name, existingUser.id]
      );
      existingUser.name = name;

      // Get their families (they were invited to)
      const families = await query<FamilyMember>(
        `SELECT fm.family_id, f.name as family_name, fm.role 
         FROM family_members fm 
         JOIN families f ON f.id = fm.family_id 
         WHERE fm.user_id = $1`,
        [existingUser.id]
      );

      // Pick the first family they belong to
      const currentFamily = families[0];

      const response = NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          phone: existingUser.phone,
          name: existingUser.name
        },
        family: currentFamily ? {
          id: currentFamily.family_id,
          name: currentFamily.family_name
        } : null,
        families: families.map(f => ({
          id: f.family_id,
          name: f.family_name,
          role: f.role
        })),
        wasInvited: true
      });

      // Set auth cookie
      response.cookies.set('auth_phone', normalizedPhone, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365
      });

      if (currentFamily) {
        response.cookies.set('current_family', currentFamily.family_id.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365
        });
      }

      return response;
    }

    // New user - create user and their own family
    const [newUser] = await query<User>(
      'INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING *',
      [normalizedPhone, name]
    );

    // Create default family for the user
    const [newFamily] = await query<Family>(
      'INSERT INTO families (name, owner_id) VALUES ($1, $2) RETURNING *',
      [`המשפחה של ${name}`, newUser.id]
    );

    // Add user as owner of the family
    await query(
      'INSERT INTO family_members (family_id, user_id, role) VALUES ($1, $2, $3)',
      [newFamily.id, newUser.id, 'owner']
    );

    // Create default settings for family
    await query(
      'INSERT INTO family_settings (family_id, dark_mode) VALUES ($1, $2)',
      [newFamily.id, false]
    );

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name
      },
      family: {
        id: newFamily.id,
        name: newFamily.name
      },
      wasInvited: false
    });

    // Set auth cookie (phone as token for simplicity)
    response.cookies.set('auth_phone', normalizedPhone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });

    response.cookies.set('current_family', newFamily.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}

