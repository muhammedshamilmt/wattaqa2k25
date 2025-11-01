import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Result, ResultStatus } from '@/types';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ResultStatus;
    
    if (!status || !Object.values(ResultStatus).includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<Result>('results');
    
    const results = await collection.find({ status }).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results by status:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { resultIds, status } = body;
    
    if (!resultIds || !Array.isArray(resultIds) || !status) {
      return NextResponse.json({ error: 'Result IDs array and status are required' }, { status: 400 });
    }

    if (!Object.values(ResultStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<Result>('results');
    
    const objectIds = resultIds.map(id => new ObjectId(id));
    
    const result = await collection.updateMany(
      { _id: { $in: objectIds } },
      { 
        $set: { 
          status,
          updatedAt: new Date() 
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      message: `Updated ${result.modifiedCount} results to ${status}` 
    });
  } catch (error) {
    console.error('Error updating result statuses:', error);
    return NextResponse.json({ error: 'Failed to update result statuses' }, { status: 500 });
  }
}