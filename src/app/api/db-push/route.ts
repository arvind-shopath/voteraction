import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const { stdout, stderr } = await execAsync('npx prisma generate', {
            cwd: process.cwd()
        });

        return NextResponse.json({
            ts: Date.now(),
            success: true,
            stdout,
            stderr
        });
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            error: String(e?.stack || e?.message || e)
        }, { status: 500 });
    }
}
