'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, Smartphone } from 'lucide-react';
import { syncGitHubApps } from '@/app/actions/admin';

export default function SyncAppsButton() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await syncGitHubApps();
            setResult(res);
            if (res.success) {
                setTimeout(() => setResult(null), 5000);
            }
        } catch (err: any) {
            alert('सिंक करने में विफल: ' + (err.message || 'Error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="kpi-card"
            onClick={loading ? undefined : handleSync}
            style={{
                padding: '24px',
                borderRadius: '20px',
                background: loading ? '#F1F5F9' : 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: '1px solid #E2E8F0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: loading ? 0.8 : 1,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="kpi-label" style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        marginBottom: '8px'
                    }}>
                        {loading ? 'सिंक हो रहा है...' : 'GitHub सिंक'}
                    </div>
                    <div className="kpi-value" style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: result?.success ? '#166534' : '#1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {result?.success ? <CheckCircle size={20} color="#166534" /> : 'Apps सिंक करें'}
                    </div>
                </div>
                <div style={{
                    padding: '12px',
                    background: '#F0F9FF',
                    borderRadius: '12px',
                    color: '#0369A1'
                }}>
                    <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                .kpi-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
            `}} />
        </div>
    );
}
