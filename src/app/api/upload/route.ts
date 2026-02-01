import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Build a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = file.name.replace(/\s+/g, '-'); // Remove spaces
        const uniqueFilename = `${uniqueSuffix}-${filename}`;

        // Save to public/uploads directory
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        const path = join(uploadDir, uniqueFilename);

        await writeFile(path, buffer);
        console.log(`Saved to ${path}`);

        // Return the public URL
        const url = `/uploads/${uniqueFilename}`;

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
