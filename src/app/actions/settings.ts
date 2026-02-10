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
                electionDate: true,
                // Campaign Info
                importantAreas: true,
                importantNewspapers: true,
                campaignTags: true,
                candidateBusiness: true,
                importantIssues: true,
                importantCastes: true,
                users: {
                    where: { role: 'CANDIDATE', status: 'Active' },
                    select: {
                        id: true,
                        facebookUrl: true,
                        instagramUrl: true,
                        twitterUrl: true
                    },
                    take: 1
                }
            }
        });

        if (settings && settings.users?.[0]) {
            const user = settings.users[0];
            return {
                ...settings,
                facebookUrl: user.facebookUrl || settings.facebookUrl,
                instagramUrl: user.instagramUrl || settings.instagramUrl,
                twitterUrl: user.twitterUrl || settings.twitterUrl,
                candidateUserId: user.id
            };
        }

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
    electionDate?: string | Date,
    // Campaign Info
    importantAreas?: string,
    importantNewspapers?: string,
    campaignTags?: string,
    candidateBusiness?: string,
    importantIssues?: string,
    importantCastes?: string,
    candidateUserId?: number | string
}) {
    // If ID is provided, use it. Otherwise use first (fallback)
    let assemblyIdToUpdate = assemblyId;
    const candidateUserId = data.candidateUserId ? parseInt(data.candidateUserId.toString()) : null;

    if (!assemblyIdToUpdate) {
        const assembly = await prisma.assembly.findFirst();
        if (!assembly) return;
        assemblyIdToUpdate = assembly.id;
    }

    const {
        facebookUrl, instagramUrl, twitterUrl,
        ...assemblyData
    } = data;

    // Sanitize numeric inputs for assembly
    const updateData: any = { ...assemblyData };
    if (assemblyData.prevPartyVotes !== undefined) updateData.prevPartyVotes = parseInt(assemblyData.prevPartyVotes.toString());
    if (assemblyData.prevCandidateVotes !== undefined) updateData.prevCandidateVotes = parseInt(assemblyData.prevCandidateVotes.toString());

    // Update Assembly
    await prisma.assembly.update({
        where: { id: assemblyIdToUpdate },
        data: updateData
    });

    // Update the Manager(s) of this assembly with social info
    // This ensures individual candidate profiles are updated
    if (facebookUrl !== undefined || instagramUrl !== undefined || twitterUrl !== undefined) {
        if (candidateUserId) {
            await prisma.user.update({
                where: { id: candidateUserId },
                data: {
                    facebookUrl,
                    instagramUrl,
                    twitterUrl
                }
            });
        } else {
            // Fallback for bulk if no specific user ID is known
            await prisma.user.updateMany({
                where: {
                    assemblyId: assemblyIdToUpdate,
                    role: 'CANDIDATE'
                },
                data: {
                    facebookUrl,
                    instagramUrl,
                    twitterUrl
                }
            });
        }
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/');
}
