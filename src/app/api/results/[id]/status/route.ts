import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Result, ResultStatus } from '@/types';
import { ObjectId } from 'mongodb';
import { syncResultToSheets } from '@/lib/googleSheets';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    // Sync to Google Sheets only when result is published
    if (status === ResultStatus.PUBLISHED) {
      try {
        const updatedResult = await collection.findOne({ _id: new ObjectId(id) });
        if (updatedResult) {
          await syncResultToSheets(updatedResult);
          console.log(`Result ${id} synced to Google Sheets after publishing`);
        }
      } catch (syncError) {
        console.error('Error syncing published result to sheets:', syncError);
        // Don't fail the main operation if sync fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Result status updated to ${status}${status === ResultStatus.PUBLISHED && syncResultToSheets ? ' and synced to Google Sheets' : ''}` 
    });
  } catch (error) {
    console.error('Error updating result status:', error);
    return NextResponse.json({ error: 'Failed to update result status' }, { status: 500 });
  }
}