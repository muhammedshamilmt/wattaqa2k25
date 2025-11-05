import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get teams from database
    const teams = await db.collection('teams').find({}).toArray();
    
    // If no teams in database, return default teams
    if (!teams || teams.length === 0) {
      const defaultTeams = [
        {
          _id: 'sumud',
          code: 'SMD',
          name: 'SUMUD',
          fullName: 'Team Sumud',
          color: '#22C55E', // Green
          description: 'Arts & Sports Excellence',
          captain: 'Hafiz M.Musthafa',
          captainEmail: '',
          students: 45,
          specialties: ['Visual Arts', 'Calligraphy', 'Poetry', 'Cricket'],
          motto: 'Excellence through perseverance',
          stats: {
            competitions: 8,
            events: 15,
            participation: 100,
            artsPreparation: 95,
            sportsTraining: 90,
            teamCoordination: 98
          }
        },
        {
          _id: 'aqsa',
          code: 'AQS',
          name: 'AQSA',
          fullName: 'Team Aqsa',
          color: '#374151', // Gray
          description: 'Creative & Athletic Champions',
          captain: 'Hafiz M.Hafiz',
          captainEmail: '',
          students: 45,
          specialties: ['Burdha', 'Football', 'Qawali', 'Art Exhibition'],
          motto: 'Unity in diversity',
          stats: {
            competitions: 8,
            events: 15,
            participation: 100,
            artsPreparation: 95,
            sportsTraining: 90,
            teamCoordination: 98
          }
        },
        {
          _id: 'inthifada',
          code: 'INT',
          name: 'INTIFADA',
          fullName: 'Team Inthifada',
          color: '#EF4444', // Red
          description: 'Innovation & Competition',
          captain: 'Hafiz M.Mufeed',
          captainEmail: '',
          students: 45,
          specialties: ['Athletics', 'Innovation', 'Performance', 'Leadership'],
          motto: 'Rise through innovation',
          stats: {
            competitions: 8,
            events: 15,
            participation: 100,
            artsPreparation: 95,
            sportsTraining: 90,
            teamCoordination: 98
          }
        }
      ];
      
      return NextResponse.json(defaultTeams);
    }
    
    // Transform database teams to include additional properties
    const transformedTeams = teams.map(team => {
      // Determine colors based on team name
      let color = '#6366f1'; // Default blue
      let specialties = ['Arts', 'Sports', 'Competition', 'Excellence'];
      let motto = 'Striving for excellence';
      
      if (team.name?.toLowerCase().includes('sumud')) {
        color = '#22C55E'; // Green
        specialties = ['Visual Arts', 'Calligraphy', 'Poetry', 'Cricket'];
        motto = 'Excellence through perseverance';
      } else if (team.name?.toLowerCase().includes('aqsa')) {
        color = '#374151'; // Gray
        specialties = ['Burdha', 'Football', 'Qawali', 'Art Exhibition'];
        motto = 'Unity in diversity';
      } else if (team.name?.toLowerCase().includes('inthifada') || team.name?.toLowerCase().includes('intifada')) {
        color = '#EF4444'; // Red
        specialties = ['Athletics', 'Innovation', 'Performance', 'Leadership'];
        motto = 'Rise through innovation';
      }
      
      return {
        _id: team._id,
        code: team.code || team.name?.substring(0, 3).toUpperCase(),
        name: team.name,
        fullName: `Team ${team.name}`,
        color: team.color || color,
        description: team.description || 'Excellence in Arts & Sports',
        captain: team.captain || 'To be assigned',
        captainEmail: team.captainEmail || '',
        students: team.students || 45,
        specialties: team.specialties || specialties,
        motto: team.motto || motto,
        stats: team.stats || {
          competitions: 8,
          events: 15,
          participation: 100,
          artsPreparation: 95,
          sportsTraining: 90,
          teamCoordination: 98
        }
      };
    });
    
    return NextResponse.json(transformedTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}