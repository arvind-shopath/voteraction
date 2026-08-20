const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("=== CREATING AHMED ANSARI CANDIDATE & TEAM ===");

    const commonPassword = await bcrypt.hash("ahmed@786", 10);

    // 1. Create or Update Candidate: Ahmed Ansari
    const candidateMobile = "9999786786";
    let candidateUser = await prisma.user.findFirst({
        where: { mobile: candidateMobile }
    });

    if (candidateUser) {
        candidateUser = await prisma.user.update({
            where: { id: candidateUser.id },
            data: {
                name: "अहमद अंसारी",
                role: "CANDIDATE",
                status: "Active",
                password: commonPassword,
                username: candidateMobile
            }
        });
        console.log(`✅ Updated Candidate: ${candidateUser.name} (${candidateUser.mobile})`);
    } else {
        candidateUser = await prisma.user.create({
            data: {
                name: "अहमद अंसारी",
                mobile: candidateMobile,
                username: candidateMobile,
                role: "CANDIDATE",
                status: "Active",
                password: commonPassword
            }
        });
        console.log(`✅ Created Candidate: ${candidateUser.name} (${candidateUser.mobile})`);
    }

    // 2. Ensure Candidate Campaign Exists
    let campaign = await prisma.campaign.findFirst({
        where: { candidateName: "अहमद अंसारी" }
    });

    if (!campaign) {
        // Fallback assembly 1 if not assigned yet
        const firstAssembly = await prisma.assembly.findFirst();
        const assemblyId = candidateUser.assemblyId || (firstAssembly ? firstAssembly.id : 1);

        campaign = await prisma.campaign.create({
            data: {
                name: "अहमद अंसारी कैम्पेन",
                candidateName: "अहमद अंसारी",
                assemblyId: assemblyId,
                allowMasterMobileAccess: true
            }
        });
        console.log(`✅ Created Campaign: ${campaign.name} (ID: ${campaign.id})`);
    } else {
        console.log(`✅ Found Campaign: ${campaign.name} (ID: ${campaign.id})`);
    }

    // Link Candidate to Campaign
    await prisma.user.update({
        where: { id: candidateUser.id },
        data: { campaignId: campaign.id }
    });

    const assemblyId = campaign.assemblyId;

    // 3. Worker Accounts Data
    const workersData = [
        {
            name: "ग्राउंड कार्यकर्ता (अहमद अंसारी)",
            mobile: "8888786786",
            type: "FIELD"
        },
        {
            name: "बूथ मैनेजर (अहमद अंसारी)",
            mobile: "7777786786",
            type: "BOOTH_MANAGER"
        },
        {
            name: "पन्ना प्रमुख (अहमद अंसारी)",
            mobile: "666686786",
            type: "PANNA_PRAMUKH"
        }
    ];

    for (const wData of workersData) {
        let u = await prisma.user.findFirst({
            where: { mobile: wData.mobile }
        });

        if (u) {
            u = await prisma.user.update({
                where: { id: u.id },
                data: {
                    name: wData.name,
                    role: "WORKER",
                    status: "Active",
                    password: commonPassword,
                    campaignId: campaign.id,
                    assemblyId: assemblyId,
                    username: wData.mobile
                }
            });
            console.log(`✅ Updated Worker User: ${u.name} (${u.mobile})`);
        } else {
            u = await prisma.user.create({
                data: {
                    name: wData.name,
                    mobile: wData.mobile,
                    username: wData.mobile,
                    role: "WORKER",
                    status: "Active",
                    password: commonPassword,
                    campaignId: campaign.id,
                    assemblyId: assemblyId
                }
            });
            console.log(`✅ Created Worker User: ${u.name} (${u.mobile})`);
        }

        // Upsert Worker table record
        let workerRecord = await prisma.worker.findUnique({
            where: { userId: u.id }
        });

        if (workerRecord) {
            await prisma.worker.update({
                where: { id: workerRecord.id },
                data: {
                    name: wData.name,
                    mobile: wData.mobile,
                    type: wData.type,
                    campaignId: campaign.id,
                    assemblyId: assemblyId
                }
            });
        } else {
            await prisma.worker.create({
                data: {
                    name: wData.name,
                    mobile: wData.mobile,
                    type: wData.type,
                    userId: u.id,
                    campaignId: campaign.id,
                    assemblyId: assemblyId
                }
            });
        }
    }

    console.log("\n🎉 ALL ACCOUNTS & TEAM SUCCESSFULLY CREATED FOR AHMED ANSARI!");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
