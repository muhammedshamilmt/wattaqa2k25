import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Candidate } from '@/types';

// Simplified endpoint for team admin candidates access
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTeam = searchParams.get('team');
    
    if (!requestedTeam) {
      return NextResponse.json({ error: 'Team parameter is required' }, { status: 400 });
    }
    
    console.log('🔍 Fetching candidates for team:', requestedTeam);
    
    const db = await getDatabase();
    const collection = db.collection<Candidate>('candidates');
    
    const candidates = await collection.find({
      team: requestedTeam,
      name: { $exists: true, $ne: '' },
      chestNumber: { $exists: true, $ne: '' },
      section: { $exists: true, $in: ['senior', 'junior', 'sub-junior'] }
    }).toArray();
    
    console.log('✅ Found candidates:', candidates.length);
    
    return NextResponse.json(candidates);
    
  } catch (error) {
    console.error('❌ Error fetching team candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}