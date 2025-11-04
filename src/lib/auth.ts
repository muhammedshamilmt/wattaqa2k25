import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  userType: 'admin' | 'team-captain';
  team?: {
    code: string;
    name: string;
  };
  email?: string;
}

export interface AuthResult {
  isAuthenticated: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Verify JWT token and extract user information
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    
    return {
      id: decoded.id,
      userType: decoded.userType,
      team: decoded.team,
      email: decoded.email
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract and verify authentication from request headers
 */
export function authenticateRequest(request: NextRequest): AuthResult {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false, error: 'No valid authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = verifyToken(token);
    
    if (!user) {
      return { isAuthenticated: false, error: 'Invalid token' };
    }

    return { isAuthenticated: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { isAuthenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Check if user has admin privileges
 */
export function requireAdmin(authResult: AuthResult): boolean {
  return authResult.isAuthenticated && authResult.user?.userType === 'admin';
}

/**
 * Check if user has team captain privileges for specific team
 */
export function requireTeamCaptain(authResult: AuthResult, teamCode?: string): boolean {
  if (!authResult.isAuthenticated || authResult.user?.userType !== 'team-captain') {
    return false;
  }
  
  // If teamCode is specified, verify user belongs to that team
  if (teamCode && authResult.user.team?.code !== teamCode) {
    return false;
  }
  
  return true;
}

/**
 * Middleware to protect API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>,
  options: {
    requireAdmin?: boolean;
    requireTeamCaptain?: boolean;
    allowedTeam?: string;
  } = {}
) {
  return async (request: NextRequest) => {
    const authResult = authenticateRequest(request);
    
    if (!authResult.isAuthenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = authResult.user!;

    // Check admin requirement
    if (options.requireAdmin && user.userType !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check team captain requirement
    if (options.requireTeamCaptain && user.userType !== 'team-captain') {
      return new Response(
        JSON.stringify({ error: 'Team captain access required' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check team access
    if (options.allowedTeam && user.team?.code !== options.allowedTeam) {
      return new Response(
        JSON.stringify({ error: 'Access denied for this team' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, user);
  };
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.sign(user, secret, { expiresIn: '24h' });
}