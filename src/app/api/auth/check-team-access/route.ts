import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Team } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { email, teamCode } = await request.json();

    if (!email || !teamCode) {
      return NextResponse.json(
        { 
          hasAccess: false, 
          message: 'Email and team code are required' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Checking team access for:', email, 'team:', teamCode);

    const db = await getDatabase();
    const teamsCollection = db.collection<Team>('teams');

    // Find the team by code
    const team = await teamsCollection.findOne({ code: teamCode });

    if (!team) {
      console.log('❌ Team not found:', teamCode);
      return NextResponse.json({
        hasAccess: false,
        message: 'Team not found'
      });
    }

    // Check if the email matches the team captain email
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCaptainEmail = team.captainEmail?.toLowerCase().trim();

    console.log('📧 Email comparison:', {
      userEmail: normalizedEmail,
      captainEmail: normalizedCaptainEmail,
      teamCode: team.code,
      teamName: team.name
    });

    if (normalizedCaptainEmail && normalizedEmail === normalizedCaptainEmail) {
      console.log('✅ Team access granted - Captain email match');
      return NextResponse.json({
        hasAccess: true,
        teamCode: team.code,
        teamName: team.name,
        role: 'captain',
        message: 'Access granted as team captain'
      });
    }

    // Check if it's a valid admin email (for admin access)
    const validAdminEmails = [
      'admin@wattaqa.com',
      'festival@wattaqa.com',
      'coordinator@wattaqa.com'
    ];

    const isAdminEmail = validAdminEmails.includes(normalizedEmail) || 
                        normalizedEmail.endsWith('@admin.com');

    if (isAdminEmail) {
      console.log('✅ Team access granted - Admin email');
      return NextResponse.json({
        hasAccess: true,
        teamCode: team.code,
        teamName: team.name,
        role: 'admin',
        message: 'Access granted as admin'
      });
    }

    // Access denied
    console.log('🚫 Team access denied - Email not authorized');
    return NextResponse.json({
      hasAccess: false,
      message: `Access denied. Your email (${email}) is not authorized for team ${team.name} (${teamCode}). Please contact an administrator.`,
      teamName: team.name,
      captainEmail: team.captainEmail ? 'Set' : 'Not set'
    });

  } catch (error) {
    console.error('❌ Error checking team access:', error);
    return NextResponse.json(
      { 
        hasAccess: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}