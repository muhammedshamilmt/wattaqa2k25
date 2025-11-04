import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Protect team-admin routes
  if (pathname.startsWith('/team-admin')) {
    // Get the requested team from URL parameters
    const requestedTeam = searchParams.get('team');
    
    // Get user data from cookies or headers (in a real app, you'd validate JWT here)
    // For now, we'll let the client-side validation handle it, but log the attempt
    
    if (requestedTeam) {
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      console.log(`Team admin access attempt: ${pathname} with team=${requestedTeam} from IP: ${clientIP}`);
      
      // In production, you would:
      // 1. Validate JWT token from cookies/headers
      // 2. Extract user's actual team from token
      // 3. Compare with requested team
      // 4. Block if they don't match
      
      // For now, we'll add security headers and let client-side handle validation
      const response = NextResponse.next();
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Add custom header to indicate this is a protected route
      response.headers.set('X-Protected-Route', 'team-admin');
      response.headers.set('X-Requested-Team', requestedTeam);
      
      return response;
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    
    // Add security headers for admin routes
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Protected-Route', 'admin');
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/team-admin/:path*',
    '/admin/:path*'
  ]
};