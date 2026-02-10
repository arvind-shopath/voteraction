import { NextRequest, NextResponse } from 'next/server';
import { getFileStreamFromDrive } from '@/lib/cloudStorage';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // 1. Get file info from database
        const cloudFile = await prisma.cloudFile.findUnique({
            where: { id }
        });

        if (!cloudFile) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // 2. Check if file has expired
        if (new Date() > cloudFile.expiresAt) {
            return NextResponse.json({ error: 'File has expired' }, { status: 410 });
        }

        // 3. Stream file from Google Drive
        const fileStream = await getFileStreamFromDrive(cloudFile.externalId);

        // 4. Return the file stream with proper headers (white-labeled)
        const headers = new Headers();
        headers.set('Content-Type', cloudFile.mimeType);
        headers.set('Content-Disposition', `inline; filename="${cloudFile.fileName}"`);

        // Convert the stream to a Response
        return new NextResponse(fileStream as any, {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error('Cloud Download Error:', error);
        return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }
}
