const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false, // Don't show until ready-to-show
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            partition: 'persist:main'
        },
        title: 'Voteraction',
        icon: path.join(__dirname, 'icon.png')
    });

    // Remove Default Menu Bar
    Menu.setApplicationMenu(null);
    win.setMenuBarVisibility(false);

    // Handle Cookie Sync Request from Web App
    ipcMain.handle('get-cookies', async (event, url) => {
        return await session.defaultSession.cookies.get({ url });
    });

    ipcMain.handle('set-cookies', async (event, cookies) => {
        for (const cookie of cookies) {
            await session.defaultSession.cookies.set(cookie);
        }
        return true;
    });

    ipcMain.handle('apply-session', async (event, { candidateId, cookiesJSON }) => {
        try {
            const cookies = JSON.parse(cookiesJSON);
            const ses = session.fromPartition(`persist:candidate_${candidateId}`);
            for (const cookie of cookies) {
                // Ensure the cookie doesn't have conflicting properties
                const { hostOnly, session: isSession, ...cleanCookie } = cookie;
                await ses.cookies.set(cleanCookie);
            }
            return true;
        } catch (e) {
            console.error('Failed to apply session:', e);
            return false;
        }
    });

    // FIX: Only use localhost if explicitly running in development via environment variable
    // This prevents the "Blank Screen" on user machines where isDev might falsely trigger
    const url = (process.env.NODE_ENV === 'development')
        ? 'http://localhost:3001'
        : 'https://voteraction.creatiav.com';

    win.loadURL(url);

    // Isolated Sessions for different candidates
    win.webContents.setWindowOpenHandler(({ frameName, url: targetUrl }) => {
        // frameName example: 'CreatiAV_67_facebook'
        if (frameName.startsWith('CreatiAV_')) {
            // Extract candidate ID from frameName to group by candidate if needed, 
            // or just use specific window's name for maximum isolation.
            // Using frameName directly means Facebook and Instagram for same candidate are even isolated from each other.
            // If we want same candidate's social windows to share cookies, we use group by ID.
            const candidateId = frameName.split('_')[1];

            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 1200,
                    height: 900,
                    webPreferences: {
                        partition: `persist:candidate_${candidateId}`, // Shares session among all social windows for THIS candidate
                        contextIsolation: true,
                        nodeIntegration: false
                    }
                }
            }
        }
        return { action: 'allow' }
    });

    win.once('ready-to-show', () => {
        win.show();
    });

    // Only open DevTools if explicitly requested or in production debug
    if (process.env.DEBUG_APP === 'true') {
        win.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
