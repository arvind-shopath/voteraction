import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        await prisma.voter.deleteMany({});
        return NextResponse.json({ success: true, message: 'All voters deleted' });
    } catch (e) {
        return NextResponse.json({ success: false, error: e });
    }
}
