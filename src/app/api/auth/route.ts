import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId: string): string {
  return crypto.randomBytes(32).toString('hex');
}

// Simple in-memory token store (for demo)
const activeTokens = new Map<string, { userId: string; role: string; expiresAt: number }>();

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of activeTokens) {
    if (data.expiresAt < now) activeTokens.delete(token);
  }
}, 60000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // LOGIN
    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      const hashedPassword = hashPassword(password);
      const user = await db.profile.findUnique({
        where: { email },
      });

      if (!user || user.password !== hashedPassword) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const token = generateToken(user.id);
      activeTokens.set(token, {
        userId: user.id,
        role: user.role,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      const { password: _, ...safeUser } = user;
      return NextResponse.json({ user: safeUser, token });
    }

    // VERIFY TOKEN
    if (action === 'verify') {
      const { token } = body;
      if (!token) {
        return NextResponse.json({ error: 'Token required' }, { status: 400 });
      }

      const tokenData = activeTokens.get(token);
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }

      const user = await db.profile.findUnique({
        where: { id: tokenData.userId },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const { password: _, ...safeUser } = user;
      return NextResponse.json({ user: safeUser });
    }

    // LOGOUT
    if (action === 'logout') {
      const { token } = body;
      if (token) activeTokens.delete(token);
      return NextResponse.json({ success: true });
    }

    // GET ALL USERS (admin)
    if (action === 'users') {
      const { token, role } = body;
      const tokenData = activeTokens.get(token || '');
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const where: Record<string, string> = {};
      if (role) where.role = role;

      const users = await db.profile.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { createdAt: 'desc' },
        take: 200,
      });

      const safeUsers = users.map(({ password: _, ...u }) => u);
      return NextResponse.json({ users: safeUsers });
    }

    // UPDATE PROFILE
    if (action === 'updateProfile') {
      const { token, userId, name, availability } = body;
      const tokenData = activeTokens.get(token || '');
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const updateData: Record<string, string> = {};
      if (name) updateData.name = name;

      const updatedUser = await db.profile.update({
        where: { id: userId || tokenData.userId },
        data: updateData,
      });

      if (availability) {
        await db.crewProfile.update({
          where: { profileId: userId || tokenData.userId },
          data: { availability },
        });
      }

      const { password: _, ...safeUser } = updatedUser;
      return NextResponse.json({ user: safeUser });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
