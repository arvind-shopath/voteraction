import { google } from 'googleapis';
import { Readable } from 'stream';

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID; // The folder where files will be stored

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});

/**
 * Helper to get or create a folder in Google Drive
 */
async function getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
    try {
        const escapedFolderName = folderName.replace(/'/g, "\\'");
        const query = `name = '${escapedFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentId ? ` and '${parentId}' in parents` : ''}`;
        const list = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (list.data.files && list.data.files.length > 0) {
            return list.data.files[0].id!;
        }

        // Create if not exists
        const folder = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentId ? [parentId] : (FOLDER_ID ? [FOLDER_ID] : []),
            },
            fields: 'id',
        });

        return folder.data.id!;
    } catch (error) {
        console.error('getOrCreateFolder Error:', error);
        throw error;
    }
}

/**
 * Uploads a file to Google Drive with optional nested path
 */
export async function uploadToDrive(fileStream: Readable, fileName: string, mimeType: string, folderPath?: string[]): Promise<string> {
    try {
        let parentId = FOLDER_ID || undefined;

        // Traverse/Create folder path
        if (folderPath && folderPath.length > 0) {
            for (const pathPart of folderPath) {
                parentId = await getOrCreateFolder(pathPart, parentId);
            }
        }

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: parentId ? [parentId] : [],
            },
            media: {
                mimeType: mimeType,
                body: fileStream,
            },
            fields: 'id',
        });

        if (!response.data.id) {
            throw new Error('Google Drive did not return a file ID');
        }

        return response.data.id;
    } catch (error) {
        console.error('Google Drive Upload Error:', error);
        throw error;
    }
}

/**
 * Gets a file stream from Google Drive for proxying
 */
export async function getFileStreamFromDrive(fileId: string) {
    try {
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        return response.data;
    } catch (error) {
        console.error('Google Drive Download Error:', error);
        throw error;
    }
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteFromDrive(fileId: string) {
    try {
        await drive.files.delete({ fileId: fileId });
        return true;
    } catch (error) {
        console.error('Google Drive Delete Error:', error);
        // If file already deleted, we don't want to crash
        return false;
    }
}
