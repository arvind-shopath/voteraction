'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient as any;

export async function getAssemblySettings(assemblyId: number) {
    try {
        const where = assemblyId ? { id: assemblyId } : {};
        const settings = await prisma.assembly.findFirst({
            where,
            select: {
                id: true,
                candidateName: true,
                candidateImageUrl: true,
                party: true,
                themeColor: true,
                logoUrl: true,
                facebookUrl: true,
                instagramUrl: true,
                twitterUrl: true,
                name: true,
                number: true,
                prevPartyVotes: true,
                prevCandidateVotes: true,
                historicalResults: true,
                casteEquation: true,
                // Campaign Info
                importantAreas: true,
                importantNewspapers: true,
                campaignTags: true,
                candidateBusiness: true,
                importantIssues: true,
                importantCastes: true
            }
        });
        return settings;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
}

export async function updateAssemblySettings(assemblyId: number, data: {
    candidateName?: string,
    candidateImageUrl?: string,
    party?: string,
    themeColor?: string,
    logoUrl?: string,
    facebookUrl?: string,
    instagramUrl?: string,
    twitterUrl?: string,
    prevPartyVotes?: number,
    prevCandidateVotes?: number,
    historicalResults?: string,
    casteEquation?: string,
    // Campaign Info
    importantAreas?: string,
    importantNewspapers?: string,
    campaignTags?: string,
    candidateBusiness?: string,
    importantIssues?: string,
    importantCastes?: string
}) {
    // If ID is provided, use it. Otherwise use first (fallback)
    let assemblyIdToUpdate = assemblyId;

    if (!assemblyIdToUpdate) {
        const assembly = await prisma.assembly.findFirst();
        if (!assembly) return;
        assemblyIdToUpdate = assembly.id;
    }

    // Sanitize numeric inputs
    const updateData: any = { ...data };
    if (data.prevPartyVotes !== undefined) updateData.prevPartyVotes = parseInt(data.prevPartyVotes.toString());
    if (data.prevCandidateVotes !== undefined) updateData.prevCandidateVotes = parseInt(data.prevCandidateVotes.toString());

    await prisma.assembly.update({
        where: { id: assemblyIdToUpdate },
        data: updateData
    });

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/');
}
