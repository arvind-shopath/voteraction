import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readdir, unlink } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Database Cleanup with ID Reset (SQLite compatible)
        await prisma.voter.deleteMany({});
        await (prisma as any).importJob.deleteMany({});
        await (prisma as any).systemLog.deleteMany({});

        // Reset Auto Increment IDs in SQLite
        await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name IN ('Voter', 'ImportJob', 'SystemLog');`);

        // 2. File System Cleanup
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'pdf_queue');
        try {
            const files = await readdir(uploadDir);
            for (const file of files) {
                if (file !== '.gitkeep') {
                    await unlink(join(uploadDir, file));
                }
            }
        } catch (e) {
            console.log('Error cleaning directory:', e);
        }

        return NextResponse.json({
            success: true,
            message: "Success! All Data Deleted. IDs Reset to 1. File Queue Cleared."
        });

    } catch (error: any) {
        console.error('Reset failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
