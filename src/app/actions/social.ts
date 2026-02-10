'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

const prisma = prismaClient as any;

export async function getSocialPosts(assemblyId: number) {
    // 1. Existing Social Posts
    const existing = await prisma.socialPost.findMany({
        where: { assemblyId },
        orderBy: { createdAt: 'desc' }
    });

    // 2. Published Candidate Requests (Mapped to look like SocialPosts)
    const publishedRequests = await prisma.candidatePostRequest.findMany({
        where: {
            assemblyId,
            status: 'PUBLISHED'
        },
        orderBy: { createdAt: 'desc' }
    });

    const mapped = publishedRequests.map((req: any) => {
        let displayUrl = null;
        if (req.photoUrls) {
            try {
                const parsed = JSON.parse(req.photoUrls);
                if (Array.isArray(parsed) && parsed.length > 0) displayUrl = parsed[0];
                else displayUrl = req.photoUrls;
            } catch {
                displayUrl = req.photoUrls;
            }
        }

        return {
            id: req.id,
            content: req.description || req.subject,
            mediaUrls: displayUrl,
            status: 'Posted',
            postType: req.postType || 'Post',
            platform: 'All',
            createdAt: req.publishedAt || req.createdAt,
            assemblyId: req.assemblyId,
            liveLink: req.facebookUrl || req.twitterUrl || req.instagramUrl || req.whatsappUrl,
            source: 'REQUEST'
        };
    });

    // Merge and Sort
    const all = [...existing, ...mapped].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all;
}

