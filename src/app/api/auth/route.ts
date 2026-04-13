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

      // Check if user's account is pending approval
      if (user.approvalStatus === 'pending') {
        return NextResponse.json({ error: 'Your account is pending admin approval. Please wait for approval before logging in.' }, { status: 403 });
      }
      if (user.approvalStatus === 'rejected') {
        return NextResponse.json({ error: 'Your account registration was rejected. Please contact support for assistance.' }, { status: 403 });
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

    // REGISTER
    if (action === 'register') {
      const { email, password, name, role, phone } = body;
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
      }
      if (!role || !['admin', 'driver', 'conductor', 'customer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role. Must be admin, driver, conductor, or customer' }, { status: 400 });
      }

      // Check if email already exists
      const existing = await db.profile.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }

      const hashedPassword = hashPassword(password);
      const user = await db.profile.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          phone: phone || '',
          approvalStatus: role === 'admin' ? 'pending' : (role === 'driver' || role === 'conductor') ? 'pending' : 'approved',
        },
      });

      // Create crew profile for driver/conductor
      if (role === 'driver' || role === 'conductor') {
        await db.crewProfile.create({
          data: {
            profileId: user.id,
            specialization: role,
            licenseNo: '',
            experienceYears: 0,
          },
        });
      }

      const { password: _, ...safeUser } = user;
      return NextResponse.json({ user: safeUser, message: 'Account created successfully' });
    }

    // GET PENDING USERS (admin)
    if (action === 'pendingUsers') {
      const { token } = body;
      const tokenData = activeTokens.get(token || '');
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const pendingUsers = await db.profile.findMany({
        where: { approvalStatus: 'pending' },
        orderBy: { createdAt: 'desc' },
      });

      const safeUsers = pendingUsers.map(({ password: _, ...u }) => u);
      return NextResponse.json({ users: safeUsers });
    }

    // APPROVE/REJECT USER (admin)
    if (action === 'approveUser') {
      const { token, userId, status } = body;
      const tokenData = activeTokens.get(token || '');
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 });
      }

      const updatedUser = await db.profile.update({
        where: { id: userId },
        data: { approvalStatus: status },
      });

      // Create crew profile when approving driver/conductor (if not exists)
      if (status === 'approved' && (updatedUser.role === 'driver' || updatedUser.role === 'conductor')) {
        const existingCrew = await db.crewProfile.findUnique({ where: { profileId: userId } });
        if (!existingCrew) {
          await db.crewProfile.create({
            data: {
              profileId: userId,
              specialization: updatedUser.role,
              licenseNo: '',
              experienceYears: 0,
            },
          });
        }
      }

      // Create welcome notification
      await db.notification.create({
        data: {
          userId,
          type: status === 'approved' ? 'success' : 'error',
          title: status === 'approved' ? 'Account Approved' : 'Account Rejected',
          message: status === 'approved'
            ? `Your ${updatedUser.role} account has been approved. You can now log in.`
            : `Your registration for a ${updatedUser.role} account has been rejected. Please contact support for more information.`,
        },
      });

      const { password: _, ...safeUser } = updatedUser;
      return NextResponse.json({ user: safeUser, message: `User ${status} successfully` });
    }

    // DELETE USER (admin)
    if (action === 'deleteUser') {
      const { token, userId } = body;
      const tokenData = activeTokens.get(token || '');
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await db.profile.delete({ where: { id: userId } });
      return NextResponse.json({ message: 'User deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
