import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ filename: string }> }
) {
    const { filename } = await context.params;
    const filePath = path.join(process.cwd(), 'public/uploads', filename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse('File Not Found', { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const extension = path.extname(filePath).toLowerCase();

        let contentType = 'image/png';
        if (extension === '.jpg' || extension === '.jpeg') contentType = 'image/jpeg';
        else if (extension === '.svg') contentType = 'image/svg+xml';
        else if (extension === '.webp') contentType = 'image/webp';
        else if (extension === '.gif') contentType = 'image/gif';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        return new NextResponse('Error reading file', { status: 500 });
    }
}
