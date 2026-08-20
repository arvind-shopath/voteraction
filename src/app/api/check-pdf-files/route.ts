import { NextResponse } from 'next/server';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', '375');
    const sourceDir = 'C:\\Users\\creatiAV\\Documents\\voteraction\\gazipur';

    let uploadFiles: string[] = [];
    let sourceFiles: string[] = [];

    if (existsSync(uploadDir)) {
        uploadFiles = readdirSync(uploadDir);
    }
    if (existsSync(sourceDir)) {
        sourceFiles = readdirSync(sourceDir);
    }

    return NextResponse.json({
        uploadDir,
        uploadFilesCount: uploadFiles.length,
        uploadFiles,
        sourceDir,
        sourceFilesCount: sourceFiles.length,
        sourceFiles
    });
}
