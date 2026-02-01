'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Smartphone, Monitor } from 'lucide-react';
import { syncGitHubApps } from '@/app/actions/admin';

export default function SyncAppsButton() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSync = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await syncGitHubApps();
            setResult(res);
        } catch (err: any) {
            setError(err.message || 'सिंक करने में विफल');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <button
                onClick={handleSync}
                disabled={loading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 24px',
                    background: loading ? '#94A3B8' : '#2563EB',
                    color: 'white',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '800',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                {loading ? 'एप्प्स सिंक हो रहे हैं...' : 'लेटेस्ट एप्प्स सिंक करें (GitHub)'}
            </button>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>

            {error && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#FEF2F2', color: '#DC2626', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {result && result.success && (
                <div style={{ marginTop: '12px', padding: '16px', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>
                        <CheckCircle size={18} /> एप्प्स सफलतापूर्वक सिंक हुए!
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#166534' }}>
                        {result.stats?.android && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Smartphone size={14} /> Android APK OK</span>
                        )}
                        {result.stats?.windows && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Monitor size={14} /> Windows EXE OK</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
