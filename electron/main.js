const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true, // Needed for simple cookie extraction in this version
            contextIsolation: false,
            partition: 'persist:main'
        },
        title: 'CreatiAV Social Dashboard'
    });

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

    // Load the app
    const url = isDev ? 'http://localhost:3000' : 'https://voteraction.creatiav.com';
    win.loadURL(url);

    if (isDev) {
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
