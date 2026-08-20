import { prisma as prismaClient } from '@/lib/prisma';
import { extractTextFromPdf, parseUPVoterRoll, parseVotersAdvanced } from './pdf-parser';
import { predictVoterAttributes } from './caste-prediction';
import { transliterateToHindi, transliterateToEnglish } from './transliteration';
import { processCardWithVisionAIFallback } from './vision-ai';
import { readdirSync, existsSync, mkdirSync, unlinkSync, statSync, renameSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const prisma = prismaClient as any;

let isQueueProcessing = false;

export async function autoQueuePdfFilesForAssembly(assemblyId: number) {
    try {

        const assembly = await (prisma as any).assembly.findUnique({
            where: { id: parseInt(String(assemblyId)) },
            select: { id: true, number: true, name: true }
        });
        if (!assembly) return;

        const baseDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs');
        const targetDir = join(baseDir, String(assembly.number));

        // Auto-extract any ZIP matching assembly number
        if (existsSync(baseDir)) {
            const zips = readdirSync(baseDir).filter((f: string) => {
                if (!f.toLowerCase().endsWith('.zip')) return false;
                const m = f.match(/^(\d+)/);
                return m && parseInt(m[1]) === assembly.number;
            });
            for (const zf of zips) {
                const fullZip = join(baseDir, zf);
                if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
                try {
                    if (process.platform === 'win32') {
                        execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${fullZip}' -DestinationPath '${targetDir}' -Force"`, { maxBuffer: 1024 * 1024 * 500 });
                    } else {
                        execSync(`unzip -o "${fullZip}" -d "${targetDir}"`);
                    }
                } catch (e) {
                    try { execSync(`tar -xf "${fullZip}" -C "${targetDir}"`); } catch (t) {}
                }
                if (existsSync(fullZip)) unlinkSync(fullZip);
            }
        }

        // Folders to scan
        const dirsToScan = [
            targetDir,
            join(baseDir, `${assembly.id}`),
            join(process.cwd(), 'public', 'uploads', 'pdf_queue')
        ];

        if (existsSync(baseDir)) {
            const subDirs = readdirSync(baseDir, { withFileTypes: true })
                .filter((d: any) => d.isDirectory())
                .map((d: any) => d.name);
            for (const sd of subDirs) {
                const m = sd.match(/^(\d+)/);
                if (m && parseInt(m[1]) === assembly.number) {
                    const fp = join(baseDir, sd);
                    if (!dirsToScan.includes(fp)) dirsToScan.unshift(fp);
                }
            }
        }

        const existingJobs = await (prisma as any).importJob.findMany({
            where: { assemblyId: assembly.id },
            select: { fileName: true }
        });
        const queuedFileNames = new Set(existingJobs.map((j: any) => (j.fileName || '').toLowerCase().trim()));

        let addedCount = 0;
        for (const dir of dirsToScan) {
            if (!existsSync(dir)) continue;

            const flatten = (d: string, tDir: string) => {
                for (const item of readdirSync(d)) {
                    const fp = join(d, item);
                    if (statSync(fp).isDirectory()) flatten(fp, tDir);
                    else if (item.toLowerCase().endsWith('.pdf')) {
                        const dest = join(tDir, item);
                        if (fp !== dest && !existsSync(dest)) renameSync(fp, dest);
                    }
                }
            };
            flatten(dir, dir);

            const files = readdirSync(dir).filter((f: string) => f.toLowerCase().endsWith('.pdf'));
            for (const file of files) {
                const fullPath = join(dir, file);
                const cleanName = file.toLowerCase().trim();

                if (!queuedFileNames.has(cleanName)) {
                    let bm: number | null = null;
                    const m = file.match(/HIN-(\d+)-WI/i) || file.match(/^(\d+)/);
                    if (m) bm = parseInt(m[1]);

                    await (prisma as any).importJob.create({
                        data: {
                            fileName: file,
                            filePath: fullPath,
                            assemblyId: assembly.id,
                            boothNumber: bm,
                            status: 'PENDING'
                        }
                    });
                    queuedFileNames.add(cleanName);
                    addedCount++;
                }
            }
        }

        if (addedCount > 0) {
            console.log(`Auto-queued ${addedCount} PDF files for Assembly #${assembly.number} (ID: ${assembly.id})`);
        }
    } catch (e) {
        console.error("autoQueuePdfFilesForAssembly error:", e);
    }
}

export async function deduplicateImportJobs() {
    try {
        const assemblies = await (prisma as any).assembly.findMany({ select: { id: true, number: true } });
        for (const a of assemblies) {
            const jobs = await (prisma as any).importJob.findMany({
                where: { assemblyId: a.id },
                orderBy: [
                    { status: 'asc' },
                    { id: 'asc' }
                ]
            });

            if (jobs.length === 0) continue;

            const seenFileNames = new Set();
            const idsToDelete: number[] = [];

            for (const j of jobs) {
                const cleanName = (j.fileName || '').split(/[/\\]/).pop()!.toLowerCase().trim();
                if (seenFileNames.has(cleanName)) {
                    idsToDelete.push(j.id);
                } else {
                    seenFileNames.add(cleanName);
                }
            }

            if (idsToDelete.length > 0) {
                await (prisma as any).importJob.deleteMany({
                    where: { id: { in: idsToDelete } }
                });
                console.log(`[DEDUPLICATE] Removed ${idsToDelete.length} duplicate jobs for Assembly #${a.number}`);
            }
        }
    } catch (e) {
        console.error('[DEDUPLICATE ERROR]:', e);
    }
}

export async function processImportQueue() {
    if (isQueueProcessing) {
        console.log('--- Queue Processor is already running. Standing by. ---');
        return;
    }

    try {
        isQueueProcessing = true;
        console.log('--- Background Queue Worker Started ---');

        // Initial Cleanup: Deduplicate jobs & recover stuck jobs
        await deduplicateImportJobs();

        // Initial Cleanup: Recover jobs stuck in PROCESSING from a previous crash
        // BUT only if they haven't been updated for more than 5 minutes (to avoid resetting active slow work)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const stuckJobs = await (prisma as any).importJob.updateMany({
            where: {
                status: 'PROCESSING',
                updatedAt: { lt: fiveMinutesAgo }
            },
            data: { status: 'PENDING' }
        });

        if (stuckJobs.count > 0) {
            console.log(`--- Recovered ${stuckJobs.count} stuck jobs ---`);
        }

        // AUTO-ZIP EXTRACTOR: Scan public/uploads/assembly_pdfs for any ZIP files placed by user
        try {
            const { existsSync, readdirSync, mkdirSync, unlinkSync, statSync, renameSync } = require('fs');
            const { join } = require('path');
            const { execSync } = require('child_process');

            const baseDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs');
            if (existsSync(baseDir)) {
                const zipFiles = readdirSync(baseDir).filter((f: string) => f.toLowerCase().endsWith('.zip'));
                for (const zf of zipFiles) {
                    const fullZipPath = join(baseDir, zf);
                    const match = zf.match(/^(\d+)/);
                    if (!match) continue;
                    const assemblyNo = parseInt(match[1]);

                    let assembly = await (prisma as any).assembly.findFirst({ where: { number: assemblyNo } });
                    if (!assembly) {
                        assembly = await (prisma as any).assembly.create({
                            data: { name: `Assembly ${assemblyNo}`, number: assemblyNo, state: 'Uttar Pradesh', totalVoters: 0, importStatus: 'PENDING' }
                        });
                    }

                    const targetDir = join(baseDir, String(assembly.number));
                    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

                    console.log(`[WORKER ZIP AUTO-EXTRACT] Extracting ${zf} to ${targetDir}...`);
                    const isWin = process.platform === 'win32';
                    try {
                        if (isWin) {
                            execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${fullZipPath}' -DestinationPath '${targetDir}' -Force"`, { maxBuffer: 1024 * 1024 * 500 });
                        } else {
                            execSync(`unzip -o "${fullZipPath}" -d "${targetDir}"`);
                        }
                    } catch (e) {
                        try { execSync(`tar -xf "${fullZipPath}" -C "${targetDir}"`); } catch (t) {}
                    }

                    if (existsSync(fullZipPath)) unlinkSync(fullZipPath);

                    // Flatten nested PDFs
                    const flatten = (dir: string, tDir: string) => {
                        for (const item of readdirSync(dir)) {
                            const fp = join(dir, item);
                            if (statSync(fp).isDirectory()) flatten(fp, tDir);
                            else if (item.toLowerCase().endsWith('.pdf')) {
                                const dest = join(tDir, item);
                                if (fp !== dest && !existsSync(dest)) renameSync(fp, dest);
                            }
                        }
                    };
                    flatten(targetDir, targetDir);

                    // Queue PDFs
                    const pdfs = readdirSync(targetDir).filter((f: string) => f.toLowerCase().endsWith('.pdf'));
                    const existingJobs = await (prisma as any).importJob.findMany({
                        where: { assemblyId: assembly.id },
                        select: { filePath: true }
                    });
                    const queuedSet = new Set(existingJobs.map((j: any) => j.filePath));

                    for (const pdfFile of pdfs) {
                        const fp = join(targetDir, pdfFile);
                        if (queuedSet.has(fp)) continue;
                        let bm = null;
                        const m = pdfFile.match(/HIN-(\d+)-WI/i) || pdfFile.match(/(\d+)/);
                        if (m) bm = parseInt(m[1]);
                        await (prisma as any).importJob.create({
                            data: { fileName: pdfFile, filePath: fp, assemblyId: assembly.id, boothNumber: bm, status: 'PENDING' }
                        });
                    }
                }
            }
        } catch (zipErr) {
            console.error('[WORKER ZIP EXTRACT ERROR]:', zipErr);
        }

        // Recovery: Reset FAILED jobs to PENDING if the file is found on disk
        try {
            // Check if file exists
            const failedJobs = await (prisma as any).importJob.findMany({
                where: { status: 'FAILED' },
                select: { id: true, assemblyId: true, fileName: true, filePath: true }
            });
            for (const fj of failedJobs) {
                const assembly = await (prisma as any).assembly.findUnique({ where: { id: fj.assemblyId }, select: { number: true } });
                if (!assembly) continue;

                let foundPath: string | null = null;
                if (fj.filePath && existsSync(fj.filePath)) {
                    foundPath = fj.filePath;
                } else {
                    const candidateDirs = [
                        join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', String(assembly.number)),
                        join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', `${assembly.number}- sikta`),
                        join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', `${assembly.number}- malihabad`),
                        join(process.cwd(), 'public', 'uploads', 'assembly_pdfs'),
                        join(process.cwd(), 'public', 'uploads', 'pdf_queue')
                    ];
                    for (const cd of candidateDirs) {
                        if (existsSync(cd)) {
                            try {
                                const match = readdirSync(cd).find((f: string) => f.toLowerCase().trim() === (fj.fileName || '').toLowerCase().trim());
                                if (match) {
                                    foundPath = join(cd, match);
                                    break;
                                }
                            } catch (e) {}
                        }
                    }
                }

                if (foundPath) {
                    await (prisma as any).importJob.update({
                        where: { id: fj.id },
                        data: { status: 'PENDING', filePath: foundPath, errorMessage: null, progress: 0 }
                    });
                } else {
                    console.log(`--- [CLEANUP] Deleting orphan job #${fj.id} (${fj.fileName}) - file not found on disk ---`);
                    await (prisma as any).importJob.delete({ where: { id: fj.id } }).catch(() => {});
                }
            }
        } catch (recoverErr) {
            console.error('[RECOVER FAILED JOBS ERROR]:', recoverErr);
        }

        while (true) {
            // Round-robin: Pick pending job from assembly that was NOT processed in the last iteration
            const lastProcessedJob = await (prisma as any).importJob.findFirst({
                where: { status: { in: ['PROCESSING', 'COMPLETED'] } },
                orderBy: { updatedAt: 'desc' },
                select: { assemblyId: true }
            });

            const lastAssemblyId = lastProcessedJob?.assemblyId;

            let job = null;
            if (lastAssemblyId) {
                job = await (prisma as any).importJob.findFirst({
                    where: { status: 'PENDING', NOT: { assemblyId: lastAssemblyId } },
                    orderBy: { addedAt: 'asc' }
                });
            }

            if (!job) {
                job = await (prisma as any).importJob.findFirst({
                    where: { status: 'PENDING' },
                    orderBy: { addedAt: 'asc' }
                });
            }

            if (!job) {
                console.log('--- No more pending jobs. Worker finishing. ---');
                break;
            }

            // Check if file exists, or resolve dynamic path
            // Check if file exists
            let actualPath = job.filePath;

            if (!existsSync(actualPath)) {
                const assembly = await (prisma as any).assembly.findUnique({
                    where: { id: job.assemblyId },
                    select: { number: true }
                });

                if (assembly) {
                    const searchPaths = [
                        join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', String(assembly.number), job.fileName),
                        join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', `${assembly.number}- sikta`, job.fileName),
                        join(process.cwd(), 'public', 'uploads', `${assembly.number}- sikta`, job.fileName),
                        join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', `${assembly.number}- malihabad`, job.fileName),
                        join(process.cwd(), 'public', 'uploads', 'pdf_queue', job.fileName)
                    ];

                    for (const sp of searchPaths) {
                        if (existsSync(sp)) {
                            actualPath = sp;
                            await (prisma as any).importJob.update({
                                where: { id: job.id },
                                data: { filePath: actualPath }
                            });
                            console.log(`--- Resolved new path for Job #${job.id}: ${actualPath} ---`);
                            break;
                        }
                    }
                }
            }

            if (!existsSync(actualPath)) {
                console.log(`--- File missing for Job #${job.id} (${job.fileName}), deleting orphan job record ---`);
                await (prisma as any).importJob.delete({ where: { id: job.id } }).catch(() => {});
                continue;
            }

            console.log(`--- Processing Job #${job.id}: ${job.fileName} ---`);
            const startPage = job.startPage && job.startPage > 0 ? job.startPage : 1;
            const endPage = job.endPage && job.endPage > 0 ? job.endPage : 9999;
            console.log(`--- Page Range: ${startPage} to ${endPage} ---`);

            try {
                // Mark Processing
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: { status: 'PROCESSING', progress: 5 }
                });

                // USE ADVANCED PARSER WITH FALLBACK
                // USE ADVANCED PARSER WITH REAL-TIME INCREMENTAL PAGE SAVER
                const validVoters = await parseVotersAdvanced(
                    actualPath,
                    async (pct) => {
                        await (prisma as any).importJob.update({
                            where: { id: job.id },
                            data: { progress: pct }
                        });
                    },
                    startPage,
                    endPage,
                    job.commonAddress || "",
                    job.boothName || "",
                    async (pageVoters) => {
                        for (const voter of pageVoters) {
                            try {
                                const finalBoothNumber = job.boothNumber !== null ? job.boothNumber : (voter.boothNumber || 1);
                                const rawVillage = voter.village || job.boothName || 'सौरी';
                                const currentVillage = rawVillage === 'Sauri' ? 'सौरी' : rawVillage;
                                const rawName = voter.name || 'Unknown';
                                let rawRelName = voter.relativeName || '';
                                if (rawRelName === 'बाळू' || rawRelName === 'बालू') rawRelName = 'वाढू';

                                const isHindiInput = /[\u0900-\u097F]/.test(rawName) || /[\u0900-\u097F]/.test(rawRelName);

                                const nameHi = isHindiInput ? rawName : transliterateToHindi(rawName);
                                const nameEn = isHindiInput ? transliterateToEnglish(rawName) : rawName;
                                const relativeNameHi = isHindiInput ? rawRelName : transliterateToHindi(rawRelName);
                                const relativeNameEn = isHindiInput ? transliterateToEnglish(rawRelName) : rawRelName;

                                const villageHi = /[\u0900-\u097F]/.test(currentVillage) ? currentVillage : transliterateToHindi(currentVillage);
                                const villageEn = /[\u0900-\u097F]/.test(currentVillage) ? transliterateToEnglish(currentVillage) : currentVillage;

                                const prediction = predictVoterAttributes(nameEn, relativeNameEn);
                                const rawHouse = (voter.houseNumber || '').trim().replace(/^0+([1-9])/, '$1').replace(/^0+$/, '0');
                                const cleanHouseNo = (rawHouse && !['0', '-', 'null', 'n/a', 'na', ''].includes(rawHouse.toLowerCase()))
                                    ? rawHouse
                                    : `UNASSIGNED_${finalBoothNumber}_${voter.epic}`;
                                const cleanVillage = (currentVillage || 'v').replace(/[\s.]+/g, '').toLowerCase();
                                const familyId = `FAM_${job.assemblyId}_B${finalBoothNumber}_${cleanVillage}_H${cleanHouseNo}`;

                                let finalEpic = (voter.epic && voter.epic !== 'Unknown' && voter.epic.length >= 5)
                                    ? voter.epic
                                    : `SYN_${job.assemblyId}_${finalBoothNumber}_${Math.floor(Math.random() * 899999 + 100000)}`;

                                const genderClean = (voter.gender && /female|महिला|F/i.test(voter.gender)) ? 'F' : 'M';
                                const ageVal = parseInt(String(voter.age || 0)) || 25;

                                const nameInsert = nameHi || rawName;
                                const relNameInsert = relativeNameHi || rawRelName;
                                const relTypeInsert = voter.relationType || 'Father';
                                const houseNoInsert = voter.houseNumber || '';
                                const nowStr = new Date().toISOString();

                                // Auto-sync Booth name in Booth table
                                if (finalBoothNumber && villageHi) {
                                    await prisma.$executeRaw`
                                        INSERT INTO "Booth" (number, name, "nameHi", "nameEn", "villageNameHi", "villageNameEn", "assemblyId", "createdAt", "updatedAt")
                                        VALUES (${finalBoothNumber}, ${villageHi}, ${villageHi}, ${villageEn}, ${villageHi}, ${villageEn}, ${job.assemblyId}, ${nowStr}, ${nowStr})
                                        ON CONFLICT(number, "assemblyId") DO UPDATE SET
                                            name = CASE WHEN "Booth".name IS NULL OR "Booth".name LIKE 'Booth%' OR "Booth".name LIKE 'बूथ नंबर%' THEN ${villageHi} ELSE "Booth".name END,
                                            "nameHi" = CASE WHEN "Booth"."nameHi" IS NULL OR "Booth"."nameHi" LIKE 'Booth%' OR "Booth"."nameHi" LIKE 'बूथ नंबर%' THEN ${villageHi} ELSE "Booth"."nameHi" END,
                                            "villageNameHi" = ${villageHi},
                                            "villageNameEn" = ${villageEn},
                                            "updatedAt" = ${nowStr}
                                    `.catch(() => {});
                                }

                                // USE RAW SQL to bypass stale Prisma Client
                                console.log(`[REALTIME INSERT] Voter: ${finalEpic} | ${nameInsert} | age=${ageVal} | booth=${finalBoothNumber}`);
                                const existingRows = await prisma.$queryRaw`SELECT id FROM "Voter" WHERE epic = ${finalEpic} LIMIT 1` as any[];

                                if (existingRows && existingRows.length > 0) {
                                    await prisma.$executeRaw`
                                        UPDATE "Voter" SET
                                            name = ${nameInsert},
                                            "nameEn" = ${nameEn},
                                            "nameHi" = ${nameHi},
                                            "relativeName" = ${relNameInsert},
                                            "relativeNameEn" = ${relativeNameEn},
                                            "relativeNameHi" = ${relativeNameHi},
                                            "relationType" = ${relTypeInsert},
                                            age = ${ageVal},
                                            gender = ${genderClean},
                                            "houseNumber" = ${houseNoInsert},
                                            village = ${villageHi},
                                            "villageEn" = ${villageEn},
                                            "villageHi" = ${villageHi},
                                            area = ${villageHi},
                                            "boothNumber" = ${finalBoothNumber},
                                            caste = ${prediction.caste},
                                            religion = ${prediction.religion},
                                            "familyId" = ${familyId},
                                            "importJobId" = ${job.id},
                                            "updatedAt" = ${nowStr}
                                        WHERE epic = ${finalEpic}
                                    `;
                                } else {
                                    await prisma.$executeRaw`
                                        INSERT INTO "Voter" (
                                            epic, name, "nameEn", "nameHi",
                                            "relativeName", "relativeNameEn", "relativeNameHi", "relationType",
                                            age, gender, "houseNumber", village, "villageEn", "villageHi", area,
                                            "boothNumber", "assemblyId", caste, religion, "familyId", "importJobId",
                                            "supportStatus", "isVoted", "isHead", "isPwD", "isImportant",
                                            "dataQualityScore", "parsingLayer", "verificationStatus", "eciStatus",
                                            status, "familySize", "createdAt", "updatedAt"
                                        ) VALUES (
                                            ${finalEpic}, ${nameInsert}, ${nameEn}, ${nameHi},
                                            ${relNameInsert}, ${relativeNameEn}, ${relativeNameHi}, ${relTypeInsert},
                                            ${ageVal}, ${genderClean}, ${houseNoInsert}, ${villageHi}, ${villageEn}, ${villageHi}, ${villageHi},
                                            ${finalBoothNumber}, ${job.assemblyId}, ${prediction.caste}, ${prediction.religion}, ${familyId}, ${job.id},
                                            'Neutral', 0, 0, 0, 0,
                                            85, 'VISION_AI', 'UNVERIFIED', 'IN_LIST',
                                            'Active', 1, ${nowStr}, ${nowStr}
                                        )
                                    `;
                                }
                            } catch (vSaveErr: any) {
                                console.error('[REALTIME SAVE ERROR]:', vSaveErr?.message || vSaveErr);
                            }
                        }

                        // Update current DB counts using raw SQL
                        const countResult = await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM "Voter" WHERE "assemblyId" = ${job.assemblyId}` as any[];
                        const currentVoterCount = Number(countResult[0]?.cnt ?? 0);
                        console.log(`[REALTIME COUNT] Assembly ${job.assemblyId}: ${currentVoterCount} voters in DB`);
                        await (prisma as any).importJob.update({
                            where: { id: job.id },
                            data: { totalVoters: currentVoterCount }
                        });
                        await (prisma as any).assembly.update({
                            where: { id: job.assemblyId },
                            data: { totalVoters: currentVoterCount }
                        }).catch(() => { });
                    }
                );

                if (!validVoters || validVoters.length === 0) {
                    console.log(`--- Job #${job.id} (${job.fileName}): No voters found (Header/Cover Page). Marking COMPLETED. ---`);
                    await (prisma as any).importJob.update({
                        where: { id: job.id },
                        data: {
                            status: 'COMPLETED',
                            progress: 100,
                            totalVoters: 0,
                            completedAt: new Date(),
                            logs: 'Header/Index/Cover page processed cleanly (0 voters).'
                        }
                    });
                    await unlink(actualPath).catch(() => {});
                    continue;
                }

                // Immediately update Job totalVoters and boothName for live UI reporting
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: {
                        totalVoters: validVoters.length,
                        boothName: validVoters[0]?.village || job.boothName || ''
                    }
                });
                job.boothName = validVoters[0]?.village || job.boothName || '';

                // Upsert Logic with Caste & Religion Prediction (Module 6)
                let created = 0, updated = 0;
                const affectedFamilies = new Set<string>();

                for (const voter of validVoters) {
                    try {
                        const finalBoothNumber = job.boothNumber !== null ? job.boothNumber : (voter.boothNumber || 0);
                        const currentVillage = voter.village || job.boothName || '';

                        // SRS 3.0 & User Directive: Address Auto-Synthesizer (English & Hindi)
                        let addressPartsEn = [];
                        if (voter.houseNumber) addressPartsEn.push(`House No: ${voter.houseNumber}`);
                        if (currentVillage) addressPartsEn.push(`Village/Locality: ${currentVillage}`);
                        if (voter.policeStation) addressPartsEn.push(`PS: ${voter.policeStation}`);
                        if (voter.district) addressPartsEn.push(`Dist: ${voter.district}`);
                        if (voter.pincode) addressPartsEn.push(`PIN: ${voter.pincode}`);
                        if (job.commonAddress && !voter.policeStation) addressPartsEn.push(job.commonAddress);

                        const combinedAddressEn = addressPartsEn.length > 0 ? addressPartsEn.join(', ') : (voter.area || currentVillage || 'N/A');
                        const combinedAddressHi = transliterateToHindi(combinedAddressEn);

                        // Module 6: Predict Caste, Caste Category, Religion, Surname
                        const prediction = predictVoterAttributes(voter.name, voter.relativeName);

                        const cleanVillage = (currentVillage || 'v').replace(/[\s.]+/g, '').toLowerCase();
                        const rawHouse = (voter.houseNumber || '').trim().replace(/^0+([1-9])/, '$1').replace(/^0+$/, '0');
                        const cleanHouseNo = (rawHouse && !['0', '-', 'null', 'n/a', 'na', ''].includes(rawHouse.toLowerCase()))
                            ? rawHouse
                            : `UNASSIGNED_${finalBoothNumber}_${voter.epic}`;
                        const familyId = `FAM_${job.assemblyId}_B${finalBoothNumber}_${cleanVillage}_H${cleanHouseNo}`;

                        // DUAL PATH PROCESSING (SRS 3.0):
                        // Detect language of input data
                        const rawName = voter.name || 'Unknown';
                        const rawRelName = voter.relativeName || '';
                        const isHindiInput = /[\u0900-\u097F]/.test(rawName) || /[\u0900-\u097F]/.test(rawRelName);

                        let nameEn = '';
                        let nameHi = '';
                        let relativeNameEn = '';
                        let relativeNameHi = '';
                        let parsingLayer = 'OCR_PRIMARY';

                        // Calculate Quality Score (SRS 3.0 Section 5)
                        let qualityScore = 100;
                        const epicStr = voter.epic || '';
                        const isNewEpicFormat = /^[A-Z]{3}[0-9]{7}$/.test(epicStr);
                        const isOldEpicFormat = /^[A-Z]{2}\/[0-9]{2}\/[0-9]{3}\/[0-9]{6}$/.test(epicStr);
                        if (!isNewEpicFormat && !isOldEpicFormat) qualityScore -= 40;
                        if (!rawName || rawName.length < 2 || rawName === 'Unknown') qualityScore -= 30;
                        const voterAgeVal = parseInt(String(voter.age || 0)) || 0;
                        if (voterAgeVal < 18 || voterAgeVal > 120) qualityScore -= 20;
                        qualityScore = Math.max(qualityScore, 0);

                        // LAYER 2: VISION AI FALLBACK IF QUALITY SCORE < 80 (Only for raw text OCR cards, skip for page Vision AI cards)
                        if (qualityScore < 80 && (!voter.originalText || !voter.originalText.startsWith('EPIC:'))) {
                            const visionRepaired = await processCardWithVisionAIFallback(voter.originalText || rawName);
                            if (visionRepaired) {
                                nameHi = visionRepaired.voter_name_hi;
                                nameEn = visionRepaired.voter_name_en;
                                relativeNameHi = visionRepaired.relative_name_hi;
                                relativeNameEn = visionRepaired.relative_name_en;
                                parsingLayer = 'VISION_AI';
                                qualityScore = Math.max(qualityScore, visionRepaired.quality_score);
                            }
                        }

                        if (!nameEn || !nameHi) {
                            if (isHindiInput) {
                                // Path B: Hindi PDF -> Reverse Transliteration (HI -> EN)
                                nameHi = rawName;
                                nameEn = transliterateToEnglish(nameHi);
                                relativeNameHi = rawRelName;
                                relativeNameEn = transliterateToEnglish(relativeNameHi);
                            } else {
                                // Path A: English PDF -> Forward Transliteration (EN -> HI)
                                nameEn = rawName;
                                nameHi = transliterateToHindi(nameEn);
                                relativeNameEn = rawRelName;
                                relativeNameHi = transliterateToHindi(relativeNameEn);
                            }
                        }

                        const villageEn = currentVillage || '';
                        const villageHi = /[\u0900-\u097F]/.test(villageEn) ? villageEn : transliterateToHindi(villageEn);

                        const data: any = {
                            name: nameEn,
                            nameEn: nameEn,
                            nameHi: nameHi,
                            age: voterAgeVal,
                            gender: voter.gender || 'M',
                            relativeName: relativeNameEn,
                            relativeNameEn: relativeNameEn,
                            relativeNameHi: relativeNameHi,
                            relationType: voter.relationType || 'Father',
                            houseNumber: voter.houseNumber || '',
                            houseNoRaw: voter.houseNumber || '',
                            houseNoClean: cleanHouseNo,
                            fullAddressEn: combinedAddressEn,
                            fullAddressHi: combinedAddressHi,
                            boothNumber: finalBoothNumber,
                            village: currentVillage || '',
                            villageEn: villageEn,
                            villageHi: villageHi,
                            area: combinedAddressEn || voter.area || '',
                            assemblyId: job.assemblyId,

                            // Module 6 & SRS Schema Fields
                            caste: prediction.caste,
                            subCaste: prediction.subCaste || null,
                            casteCategory: prediction.casteCategory,
                            religion: prediction.religion,
                            surname: prediction.surname || null,
                            familyId: familyId,
                            dataQualityScore: qualityScore,
                            parsingLayer: parsingLayer
                        };

                        if (familyId) affectedFamilies.add(familyId);

                        let finalEpic = (voter.epic && voter.epic !== 'Unknown' && voter.epic.length >= 5)
                            ? voter.epic
                            : `SYN_${job.assemblyId}_${finalBoothNumber}_${Math.floor(Math.random() * 899999 + 100000)}`;

                        const genderClean = (voter.gender && /female|महिला|F/i.test(voter.gender)) ? 'F' : 'M';
                        const nameInsert = nameEn || nameHi || rawName;
                        const relNameInsert = relativeNameEn || relativeNameHi || rawRelName;
                        const relTypeInsert = voter.relationType || 'Father';
                        const houseNoInsert = voter.houseNumber || '';
                        const nowStr = new Date().toISOString();

                        const existingRows = await prisma.$queryRaw`SELECT id FROM "Voter" WHERE epic = ${finalEpic} LIMIT 1` as any[];

                        if (existingRows && existingRows.length > 0) {
                            await prisma.$executeRaw`
                                UPDATE "Voter" SET
                                    name = ${nameInsert},
                                    "nameEn" = ${nameInsert},
                                    "nameHi" = ${nameHi},
                                    "relativeName" = ${relNameInsert},
                                    "relativeNameEn" = ${relNameInsert},
                                    "relativeNameHi" = ${relativeNameHi},
                                    "relationType" = ${relTypeInsert},
                                    age = ${voterAgeVal},
                                    gender = ${genderClean},
                                    "houseNumber" = ${houseNoInsert},
                                    village = ${currentVillage},
                                    "villageEn" = ${villageEn},
                                    "villageHi" = ${villageHi},
                                    area = ${combinedAddressEn},
                                    "boothNumber" = ${finalBoothNumber},
                                    caste = ${prediction.caste},
                                    religion = ${prediction.religion},
                                    "familyId" = ${familyId},
                                    "importJobId" = ${job.id},
                                    "updatedAt" = ${nowStr}
                                WHERE epic = ${finalEpic}
                            `;
                            updated++;
                        } else {
                            await prisma.$executeRaw`
                                INSERT INTO "Voter" (
                                    epic, name, "nameEn", "nameHi",
                                    "relativeName", "relativeNameEn", "relativeNameHi", "relationType",
                                    age, gender, "houseNumber", village, "villageEn", "villageHi", area,
                                    "boothNumber", "assemblyId", caste, religion, "familyId", "importJobId",
                                    "supportStatus", "isVoted", "isHead", "isPwD", "isImportant",
                                    "dataQualityScore", "parsingLayer", "verificationStatus", "eciStatus",
                                    status, "familySize", "createdAt", "updatedAt"
                                ) VALUES (
                                    ${finalEpic}, ${nameInsert}, ${nameInsert}, ${nameHi},
                                    ${relNameInsert}, ${relNameInsert}, ${relativeNameHi}, ${relTypeInsert},
                                    ${voterAgeVal}, ${genderClean}, ${houseNoInsert}, ${currentVillage}, ${villageEn}, ${villageHi}, ${combinedAddressEn},
                                    ${finalBoothNumber}, ${job.assemblyId}, ${prediction.caste}, ${prediction.religion}, ${familyId}, ${job.id},
                                    'Neutral', 0, 0, 0, 0,
                                    85, 'VISION_AI', 'VERIFIED', 'IN_LIST',
                                    'Active', 1, ${nowStr}, ${nowStr}
                                )
                            `;
                            created++;
                        }
                        // Ensure Booth record exists in DB
                        if (finalBoothNumber && finalBoothNumber > 0) {
                            await (prisma as any).booth.upsert({
                                where: {
                                    number_assemblyId: {
                                        number: finalBoothNumber,
                                        assemblyId: job.assemblyId
                                    }
                                },
                                update: {
                                    name: currentVillage || job.boothName || `Booth No. ${finalBoothNumber}`,
                                    nameEn: currentVillage || job.boothName || `Booth No. ${finalBoothNumber}`,
                                    nameHi: villageHi || `बूथ नं. ${finalBoothNumber}`,
                                    villageNameEn: villageEn,
                                    villageNameHi: villageHi
                                },
                                create: {
                                    number: finalBoothNumber,
                                    name: currentVillage || job.boothName || `Booth No. ${finalBoothNumber}`,
                                    nameEn: currentVillage || job.boothName || `Booth No. ${finalBoothNumber}`,
                                    nameHi: villageHi || `बूथ नं. ${finalBoothNumber}`,
                                    villageNameEn: villageEn,
                                    villageNameHi: villageHi,
                                    assemblyId: job.assemblyId
                                }
                            }).catch(() => {});
                        }
                    } catch (e: any) {
                        console.error(`--- Voter Save Error (${voter.epic}): ${e.message} ---`);
                    }
                }

                // Sync Assembly Total Voters and Booths
                const actualVotersResult = await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM "Voter" WHERE "assemblyId" = ${job.assemblyId}` as any[];
                const actualVotersCount = Number(actualVotersResult[0]?.cnt ?? 0);

                const actualBoothsResult = await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM "Booth" WHERE "assemblyId" = ${job.assemblyId}` as any[];
                const actualBoothsCount = Number(actualBoothsResult[0]?.cnt ?? 0);

                await (prisma as any).assembly.update({
                    where: { id: job.assemblyId },
                    data: {
                        totalVoters: actualVotersCount,
                        totalBooths: actualBoothsCount
                    }
                }).catch(() => {});

                // Sync Families & Inheritance
                for (const fId of affectedFamilies) {
                    const familyVoters = await prisma.$queryRaw`
                        SELECT id, age, caste, religion FROM "Voter"
                        WHERE "familyId" = ${fId}
                        ORDER BY age DESC
                    ` as any[];

                    if (familyVoters.length > 0) {
                        // Senior head member caste inheritance
                        const headVoter = familyVoters[0];
                        await prisma.$executeRaw`
                            UPDATE "Voter" SET
                                "familySize" = ${familyVoters.length},
                                caste = ${headVoter.caste},
                                religion = ${headVoter.religion}
                            WHERE "familyId" = ${fId}
                        `;
                        // Reset head marking for this family
                        await prisma.$executeRaw`
                            UPDATE "Voter" SET "isHead" = 0 WHERE "familyId" = ${fId}
                        `;
                        // Mark head voter
                        await prisma.$executeRaw`
                            UPDATE "Voter" SET "isHead" = 1 WHERE id = ${headVoter.id}
                        `;
                    }
                }

                // STEP 2: CROSS-MATCHING VERIFICATION (User Constraint)
                // Do NOT delete PDF immediately. First cross-match extracted data against expected parameters.
                const totalExtracted = validVoters.length;
                const validEpicsCount = validVoters.filter(v => v.epic && v.epic !== 'Unknown').length;
                let crossMatchPassed = true;
                let crossMatchLog = `Extracted ${totalExtracted} records (${validEpicsCount} valid EPICs).`;

                if (job.expectedCount && job.expectedCount > 0) {
                    const diffPct = Math.abs(totalExtracted - job.expectedCount) / job.expectedCount;
                    if (diffPct > 0.4) {
                        // Significant difference: flag warning but keep data
                        crossMatchLog += ` Notice: Expected ${job.expectedCount}, found ${totalExtracted}.`;
                    }
                }

                if (validEpicsCount === 0) {
                    crossMatchPassed = false;
                    crossMatchLog += ' CROSS-MATCH FAILED: No valid EPICs found.';
                } else {
                    crossMatchLog += ' CROSS-MATCH VERIFIED SUCCESSFULLY.';
                }

                // Update Job Status
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: {
                        status: crossMatchPassed ? 'COMPLETED' : 'VERIFICATION_REQUIRED',
                        progress: 100,
                        totalVoters: validVoters.length,
                        completedAt: new Date(),
                        logs: `Success. Created: ${created}, Updated: ${updated}. ${crossMatchLog}`
                    }
                });

                // Delete PDF file ONLY AFTER cross-matching verification passes!
                if (crossMatchPassed) {
                    console.log(`--- Cross-matching passed for Job #${job.id}. Deleting PDF file... ---`);
                    await unlink(job.filePath).catch(() => { });
                } else {
                    console.log(`--- Job #${job.id} pending verification. Retaining PDF file. ---`);
                }

            } catch (err: any) {
                console.error(`--- Job #${job.id} Failed:`, err);
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', errorMessage: err.message || 'Error', completedAt: new Date() }
                });
                // On failure, keep PDF file for debugging/retry
            }
        }
    } catch (criticalErr) {
        console.error('CRITICAL WORKER ERROR:', criticalErr);
    } finally {
        isQueueProcessing = false;
        console.log('--- Worker finished and released lock. ---');
    }
}
