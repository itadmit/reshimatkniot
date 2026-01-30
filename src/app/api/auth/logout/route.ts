import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete('auth_phone');
  response.cookies.delete('current_family');
  
  return response;
}

