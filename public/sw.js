self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/logo.png', // Make sure this exists or use a generic one
            badge: '/logo.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/'
            },
            actions: [
                { action: 'open', title: 'देखें' }
            ]
        };

        const promiseChain = Promise.all([
            self.registration.showNotification(data.title, options),
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
                clients.forEach(client => client.postMessage({ type: 'REFRESH', data: data }));
            })
        ]);

        event.waitUntil(promiseChain);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
