import React from 'react';
import { getGlobalIssues } from '@/app/actions/admin';
import { AlertTriangle, MapPin, Clock, Building2, ExternalLink } from 'lucide-react';

export default async function GlobalIssuesPage() {
    const issues = await getGlobalIssues();

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1E293B' }}>ग्लोबल समस्या मॉनिटरिंग (All Assemblies)</h1>
                <p style={{ color: '#64748B', marginTop: '4px' }}>सभी विधानसभाओं से प्राप्त शिकायतों और समस्याओं का रियल-टाइम ट्रैक</p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>समस्या / विवरण</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>विधानसभा</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>लोकेशन / बूथ</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>प्राथमिकता</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>स्थिति (Status)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issues.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>कोई समस्या दर्ज नहीं है।</td></tr>
                        ) : issues.map((issue: any) => (
                            <tr key={issue.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '15px', marginBottom: '4px' }}>{issue.title}</div>
                                    <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={12} /> {new Date(issue.createdAt).toLocaleDateString('hi-IN')}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Building2 size={16} color="#2563EB" />
                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{issue.assembly?.name}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                                        <MapPin size={12} style={{ marginRight: '4px' }} />
                                        {issue.village || issue.area || 'N/A'}
                                    </div>
                                    {issue.boothNumber && <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>बूथ संख्या: {issue.boothNumber}</div>}
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        background: issue.priority === 'High' ? '#FEE2E2' : '#EFF6FF',
                                        color: issue.priority === 'High' ? '#EF4444' : '#2563EB',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '800'
                                    }}>
                                        {issue.priority}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: issue.status === 'Closed' ? '#10B981' : issue.status === 'InProgress' ? '#F59E0B' : '#EF4444'
                                        }}></span>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            color: issue.status === 'Closed' ? '#10B981' : issue.status === 'InProgress' ? '#F59E0B' : '#EF4444'
                                        }}>{issue.status}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
