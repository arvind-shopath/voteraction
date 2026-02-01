import React from 'react';
import { getAdminStats, getSystemLogs } from '@/app/actions/admin';
import { Tent, Users, Globe, ArrowRight, AlertTriangle, ListTodo, Clock } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export default async function AdminDashboard() {
    const session = await auth();
    const cookieStore = await cookies();
    const effectiveRole = cookieStore.get('effectiveRole')?.value || (session?.user as any)?.role;

    const isSuperAdmin = effectiveRole === 'SUPERADMIN';
    const stats = await getAdminStats();
    const logs = await getSystemLogs(6);

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B' }}>सुपर एडमिन कंट्रोल पैनल</h1>
                <p style={{ color: '#64748B', marginTop: '4px' }}>एप्लीकेशन का केंद्रीय प्रबंधन और लाइव एक्टिविटी</p>
            </div>

            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="kpi-card" style={{ padding: '24px', borderRadius: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="kpi-label" style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>कुल विधानसभाएँ</div>
                            <div className="kpi-value" style={{ fontSize: '28px', fontWeight: '800' }}>{stats.totalAssemblies}</div>
                        </div>
                        <div style={{ padding: '12px', background: '#F1F5F9', borderRadius: '12px', color: '#475569' }}>
                            <Tent size={24} />
                        </div>
                    </div>
                </div>
                <div className="kpi-card" style={{ padding: '24px', borderRadius: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="kpi-label" style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>कुल सक्रिय यूजर्स</div>
                            <div className="kpi-value" style={{ fontSize: '28px', fontWeight: '800' }}>{stats.totalUsers}</div>
                        </div>
                        <div style={{ padding: '12px', background: '#F0F9FF', borderRadius: '12px', color: '#0369A1' }}>
                            <Users size={24} />
                        </div>
                    </div>
                </div>
                {!isSuperAdmin && (
                    <>
                        <div className="kpi-card" style={{ padding: '24px', borderRadius: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div className="kpi-label" style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>पेंडिंग समस्याएं</div>
                                    <div className="kpi-value" style={{ fontSize: '28px', fontWeight: '800', color: '#EF4444' }}>{stats.pendingIssues}</div>
                                </div>
                                <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '12px', color: '#EF4444' }}>
                                    <AlertTriangle size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="kpi-card" style={{ padding: '24px', borderRadius: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div className="kpi-label" style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>कुल कार्यकर्ता</div>
                                    <div className="kpi-value" style={{ fontSize: '28px', fontWeight: '800' }}>{stats.totalWorkers}</div>
                                </div>
                                <div style={{ padding: '12px', background: '#F0FDF4', borderRadius: '12px', color: '#166534' }}>
                                    <ListTodo size={24} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="admin-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '32px' }}>
                <div className="card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800' }}>त्वरित लिंक (Control Panel)</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link href="/admin/assemblies" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '16px', textDecoration: 'none', color: '#1E293B', transition: 'all 0.2s', border: '1px solid #F1F5F9' }}>
                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tent size={20} color="#2563EB" /></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>नई विधानसभा जोड़ें</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>Add & Configure Assembly</div>
                            </div>
                            <ArrowRight size={18} color="#CBD5E1" />
                        </Link>
                        <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '16px', textDecoration: 'none', color: '#1E293B', border: '1px solid #F1F5F9' }}>
                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} color="#059669" /></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>यूजर एकाउंट्स मैनेजमेंट</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>RBAC & Account Expiry</div>
                            </div>
                            <ArrowRight size={18} color="#CBD5E1" />
                        </Link>
                        <Link href="/voters/import" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '16px', textDecoration: 'none', color: '#1E293B', border: '1px solid #F1F5F9' }}>
                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={20} color="#7C3AED" /></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>डेटा इम्पॉर्ट सेंटर</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>Import Voter Lists (PDF/XLS)</div>
                            </div>
                            <ArrowRight size={18} color="#CBD5E1" />
                        </Link>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>सिस्टम एक्टिविटी (Live Logs)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {logs.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>कोई एक्टिविटी लॉग उपलब्ध नहीं है।</div>
                        ) : logs.map((log: any, index: number) => (
                            <div key={log.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                                <div style={{ marginTop: '4px' }}>
                                    <Clock size={14} color="#94A3B8" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{log.details || log.action}</div>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'flex', gap: '8px' }}>
                                        <span>{new Date(log.createdAt).toLocaleTimeString('hi-IN')}</span>
                                        {log.user && <span>• {log.user.name} द्वारा</span>}
                                        {log.assembly && <span style={{ color: '#2563EB', fontWeight: '600' }}>• {log.assembly.name}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
