import { NextRequest, NextResponse } from 'next/server';
import { uploadToDrive } from '@/lib/cloudStorage';
import { prisma } from '@/lib/prisma';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const candidateName = data.get('candidateName') as string || 'General_Uploads';

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert Buffer to Readable Stream for googleapis
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // 1. Prepare Folder Path (Candidate Name -> Date)
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        const folderPath = [candidateName, dateStr];

        // Add time prefix to file name to ensure uniqueness and sorting within the day
        const fileName = `${timeStr}_${file.name}`;

        // 2. Upload to Google Drive
        const googleDriveId = await uploadToDrive(stream, fileName, file.type, folderPath);

        if (!googleDriveId) {
            throw new Error('Failed to upload to Google Drive');
        }

        // 3. Save to Database with 7 days expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const cloudFile = await prisma.cloudFile.create({
            data: {
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                externalId: googleDriveId,
                expiresAt: expiresAt,
            }
        });

        // 3. Return White-labelled URL
        const proxiedUrl = `/api/cloud/download/${cloudFile.id}`;

        // Optionally update the record with the proxied URL
        await prisma.cloudFile.update({
            where: { id: cloudFile.id },
            data: { proxiedUrl }
        });

        return NextResponse.json({
            success: true,
            id: cloudFile.id,
            url: proxiedUrl,
            fileName: file.name,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Cloud Upload Error:', error);
        return NextResponse.json({ success: false, error: 'Cloud upload failed' }, { status: 500 });
    }
}