export async function getLinkPreview(url: string) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            },
            next: { revalidate: 3600 }
        });
        const html = await res.text();

        const getMeta = (prop: string) => {
            const match = html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`));
            return match ? match[1] : null;
        };

        return {
            title: getMeta('og:title') || html.match(/<title>([^<]*)<\/title>/)?.[1] || '',
            image: getMeta('og:image') || '',
            description: getMeta('og:description') || ''
        };
    } catch (e) {
        console.error('Link preview error:', e);
        return { title: '', image: '', description: '' };
    }
}

export async function createSocialPost(data: {
    content: string,
    imageUrl?: string,
    mediaUrls?: string,
    videoUrl?: string,
    eventName?: string,
    location?: string,
    importantPeople?: string,
    platform?: string,
    status?: string,
    postType?: string,
    assemblyId: number,
    createdBy?: string
}) {
    await prisma.socialPost.create({ data });
    revalidatePath('/social');
}

export async function updateSocialPost(id: number, data: {
    content?: string,
    imageUrl?: string,
    mediaUrls?: string,
    videoUrl?: string,
    eventName?: string,
    location?: string,
    importantPeople?: string,
    status?: string,
    platform?: string,
    postType?: string,
    liveLink?: string
}) {
    await prisma.socialPost.update({
        where: { id },
        data: {
            ...data,
            publishedAt: data.status === 'Posted' ? new Date() : undefined
        }
    });
    revalidatePath('/social');
}

export async function deleteSocialPost(id: number) {
    await prisma.socialPost.delete({ where: { id } });
    revalidatePath('/social');
}

export async function getAssemblySocialLinks(assemblyId: number) {
    return await prisma.assembly.findUnique({
        where: { id: assemblyId },
        select: {
            facebookUrl: true,
            instagramUrl: true,
            twitterUrl: true,
            candidateName: true
        }
    });
}

export async function getSocialEngagementStats(assemblyId: number) {
    const workers = await prisma.worker.findMany({
        where: { assemblyId },
        select: {
            id: true,
            name: true,
            type: true,
            socialTasks: {
                where: {
                    taskType: 'MATERIAL_SHARE'
                },
                select: {
                    liked: true,
                    shared: true,
                    commented: true
                }
            }
        }
    });

    const stats = workers.map((w: any) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        shareCount: (w.socialTasks || []).filter((t: any) => t.shared).length,
        likeCount: (w.socialTasks || []).filter((t: any) => t.liked).length,
        commentCount: (w.socialTasks || []).filter((t: any) => t.commented).length
    })).sort((a: any, b: any) => (b.shareCount + b.likeCount + b.commentCount) - (a.shareCount + a.likeCount + a.commentCount));

    return {
        workers: stats,
        totalShares: stats.reduce((acc: number, curr: any) => acc + curr.shareCount, 0),
        activeWorkers: stats.filter((w: any) => (w.shareCount + w.likeCount + w.commentCount) > 0).length
    };
}

export async function markPostAsSharedTask(postId: number, userId: number, assemblyId: number) {
    const worker = await prisma.worker.findUnique({
        where: { userId }
    });

    if (!worker) return { success: false, error: 'Worker not found' };

    const post = await prisma.socialPost.findUnique({
        where: { id: postId }
    });

    // Create a completed task for this worker
    await prisma.task.create({
        data: {
            title: `Shared Post: ${post?.eventName || 'Campaign Update'}`,
            description: `Shared media/post from campaign dashboard.`,
            status: 'Completed',
            workerId: worker.id,
            assemblyId,
            completedAt: new Date()
        }
    });

    // Add Points
    const { addWorkerPoints } = await import('./worker');
    await addWorkerPoints(worker.id, 'SOCIAL_SHARE', 20, `Shared Social Post: ${post?.id}`, true);

    return { success: true };
}

// ==================== NEW: CANDIDATE POST REQUEST WORKFLOW ====================

export async function createCandidatePostRequest(data: {
    subject: string,
    location: string,
    importantPeople?: string,  // JSON array
    description?: string,
    photoUrls?: string,        // JSON array
    videoUrls?: string,        // JSON array
    platform?: string,
    postType?: string,         // NEW: Post Type
    assemblyId: number,
    createdBy: any
}) {
    const { subject, location, importantPeople, description, photoUrls, videoUrls, platform, postType, assemblyId, createdBy } = data;
    const postRequest = await prisma.candidatePostRequest.create({
        data: {
            subject,
            location,
            importantPeople,
            description,
            photoUrls,
            videoUrls,
            platform,
            postType: postType || 'Post',
            assemblyId: typeof assemblyId === 'string' ? parseInt(assemblyId) : assemblyId,
            createdBy: typeof createdBy === 'string' ? parseInt(createdBy) : createdBy,
            status: 'PENDING' // Default status
        }
    });

    // Notify SOCIAL_MEDIA team of this assembly
    await createNotification({
        title: "नयी पोस्ट रिक्वेस्ट",
        message: `${subject}: ${location} से कैंडिडेट द्वारा नयी पोस्ट रिक्वेस्ट मिली है।`,
        type: "REQUEST",
        assemblyId: typeof assemblyId === 'string' ? parseInt(assemblyId) : assemblyId

    });

    revalidatePath('/social');
    revalidatePath('/social-sena');
    return postRequest;
}

export async function getCandidatePostRequests(id: number, status?: string, isManagerId: boolean = false) {
    return await prisma.candidatePostRequest.findMany({
        where: {
            ...(isManagerId ? { createdBy: id } : { assemblyId: id }),
            ...(status ? { status } : {})
        },
        include: {
            creator: {
                select: {
                    name: true,
                    email: true,
                    role: true
                }
            },
            acceptor: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function acceptCandidatePostRequest(requestId: number, acceptedBy: number) {
    const updated = await prisma.candidatePostRequest.update({
        where: { id: requestId },
        data: {
            status: 'ACCEPTED',
            acceptedBy,
            acceptedAt: new Date()
        }
    });

    revalidatePath('/social');
    revalidatePath('/social');
    return updated;
}

export async function rejectCandidatePostRequest(requestId: number, rejectedBy: number) {
    const updated = await prisma.candidatePostRequest.update({
        where: { id: requestId },
        data: {
            status: 'REJECTED',
            acceptedBy: rejectedBy, // Reusing field or add rejectedBy
            acceptedAt: new Date()
        }
    });

    revalidatePath('/social');
    return updated;
}

export async function publishCandidatePost(requestId: number, urls: {
    facebookUrl?: string,
    twitterUrl?: string,
    instagramUrl?: string,
    whatsappUrl?: string
}) {
    // 1. Mark as published
    const updated = await prisma.candidatePostRequest.update({
        where: { id: requestId },
        data: {
            ...urls,
            status: 'PUBLISHED',
            publishedAt: new Date()
        }
    });

    // 2. Auto-create WorkerSocialTask for all active workers
    const activeWorkers = await prisma.worker.findMany({
        where: {
            assemblyId: updated.assemblyId,
            deletedAt: null // Only active workers
        },
        select: { id: true }
    });

    if (activeWorkers.length > 0) {
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        const taskData = activeWorkers.map((w: any) => ({
            workerId: w.id,
            assemblyId: updated.assemblyId,
            postRequestId: requestId,
            taskType: 'POST_ENGAGEMENT',
            status: 'PENDING',
            dueDate: dueDate,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await prisma.workerSocialTask.createMany({
            data: taskData
        });
    }

    revalidatePath('/social');
    return updated;
}

// ==================== SOCIAL MEDIA APPROVAL WORKFLOW ====================

export async function createSocialMediaApproval(data: {
    title: string,
    contentType: string,
    mediaUrls: string,  // JSON array
    notes?: string,
    assemblyId: number,
    createdBy: number
}) {
    const approval = await prisma.socialMediaApproval.create({
        data: {
            ...data,
            status: 'PENDING'
        }
    });

    // Notify the Candidate (MANAGER) of this assembly
    const manager = await prisma.user.findFirst({
        where: { assemblyId: data.assemblyId, role: 'CANDIDATE' }
    });

    if (manager) {
        await createNotification({
            title: "अप्रूवल की आवश्यकता",
            message: `नया कंटेंट "${data.title}" आपके अप्रूवल के लिए भेजा गया है।`,
            type: "APPROVAL",
            userId: manager.id
        });
    }

    revalidatePath('/social');
    return approval;
}

export async function approveSocialMediaContent(approvalId: number, approvedBy: number) {
    const updated = await prisma.socialMediaApproval.update({
        where: { id: approvalId },
        data: {
            status: 'APPROVED',
            approvedBy,
            approvedAt: new Date()
        }
    });

    revalidatePath('/social');

    // Notify the Creator (SOCIAL_MEDIA) that content was approved
    await createNotification({
        title: "कंटेंट स्वीकृत (Approved)",
        message: `आपका कंटेंट "${updated.title}" कैंडिडेट द्वारा अप्रूव कर दिया गया है।`,
        type: "INFO",
        userId: updated.createdBy
    });

    return updated;
}

export async function rejectSocialMediaContent(approvalId: number, approvedBy: number, reason: string) {
    const updated = await prisma.socialMediaApproval.update({
        where: { id: approvalId },
        data: {
            status: 'REJECTED',
            approvedBy,
            approvedAt: new Date(),
            rejectionReason: reason
        }
    });

    revalidatePath('/social');

    // Notify the Creator (SOCIAL_MEDIA) that content was rejected
    await createNotification({
        title: "कंटेंट अस्वीकृत (Rejected)",
        message: `आपका कंटेंट "${updated.title}" कैंडिडेट द्वारा रिजेक्ट कर दिया गया है। कारण: ${reason}`,
        type: "ALERT",
        userId: updated.createdBy
    });

    return updated;
}

export async function getSocialMediaApprovals(id: number, isManagerId: boolean = false) {
    return await prisma.socialMediaApproval.findMany({
        where: isManagerId ? {
            createdBy: id // Or filter by candidate the approval is for
        } : { assemblyId: id },
        include: {
            creator: {
                select: { name: true, role: true }
            },
            approver: {
                select: { name: true, role: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

// ==================== CAMPAIGN MATERIAL ====================

export async function createCampaignMaterial(data: {
    title: string,
    description?: string,
    materialType: string,
    fileUrls: string,  // JSON array
    platform?: string,
    expiresAt?: Date,
    assemblyId: number,
    createdBy: number
}) {
    const material = await prisma.campaignMaterial.create({ data });

    // TODO: Auto-create WorkerSocialTask for all workers (MATERIAL_SHARE)

    revalidatePath('/social');
    return material;
}

export async function getCampaignMaterials(id: number, isManagerId: boolean = false) {
    return await prisma.campaignMaterial.findMany({
        where: isManagerId ? { createdBy: id } : { assemblyId: id },
        include: {
            creator: {
                select: {
                    name: true,
                    role: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}


// ==================== WORKER TASK ACTIONS ====================

export async function getMySocialTasks(userId: number) {
    const worker = await prisma.worker.findUnique({
        where: { userId }
    });

    if (!worker) return [];

    return await prisma.workerSocialTask.findMany({
        where: { workerId: worker.id },
        include: {
            postRequest: true,
            campaignMaterial: true,
            proofs: true
        },
        orderBy: [
            { status: 'asc' }, // PENDING first
            { dueDate: 'asc' } // Earliest due date first
        ]
    });
}

export async function uploadTaskProof(taskId: number, proofType: string, screenshotUrl: string) {
    // 1. Create proof
    await prisma.workerSocialTaskProof.create({
        data: {
            taskId,
            proofType, // LIKE, SHARE, COMMENT
            screenshotUrl,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days expiry
        }
    });

    // 2. Update task progress
    const updateData: any = {};
    if (proofType === 'LIKE') {
        updateData.liked = true;
        updateData.likedAt = new Date();
    } else if (proofType === 'SHARE') {
        updateData.shared = true;
        updateData.sharedAt = new Date();
    } else if (proofType === 'COMMENT') {
        updateData.commented = true;
        updateData.commentedAt = new Date();
    }

    // 3. Update task
    await prisma.workerSocialTask.update({
        where: { id: taskId },
        data: updateData
    });

    // 4. Add Points
    const { addWorkerPoints } = await import('./worker');
    const pointsMap: Record<string, number> = { 'LIKE': 5, 'COMMENT': 10, 'SHARE': 20 };
    if (pointsMap[proofType]) {
        const task = await prisma.workerSocialTask.findUnique({ where: { id: taskId } });
        if (task) {
            await addWorkerPoints(task.workerId, `SOCIAL_${proofType}`, pointsMap[proofType], `Engaged with social post: ${proofType}`, true);
        }
    }

    // Check if task is fully complete (logic can be adjusted)
    // For now, if at least one action is done, we can mark as IN_PROGRESS
    // Or if all required are done -> COMPLETED

    revalidatePath('/social');
    return { success: true };
}

export async function markTaskAsCompleted(taskId: number) {
    await prisma.workerSocialTask.update({
        where: { id: taskId },
        data: {
            status: 'COMPLETED',
            completedAt: new Date()
        }
    });
    revalidatePath('/social');
}

export async function updateAssemblySocialLinks(assemblyId: number, links: {
    facebookUrl?: string,
    instagramUrl?: string,
    twitterUrl?: string
}) {
    await prisma.assembly.update({
        where: { id: assemblyId },
        data: links
    });
    revalidatePath('/social');
    return { success: true };
}

export async function trackMaterialInteraction(materialId: number, userId: number, actionType: 'LIKE' | 'SHARE' | 'COMMENT') {
    const worker = await prisma.worker.findUnique({ where: { userId } });
    if (!worker) return { success: false };

    // Find or Create Task for this material
    let task = await prisma.workerSocialTask.findFirst({
        where: {
            workerId: worker.id,
            campaignMaterialId: materialId
        }
    });

    if (!task) {
        task = await prisma.workerSocialTask.create({
            data: {
                workerId: worker.id,
                assemblyId: worker.assemblyId,
                campaignMaterialId: materialId,
                taskType: 'MATERIAL_SHARE',
                status: 'IN_PROGRESS',
                title: 'Campaign Media',
                description: 'Interaction with campaign material',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
    }

    const updateData: any = {};
    if (actionType === 'LIKE') { updateData.liked = true; updateData.likedAt = new Date(); }
    if (actionType === 'SHARE') { updateData.shared = true; updateData.sharedAt = new Date(); }
    if (actionType === 'COMMENT') { updateData.commented = true; updateData.commentedAt = new Date(); }

    await prisma.workerSocialTask.update({
        where: { id: task.id },
        data: updateData
    });

    // Add Points
    const { addWorkerPoints } = await import('./worker');
    const material = await prisma.campaignMaterial.findUnique({ where: { id: materialId } });
    if (material) {
        let points = 20; // Default
        if (actionType === 'LIKE') points = 5;
        if (actionType === 'COMMENT') points = 10;
        if (actionType === 'SHARE') {
            points = material.materialType === 'Video' ? 20 : 10;
        }
        await addWorkerPoints(userId, `MATERIAL_${actionType}`, points, `${actionType}: ${material.title}`);
    }

    revalidatePath('/social');
    return { success: true };
}

export async function getWorkerMaterialStats(userId: number) {
    const worker = await prisma.worker.findUnique({ where: { userId } });
    if (!worker) return {};

    const tasks = await prisma.workerSocialTask.findMany({
        where: {
            workerId: worker.id,
            campaignMaterialId: { not: null }
        },
        select: {
            campaignMaterialId: true,
            liked: true,
            shared: true,
            commented: true
        }
    });

    const stats: any = {};
    tasks.forEach((t: any) => {
        if (t.campaignMaterialId) {
            stats[t.campaignMaterialId] = {
                liked: t.liked,
                shared: t.shared,
                commented: t.commented
            };
        }
    });
    return stats;
}
