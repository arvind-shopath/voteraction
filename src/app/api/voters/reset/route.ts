import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const assemblyId = parseInt(searchParams.get('assemblyId') || '');

        if (!assemblyId) {
            return NextResponse.json({ error: 'Assembly ID is required' }, { status: 400 });
        }

        // Delete Voters for this assembly only
        await prisma.voter.deleteMany({
            where: { assemblyId }
        });

        // Reset Import Jobs for this assembly only
        await (prisma as any).importJob.deleteMany({
            where: { assemblyId }
        });

        return NextResponse.json({
            success: true,
            message: `All voters and import jobs for Assembly ID ${assemblyId} have been successfully deleted.`
        });
    } catch (error: any) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: error.message || 'Reset failed' }, { status: 500 });
    }
}
