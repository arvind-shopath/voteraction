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
        title: 'Voteraction'
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

    // FIX: Only use localhost if explicitly running in development via environment variable
    // This prevents the "Blank Screen" on user machines where isDev might falsely trigger
    const url = (process.env.NODE_ENV === 'development')
        ? 'http://localhost:3001'
        : 'https://voteraction.creatiav.com';

    win.loadURL(url);

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
