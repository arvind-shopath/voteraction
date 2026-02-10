import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const assemblyId = parseInt(params.id);
        const assembly = await prisma.assembly.findUnique({
            where: { id: assemblyId }
        });

        if (!assembly) {
            return NextResponse.json({ error: 'Assembly not found' }, { status: 404 });
        }

        return NextResponse.json(assembly);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assembly' }, { status: 500 });
    }
}
