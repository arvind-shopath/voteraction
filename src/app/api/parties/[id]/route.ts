import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const id = parseInt(params.id);
        const body = await request.json();

        const updatedParty = await prisma.party.update({
            where: { id },
            data: {
                name: body.name,
                color: body.color,
                logo: body.logo
            }
        });

        return NextResponse.json({ success: true, data: updatedParty });
    } catch (error) {
        console.error('Error updating party:', error);
        return NextResponse.json({ success: false, error: 'Failed to update party' }, { status: 500 });
    }
}
