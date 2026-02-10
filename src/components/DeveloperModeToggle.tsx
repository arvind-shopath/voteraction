'use client';

import { useState } from 'react';
import { Code, Loader2 } from 'lucide-react';
import { toggleDeveloperMode } from '@/app/actions/system';

export default function DeveloperModeToggle({ initialState }: { initialState: boolean }) {
    const [enabled, setEnabled] = useState(initialState);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            const result = await toggleDeveloperMode();
            if (result.success) {
                setEnabled(result.enabled || false);
                if (result.enabled) {
                    alert('✅ Developer Mode सक्रिय हो गया है!\n\nअब सभी यूजर्स को maintenance page दिखेगा (Superadmin को छोड़कर).');
                } else {
                    alert('✅ Developer Mode बंद हो गया है!\n\nअब सभी यूजर्स app को normal इस्तेमाल कर सकते हैं.');
                }
                window.location.reload();
            } else {
                alert('❌ Error: ' + (result.error || 'कुछ गलत हो गया'));
            }
        } catch (error) {
            alert('❌ Toggle करने में समस्या आई!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="kpi-card"
            onClick={loading ? undefined : handleToggle}
            style={{
                padding: '24px',
                borderRadius: '20px',
                background: enabled ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: enabled ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: loading ? 0.8 : 1,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="kpi-label" style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: enabled ? '#92400E' : '#64748B',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        डेवलपर मोड {loading && <Loader2 size={12} className="animate-spin" />}
                    </div>
                    <div className="kpi-value" style={{
                        fontSize: '24px',
                        fontWeight: '800',
                        color: enabled ? '#92400E' : (loading ? '#94A3B8' : '#1E293B')
                    }}>
                        {enabled ? '🔴 ON' : '🟢 OFF'}
                    </div>
                </div>
                <div style={{
                    padding: '12px',
                    background: enabled ? '#FCD34D' : '#F1F5F9',
                    borderRadius: '12px',
                    color: enabled ? '#92400E' : '#475569',
                    boxShadow: enabled ? '0 4px 6px -1px rgba(245, 158, 11, 0.2)' : 'none'
                }}>
                    <Code size={24} />
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
