'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getNotifications, markAsRead, savePushSubscription } from '@/app/actions/notifications';
import { useView } from '@/context/ViewContext';
import { Bell, X, Info, AlertCircle, MessageSquare } from 'lucide-react';

const VAPID_PUBLIC_KEY = "BO8iGw3ZEW83M0SNX7icoMvJzfppUf4Inimwwlq7679WKB-ernQX-nypS4-ZQBqvBQnW7kJip9J8wpgqYqwGCYU";

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationListener() {
    const { data: session } = useSession();
    const { effectiveRole } = useView();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [latestUnread, setLatestUnread] = useState<any>(null);
    const lastNotifiedId = useRef<number | null>(null);

    const playPulse = () => {
        try {
            const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const context = new AudioContext();
            const osc1 = context.createOscillator();
            const osc2 = context.createOscillator();
            const gain = context.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, context.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.1);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(440, context.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(220, context.currentTime + 0.15);

            gain.gain.setValueAtTime(0.1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(context.destination);

            osc1.start();
            osc2.start();
            osc1.stop(context.currentTime + 0.4);
            osc2.stop(context.currentTime + 0.4);

            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

    const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const subJson = subscription.toJSON();
            const user = session?.user as any;
            if (user?.id) {
                await savePushSubscription(user.id, {
                    endpoint: subJson.endpoint,
                    keys: {
                        p256dh: subJson.keys?.p256dh,
                        auth: subJson.keys?.auth
                    }
                });
            }
        } catch (e) {
            console.error("Push subscription error:", e);
        }
    };

    useEffect(() => {
        if ('serviceWorker' in navigator && session?.user) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                subscribeToPush(registration);
            });
        }
    }, [session]);

    const fetchItems = async () => {
        if (!session?.user) return;
        const user = session.user as any;
        const items = await getNotifications(user.id, user.assemblyId);

        if (items.length > 0) {
            const unread = items.filter((n: any) => !n.isRead);
            if (unread.length > 0) {
                const newest = unread[0];
                if (newest.id !== lastNotifiedId.current) {
                    setLatestUnread(newest);
                    playPulse();
                    lastNotifiedId.current = newest.id;
                }
            }
            setNotifications(items);
        }
    };

    useEffect(() => {
        fetchItems();
        // Reduced polling to 60s since we have push for immediate triggers
        const interval = setInterval(fetchItems, 60000);

        // Also check on window focus
        window.addEventListener('focus', fetchItems);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', fetchItems);
        };
    }, [session]);

    if (!latestUnread) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            width: '350px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0',
            animation: 'slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: latestUnread.type === 'APPROVAL' ? '#ECFDF5' : '#EFF6FF',
                    color: latestUnread.type === 'APPROVAL' ? '#10B981' : '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {latestUnread.type === 'APPROVAL' ? <AlertCircle size={24} /> : <MessageSquare size={24} />}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>{latestUnread.title}</h4>
                        <button
                            onClick={() => setLatestUnread(null)}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600', lineHeight: '1.4' }}>
                        {latestUnread.message}
                    </p>
                    <button
                        onClick={async () => {
                            await markAsRead(latestUnread.id);
                            setLatestUnread(null);
                        }}
                        style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '10px', background: '#F1F5F9', border: 'none', color: '#1E293B', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                    >
                        ठीक है
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
