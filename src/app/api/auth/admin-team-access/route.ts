import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, teamCode, teamName } = await request.json();

    if (!adminEmail || !teamCode || !teamName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admin email (you can customize this logic)
    const validAdminEmails = [
      'admin@wattaqa.com',
      'festival@wattaqa.com',
      'coordinator@wattaqa.com',
      // Add more admin emails as needed
    ];

    // For development, also allow emails ending with @admin.com
    const isValidAdmin = validAdminEmails.includes(adminEmail.toLowerCase()) || 
                        adminEmail.toLowerCase().endsWith('@admin.com');

    if (!isValidAdmin) {
      console.log(`Admin access denied for email: ${adminEmail}`);
      return NextResponse.json(
        { error: 'Invalid admin email. Access denied.' },
        { status: 403 }
      );
    }

    // Get team data from database
    const db = await getDatabase();
    const teamsCollection = db.collection('teams');
    const team = await teamsCollection.findOne({ code: teamCode });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Create temporary team captain user object for admin
    const tempUser = {
      id: `admin-${Date.now()}`,
      email: adminEmail,
      userType: 'team-captain',
      team: {
        code: teamCode,
        name: teamName
      },
      isAdminAccess: true,
      originalAdminEmail: adminEmail,
      accessGrantedAt: new Date().toISOString(),
      accessReason: 'Admin team portal access'
    };

    // Log admin access for audit
    console.log(`Admin access granted: ${adminEmail} accessing team ${teamCode} (${teamName}) at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      tempUser,
      message: `Admin access granted to ${teamName} team portal`
    });

  } catch (error) {
    console.error('Error in admin team access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}