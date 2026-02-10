import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredFiles } from '@/lib/cleanupExpiredFiles';

/**
 * API endpoint to manually trigger cleanup or for cron jobs
 * Can be called daily via external services like:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - cron-job.org
 * - EasyCron
 */
export async function GET(request: NextRequest) {
    try {
        // Optional: Add authentication to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Run cleanup
        const result = await cleanupExpiredFiles();

        return NextResponse.json(result);

    } catch (error) {
        console.error('Cleanup API Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Cleanup failed'
        }, { status: 500 });
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request);
}
