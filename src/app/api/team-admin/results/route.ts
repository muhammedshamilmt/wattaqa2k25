import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Result } from '@/types';

// Simplified endpoint for team admin results access
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published'; // Default to published
    
    console.log('🔍 Fetching results with status:', status);
    
    const db = await getDatabase();
    const collection = db.collection<Result>('results');
    
    // Always return published results for team admin portal
    const results = await collection.find({
      status: 'published' as any
    }).toArray();
    
    console.log('✅ Found published results:', results.length);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ Error fetching results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}