const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const states = ["Uttar Pradesh", "Rajasthan", "Madhya Pradesh", "Gujarat", "Punjab"];
    const parties = ["BJP", "INC", "SP", "BSP", "AAP"];
    const names = [
        "Amit Sharma", "Priya Singh", "Rajesh Kumar", "Sanjay Verma", "Meena Kumari",
        "Vikram Aditya", "Sunita Devi", "Rohan Gupta", "Kavita Rao", "Deepak Joshi",
        "Anita Patel", "Suresh Reddy", "Manish Tiwari", "Jyoti Maurya", "Pankaj Yadav"
    ];

    console.log("Seeding 15 dummy assemblies...");

    for (let i = 0; i < 15; i++) {
        const number = 500 + i; // Offset to avoid collision
        const nameLabel = `विधानसभा ${number}`;
        const candidateName = names[i];

        try {
            const assembly = await prisma.assembly.create({
                data: {
                    number: number,
                    name: nameLabel,
                    district: "Dummy District",
                    state: states[i % states.length],
                    candidateName: candidateName,
                    party: parties[i % parties.length],
                    themeColor: "#2563EB",
                }
            });
            console.log(`Created: ${assembly.name} - Candidate: ${assembly.candidateName}`);
        } catch (e) {
            console.log(`Error creating assembly ${number}: ${e.message}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
