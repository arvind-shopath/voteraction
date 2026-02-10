'use client';
import React, { useState } from 'react';
import { RefreshCw, CheckCircle, Trash2 } from 'lucide-react';
import { clearAppCache } from '@/app/actions/admin';

export default function CleanCacheButton() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'success' | 'error' | null>(null);

    const handleClean = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm('क्या आप वाकई एप्प कैश साफ करना चाहते हैं?')) return;

        setLoading(true);
        setStatus(null);

        try {
            await clearAppCache();
            setStatus('success');
            setTimeout(() => setStatus(null), 3000);
        } catch (e: any) {
            setStatus('error');
            alert('Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="kpi-card"
            onClick={loading ? undefined : handleClean}
            style={{
                padding: '24px',
                borderRadius: '20px',
                background: status === 'success' ? '#F0FDF4' : 'white',
                cursor: loading ? 'wait' : 'pointer',
                border: loading ? '2px solid #EF4444' : '1px solid #E2E8F0',
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
                        {loading ? 'सफाई हो रही है...' : 'सिस्टम कैश'}
                    </div>
                    <div className="kpi-value" style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: status === 'success' ? '#166534' : '#1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {status === 'success' ? <CheckCircle size={20} color="#166534" /> : 'कैश साफ करें'}
                    </div>
                </div>
                <div style={{
                    padding: '12px',
                    background: '#FEE2E2',
                    borderRadius: '12px',
                    color: '#DC2626',
                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)',
                    border: '1px solid #FCA5A5'
                }}>
                    <Trash2 size={24} className={loading ? 'animate-spin' : ''} />
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
                    border-color: #FCA5A5;
                }
            `}} />
        </div>
    );
}
