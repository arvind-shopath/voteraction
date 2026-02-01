import React from 'react';
import { getSystemLogs } from '@/app/actions/admin';
import { Clock, User, Building2, Shield, Activity } from 'lucide-react';

export default async function SystemLogsPage() {
    const logs = await getSystemLogs(50);

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1E293B' }}>सिस्टम ऑडिट लॉग्स (Audit Trail)</h1>
                <p style={{ color: '#64748B', marginTop: '4px' }}>एप्लीकेशन पर होने वाली सभी प्रशासनिक गतिविधियों का पूर्ण इतिहास</p>
            </div>

            <div className="card" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={20} color="#2563EB" />
                    <span style={{ fontWeight: '800', fontSize: '15px' }}>हालिया 50 गतिविधियाँ</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {logs.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>अभी कोई लॉग मौजूद नहीं हैं।</div>
                    ) : logs.map((log: any, index: number) => (
                        <div key={log.id} style={{
                            padding: '20px 24px',
                            borderBottom: index === logs.length - 1 ? 'none' : '1px solid #F1F5F9',
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr 200px',
                            alignItems: 'center',
                            gap: '20px'
                        }}>
                            <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={14} />
                                {new Date(log.createdAt).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short' })}
                                <br />
                                {new Date(log.createdAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>

                            <div>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: log.action.startsWith('USER_') ? '#EFF6FF' : '#F8FAFC',
                                    color: log.action.startsWith('USER_') ? '#2563EB' : '#475569',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    marginBottom: '6px'
                                }}>
                                    {log.action}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{log.details || 'कोई विवरण नहीं'}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {log.user && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                                        <User size={12} color="#94A3B8" />
                                        <span style={{ fontWeight: '600' }}>{log.user.name}</span>
                                    </div>
                                )}
                                {log.assembly && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#2563EB' }}>
                                        <Building2 size={12} color="#2563EB" />
                                        <span style={{ fontWeight: '700' }}>{log.assembly.name}</span>
                                    </div>
                                )}
                                {!log.assembly && !log.user && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
                                        <Shield size={12} />
                                        <span>System Auto</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
