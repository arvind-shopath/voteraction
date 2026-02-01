import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create 10 Assemblies with different constituencies
    const assemblies = [
        { number: 127, name: 'लहरपुर', district: 'सीतामढ़ी', candidateName: 'राजेश कुमार', party: 'BJP' },
        { number: 128, name: 'सिकटा', district: 'पूर्वी चंपारण', candidateName: 'सुनील यादव', party: 'Samajwadi Party' },
        { number: 129, name: 'मुजफ्फरपुर', district: 'मुजफ्फरपुर', candidateName: 'अनिल शर्मा', party: 'Congress' },
        { number: 130, name: 'पटना साहिब', district: 'पटना', candidateName: 'विजय सिंह', party: 'BJP' },
        { number: 131, name: 'दरभंगा', district: 'दरभंगा', candidateName: 'मोहन प्रसाद', party: 'RJD' },
        { number: 132, name: 'गया', district: 'गया', candidateName: 'रामप्रकाश', party: 'BJP' },
        { number: 133, name: 'भागलपुर', district: 'भागलपुर', candidateName: 'संजय कुमार', party: 'Congress' },
        { number: 134, name: 'पूर्णिया', district: 'पूर्णिया', candidateName: 'अजय मिश्रा', party: 'Independent' },
        { number: 135, name: 'आरा', district: 'भोजपुर', candidateName: 'राकेश राय', party: 'Samajwadi Party' },
        { number: 136, name: 'छपरा', district: 'सारण', candidateName: 'दिनेश वर्मा', party: 'BSP' }
    ];

    // Create assemblies and their manager users
    for (const assemblyData of assemblies) {
        const assembly = await prisma.assembly.create({
            data: {
                number: assemblyData.number,
                name: assemblyData.name,
                district: assemblyData.district,
                state: 'Bihar',
                candidateName: assemblyData.candidateName,
                party: assemblyData.party,
                themeColor: assemblyData.party === 'BJP' ? '#FF6B35' :
                    assemblyData.party === 'Congress' ? '#138808' :
                        assemblyData.party === 'Samajwadi Party' ? '#FF0000' :
                            assemblyData.party === 'RJD' ? '#008000' :
                                assemblyData.party === 'BSP' ? '#0000FF' : '#1E3A8A',
                totalVoters: 0,
                totalBooths: 0
            }
        });

        // Create MANAGER user for this assembly
        const username = assemblyData.name.toLowerCase().replace(/\s+/g, '_') + '_manager';
        const user = await prisma.user.create({
            data: {
                username: username,
                email: `${username}@voteraction.com`,
                name: assemblyData.candidateName,
                password: '$2a$10$YourHashedPasswordHere', // You can set proper hash
                role: 'MANAGER',
                status: 'Active',
                assemblyId: assembly.id
            }
        });

        console.log(`✅ Created Assembly #${assembly.number} - ${assembly.name} with Manager: ${user.name}`);
    }

    // Create 36 Social Media Team Members (unassigned)
    const socialMediaNames = [
        'अंकित कुमार', 'प्रिया शर्मा', 'रोहित वर्मा', 'नेहा सिंह', 'विकास पांडे',
        'पूजा गुप्ता', 'राहुल मिश्रा', 'कविता यादव', 'अमित राय', 'सोनिया कुमारी',
        'संदीप शुक्ला', 'दीपिका झा', 'गौरव सिंह', 'रितु वर्मा', 'मनीष कुमार',
        'साक्षी पाठक', 'अजय तिवारी', 'नीतू सिंह', 'रविंद्र प्रसाद', 'अंजलि शर्मा',
        'सुरेश यादव', 'मीना देवी', 'राजू कुमार', 'सरिता गुप्ता', 'आशीष मिश्रा',
        'रेखा राय', 'विनोद सिंह', 'सुनीता शर्मा', 'अनिल कुमार', 'पिंकी यादव',
        'मनोज वर्मा', 'कल्पना सिंह', 'दिनेश प्रसाद', 'ममता कुमारी', 'राजेश तिवारी',
        'गीता पांडे'
    ];

    for (let i = 0; i < socialMediaNames.length; i++) {
        await prisma.user.create({
            data: {
                username: `social_${i + 1}`,
                email: `social_${i + 1}@voteraction.com`,
                name: socialMediaNames[i],
                password: '$2a$10$YourHashedPasswordHere',
                role: 'SOCIAL_MEDIA',
                status: 'Active',
                assemblyId: null // Unassigned
            }
        });
    }

    console.log(`✅ Created 36 Social Media Team Members`);

    // Create 20 Ground Workers (unassigned)
    const workerNames = [
        'रामदेव यादव', 'शिवकुमार', 'जगदीश प्रसाद', 'बलदेव सिंह', 'कृष्णा राय',
        'हरि ओम', 'गणेश मिश्रा', 'लक्ष्मण वर्मा', 'भोला नाथ', 'सत्यनारायण',
        'रामबाबू', 'मुन्ना लाल', 'छोटे लाल', 'बड़े लाल', 'कल्लू राम',
        'राजू मंडल', 'सोनू कुमार', 'मोनू यादव', 'टिंकू सिंह', 'पिंटू प्रसाद'
    ];

    for (let i = 0; i < workerNames.length; i++) {
        await prisma.user.create({
            data: {
                username: `worker_${i + 1}`,
                email: `worker_${i + 1}@voteraction.com`,
                name: workerNames[i],
                password: '$2a$10$YourHashedPasswordHere',
                role: 'WORKER',
                status: 'Active',
                assemblyId: null // Unassigned
            }
        });
    }

    console.log(`✅ Created 20 Ground Workers`);

    console.log('🎉 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
