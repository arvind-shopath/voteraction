const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== CLEANING UP DUMMY USERS & ZERO-VOTER ASSEMBLIES ===");

    // Mobile numbers of users to KEEP
    const keepMobiles = [
        "9723338321", // Superadmin Arvind Shukla
        "9999786786", // Candidate Ahmed Ansari
        "8888786786", // Ground Worker (Ahmed Ansari)
        "7777786786", // Booth Manager (Ahmed Ansari)
        "666686786"   // Panna Pramukh (Ahmed Ansari)
    ];

    // Find users to keep IDs
    const usersToKeep = await prisma.user.findMany({
        where: { mobile: { in: keepMobiles } },
        select: { id: true, name: true, mobile: true, campaignId: true }
    });
    const keepUserIds = usersToKeep.map(u => u.id);
    const keepCampaignIds = usersToKeep.map(u => u.campaignId).filter(Boolean);

    console.log("Keeping Users:", usersToKeep.map(u => `${u.name} (${u.mobile})`).join(", "));

    // 1. Delete Dummy Users
    const dummyUsers = await prisma.user.findMany({
        where: { id: { notIn: keepUserIds } }
    });

    console.log(`Found ${dummyUsers.length} dummy users to delete.`);

    for (const u of dummyUsers) {
        console.log(`Deleting dummy user: ${u.name} (ID: ${u.id}, Mobile: ${u.mobile})`);
        const userId = u.id;

        await prisma.worker.deleteMany({ where: { userId } });
        await prisma.userAssemblyAssignment.deleteMany({ where: { userId } });
        await prisma.systemLog.deleteMany({ where: { userId } });
        await prisma.account.deleteMany({ where: { userId } });
        await prisma.session.deleteMany({ where: { userId } });
        await prisma.socialSession.deleteMany({ where: { candidateId: userId } });
        await prisma.pushSubscription.deleteMany({ where: { userId } });
        await prisma.notification.deleteMany({ where: { userId } });
        await prisma.campaignMaterial.deleteMany({ where: { createdBy: userId } });

        await prisma.candidatePostRequest.deleteMany({ where: { OR: [{ createdBy: userId }, { acceptedBy: userId }] } });
        await prisma.socialMediaApproval.deleteMany({ where: { OR: [{ createdBy: userId }, { approvedBy: userId }] } });
        await prisma.centralContentTask.deleteMany({ where: { OR: [{ designerId: userId }, { managerId: userId }, { candidateId: userId }] } });

        await prisma.user.delete({ where: { id: userId } });
    }

    // 2. Delete Dummy Campaigns (Keep Ahmed Ansari's Campaign)
    const dummyCampaigns = await prisma.campaign.findMany({
        where: { id: { notIn: keepCampaignIds } }
    });

    for (const c of dummyCampaigns) {
        console.log(`Deleting dummy campaign: ${c.name} (ID: ${c.id})`);
        await prisma.voterFeedback.deleteMany({ where: { campaignId: c.id } });
        await prisma.worker.updateMany({ where: { campaignId: c.id }, data: { campaignId: null } });
        await prisma.user.updateMany({ where: { campaignId: c.id }, data: { campaignId: null } });
        await prisma.campaign.delete({ where: { id: c.id } });
    }

    // Find main assembly (Assembly with voters, e.g. Ghazipur Sadar ID 14)
    const mainAssembly = await prisma.assembly.findFirst({
        where: { voters: { some: {} } }
    });
    const mainAssemblyId = mainAssembly ? mainAssembly.id : 14;

    // Update remaining campaigns (e.g. Ahmed Ansari campaign) to point to mainAssemblyId
    await prisma.campaign.updateMany({
        where: { id: { in: keepCampaignIds } },
        data: { assemblyId: mainAssemblyId }
    });

    // 3. Find and delete assemblies with 0 voters
    const assemblies = await prisma.assembly.findMany({
        include: {
            _count: { select: { voters: true } }
        }
    });

    const emptyAssemblies = assemblies.filter(a => a._count.voters === 0);
    console.log(`\nFound ${emptyAssemblies.length} zero-voter assemblies to delete.`);

    for (const a of emptyAssemblies) {
        console.log(`Deleting empty assembly: ${a.nameHindi || a.name} (ID: ${a.id})`);

        await prisma.user.updateMany({ where: { assemblyId: a.id }, data: { assemblyId: null } });
        await prisma.worker.updateMany({ where: { assemblyId: a.id }, data: { assemblyId: mainAssemblyId } });
        await prisma.userAssemblyAssignment.deleteMany({ where: { assemblyId: a.id } });

        await prisma.booth.deleteMany({ where: { assemblyId: a.id } });
        await prisma.issue.deleteMany({ where: { assemblyId: a.id } });
        await prisma.systemLog.deleteMany({ where: { assemblyId: a.id } });
        await prisma.socialPost.deleteMany({ where: { assemblyId: a.id } });
        await prisma.campaignMaterial.deleteMany({ where: { assemblyId: a.id } });
        await prisma.candidatePostRequest.deleteMany({ where: { assemblyId: a.id } });
        await prisma.socialMediaApproval.deleteMany({ where: { assemblyId: a.id } });
        await prisma.workerSocialTask.deleteMany({ where: { assemblyId: a.id } });
        await prisma.workerJanSampark.deleteMany({ where: { assemblyId: a.id } });
        await prisma.jansamparkRoute.deleteMany({ where: { assemblyId: a.id } });
        await prisma.publicRelation.deleteMany({ where: { assemblyId: a.id } });
        await prisma.electionHistory.deleteMany({ where: { assemblyId: a.id } });
        await prisma.importJob.deleteMany({ where: { assemblyId: a.id } });
        await prisma.task.deleteMany({ where: { assemblyId: a.id } });
        await prisma.voterEditRequest.deleteMany({ where: { assemblyId: a.id } });
        await prisma.centralContentTask.deleteMany({ where: { assemblyId: a.id } });
        await prisma.notification.deleteMany({ where: { assemblyId: a.id } });

        await prisma.assembly.delete({ where: { id: a.id } });
    }

    // Set kept users assemblyId to null so admin can assign them cleanly
    await prisma.user.updateMany({
        where: { id: { in: keepUserIds } },
        data: { assemblyId: null }
    });

    console.log("\n🎉 CLEANUP COMPLETED SUCCESSFULLY!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
