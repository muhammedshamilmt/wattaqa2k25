import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Team } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { 
          hasAccess: false, 
          message: 'Email is required' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Finding team access for email:', email);

    const db = await getDatabase();
    const teamsCollection = db.collection<Team>('teams');

    const normalizedEmail = email.toLowerCase().trim();

    // First, check if it's an admin email
    const validAdminEmails = [
      'admin@wattaqa.com',
      'festival@wattaqa.com',
      'coordinator@wattaqa.com'
    ];

    const isAdminEmail = validAdminEmails.includes(normalizedEmail) || 
                        normalizedEmail.endsWith('@admin.com');

    if (isAdminEmail) {
      // Admin can access any team, return the first available team
      const firstTeam = await teamsCollection.findOne({});
      
      if (firstTeam) {
        console.log('✅ Admin access granted - redirecting to first team:', firstTeam.code);
        return NextResponse.json({
          hasAccess: true,
          teamCode: firstTeam.code,
          teamName: firstTeam.name,
          role: 'admin',
          message: 'Admin access granted'
        });
      }
    }

    // Find team where user's email matches captainEmail
    const team = await teamsCollection.findOne({ 
      captainEmail: normalizedEmail 
    });

    if (team) {
      console.log('✅ Team captain access found:', {
        email: normalizedEmail,
        teamCode: team.code,
        teamName: team.name
      });

      return NextResponse.json({
        hasAccess: true,
        teamCode: team.code,
        teamName: team.name,
        role: 'captain',
        message: `Access granted as captain of ${team.name}`
      });
    }

    // No team access found
    console.log('🚫 No team access found for email:', normalizedEmail);
    
    // Get all teams with captain emails for debugging
    const teamsWithEmails = await teamsCollection.find(
      { captainEmail: { $exists: true } },
      { projection: { code: 1, name: 1, captainEmail: 1 } }
    ).toArray();

    console.log('📋 Teams with captain emails:', teamsWithEmails.map(t => ({
      code: t.code,
      name: t.name,
      captainEmail: t.captainEmail
    })));

    return NextResponse.json({
      hasAccess: false,
      message: `No team access found for ${email}. Please contact an administrator to add your email to a team.`,
      availableTeams: teamsWithEmails.map(t => ({
        code: t.code,
        name: t.name,
        hasEmail: !!t.captainEmail
      }))
    });

  } catch (error) {
    console.error('❌ Error finding user team:', error);
    return NextResponse.json(
      { 
        hasAccess: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}