import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const voters = await (prisma as any).voter.count();
        const booths = await (prisma as any).booth.count();
        const jobs = await (prisma as any).importJob.count();
        const assemblies = await (prisma as any).assembly.findMany();

        return NextResponse.json({
            status: 'ok',
            voters,
            booths,
            jobs,
            assembliesCount: assemblies.length
        });
    } catch (err: any) {
        return new NextResponse(JSON.stringify({ error: err.message, stack: err.stack }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
