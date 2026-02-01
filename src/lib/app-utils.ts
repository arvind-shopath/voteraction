export const getAppEnvironment = () => {
    if (typeof window === 'undefined') return 'WEB';

    // Electron
    if (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1) {
        return 'ELECTRON';
    }

    // Capacitor (Android/iOS)
    if ((window as any).Capacitor) {
        return 'CAPACITOR';
    }

    return 'WEB';
};

export const launchSocialWindow = (url: string, name: string) => {
    const env = getAppEnvironment();

    if (env === 'ELECTRON') {
        // Electron handles partitioning via main.js or we can send ipc
        // For now, window.open in Electron with a unique name creates a new session in our setup
        window.open(url, name, 'width=1200,height=900');
    } else if (env === 'CAPACITOR') {
        // Capacitor might need InAppBrowser for better isolation
        window.open(url, '_blank');
    } else {
        // Web fallback
        window.open(url, name, 'width=1200,height=900');
    }
};
