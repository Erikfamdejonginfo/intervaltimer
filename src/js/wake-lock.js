let wakeLock = null;
let timerActive = false;

export async function requestWakeLock() {
    timerActive = true;
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => { wakeLock = null; });
        } catch (err) {
            console.warn('Wake Lock niet verkregen:', err.message);
        }
    }
}

export async function releaseWakeLock() {
    timerActive = false;
    if (wakeLock) {
        try {
            await wakeLock.release();
        } catch {
            // Already released
        }
        wakeLock = null;
    }
}

// Re-acquire wake lock when page becomes visible again
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && timerActive && !wakeLock) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => { wakeLock = null; });
        } catch {
            // Ignore
        }
    }
});
