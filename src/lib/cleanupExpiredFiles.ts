import { prisma } from '@/lib/prisma';
import { deleteFromDrive } from '@/lib/cloudStorage';

/**
 * Cleanup Job: Deletes expired files from Google Drive and Database
 * Run this daily via a cron job or scheduled task
 */
export async function cleanupExpiredFiles() {
    try {
        console.log('🗑️  Starting cleanup of expired files...');

        // Find all expired files
        const expiredFiles = await prisma.cloudFile.findMany({
            where: {
                expiresAt: {
                    lt: new Date() // Files that expired before now
                }
            }
        });

        console.log(`Found ${expiredFiles.length} expired files to delete.`);

        let successCount = 0;
        let failCount = 0;

        // Delete each file from Google Drive and Database
        for (const file of expiredFiles) {
            try {
                // Delete from Google Drive
                await deleteFromDrive(file.externalId);

                // Delete from Database
                await prisma.cloudFile.delete({
                    where: { id: file.id }
                });

                console.log(`✅ Deleted: ${file.fileName} (ID: ${file.id})`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to delete ${file.fileName}:`, error);
                failCount++;
            }
        }

        console.log(`\n📊 Cleanup Summary:`);
        console.log(`   - Success: ${successCount}`);
        console.log(`   - Failed: ${failCount}`);
        console.log(`   - Total: ${expiredFiles.length}\n`);

        return {
            success: true,
            deleted: successCount,
            failed: failCount,
            total: expiredFiles.length
        };

    } catch (error) {
        console.error('Cleanup Job Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
