import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Result, ResultStatus } from '@/types';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;
    
    if (!status || !Object.values(ResultStatus).includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<Result>('results');
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (notes !== undefined) {
      updateData.reviewNotes = notes;
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Result status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating result status:', error);
    return NextResponse.json({ error: 'Failed to update result status' }, { status: 500 });
  }
}