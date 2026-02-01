import { NextResponse } from 'next/server';
import { processImportQueue } from '@/lib/queue-processor';

export const dynamic = 'force-dynamic';

export async function POST() {
    processImportQueue();
    return NextResponse.json({ message: 'Processor triggered' });
}
