'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, WifiOff, CloudSync, AlertCircle } from 'lucide-react';
import { getPendingActions, removeAction } from '@/lib/offline-sync';
import { createVoter, updateVoterFeedback, updateFamilySupport } from '@/app/actions/voters';
import { createJansamparkRoute, updateJansamparkRoute } from '@/app/actions/jansampark';

export default function OfflineSyncManager() {
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    const updateStatus = () => {
        setPendingCount(getPendingActions().length);
        setIsOnline(navigator.onLine);
    };

    useEffect(() => {
        updateStatus();
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        window.addEventListener('offline-sync-updated', updateStatus);

        // Periodic sync attempt every 30 seconds if online
        const interval = setInterval(() => {
            if (navigator.onLine) syncNow();
        }, 30000);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
            window.removeEventListener('offline-sync-updated', updateStatus);
            clearInterval(interval);
        };
    }, []);

    const syncNow = async () => {
        const actions = getPendingActions();
        if (actions.length === 0 || isSyncing || !navigator.onLine) return;

        setIsSyncing(true);
        console.log(`Starting sync for ${actions.length} actions...`);

        for (const action of actions) {
            try {
                let success = false;
                switch (action.type) {
                    case 'CREATE_VOTER':
                        await createVoter(action.payload);
                        success = true;
                        break;
                    case 'UPDATE_VOTER_FEEDBACK':
                        await updateVoterFeedback(action.payload.id, action.payload.data);
                        success = true;
                        break;
                    case 'UPDATE_FAMILY_SUPPORT':
                        await updateFamilySupport(action.payload);
                        success = true;
                        break;
                    case 'CREATE_JANSAMPARK_ROUTE':
                        await createJansamparkRoute(action.payload);
                        success = true;
                        break;
                    case 'UPDATE_JANSAMPARK_ROUTE':
                        await updateJansamparkRoute(action.payload.id, action.payload);
                        success = true;
                        break;
                }
                if (success) {
                    removeAction(action.id);
                }
            } catch (error) {
                console.error('Sync failed for action:', action.id, error);
                // Keep in queue to retry later
            }
        }
        setIsSyncing(false);
        updateStatus();
    };

    if (!isOnline) {
        return (
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#FEF2F2', border: '1px solid #F87171', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 9999 }}>
                <WifiOff size={20} color="#B91C1C" />
                <div style={{ color: '#991B1B', fontSize: '14px', fontWeight: '700' }}>
                    आप ऑफलाइन हैं। {pendingCount > 0 ? `${pendingCount} डेटा सेव किया गया है।` : 'डेटा बाद में सिंक होगा।'}
                </div>
            </div>
        );
    }

    if (pendingCount > 0) {
        return (
            <div
                onClick={syncNow}
                style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#F0F9FF', border: '1px solid #0EA5E9', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 9999, cursor: 'pointer' }}>
                {isSyncing ? <RefreshCw className="animate-spin" size={20} color="#0284C7" /> : <CloudSync size={20} color="#0284C7" />}
                <div style={{ color: '#0369A1', fontSize: '14px', fontWeight: '700' }}>
                    {isSyncing ? 'डेटा सिंक हो रहा है...' : `${pendingCount} डेटा अपडेट होना बाकी है। (सिंक करें)`}
                </div>
            </div>
        );
    }

    return null;
}
