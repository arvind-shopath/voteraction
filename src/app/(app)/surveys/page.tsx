import React from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, PieChart } from 'lucide-react';

export default function SurveysPage() {
    const votersMood = [
        { label: 'समर्थन (Support)', value: 42, color: 'var(--success)' },
        { label: 'विरोध (Oppose)', value: 28, color: 'var(--danger)' },
        { label: 'अनिर्णीत (Undecided)', value: 30, color: 'var(--warning)' },
    ];

    const topIssues = [
        { name: 'बेरोजगारी', percentage: 35 },
        { name: 'महंगाई', percentage: 25 },
        { name: 'सड़क एवं बिजली', percentage: 20 },
        { name: 'भ्रष्टाचार', percentage: 15 },
        { name: 'अन्य', percentage: 5 },
    ];

    const swingBooths = [
        { booth: 14, margin: -2, risk: 'High' },
        { booth: 45, margin: 3, risk: 'Medium' },
        { booth: 102, margin: -5, risk: 'High' },
        { booth: 22, margin: 1, risk: 'Medium' },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>सर्वेक्षण एवं जनभावना</h1>

            <div className="grid-2">
                {/* Mood Chart */}
                <div className="card" style={{ background: 'white' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieChart size={20} /> मतदाता का मूड (वर्तमान)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {votersMood.map((item) => (
                            <div key={item.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                                    <span>{item.label}</span>
                                    <span style={{ fontWeight: '700' }}>{item.value}%</span>
                                </div>
                                <div style={{ width: '100%', height: '12px', background: '#F3F4F6', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${item.value}%`, height: '100%', background: item.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '24px', padding: '12px', background: '#F0F9FF', borderRadius: '6px', fontSize: '13px', color: '#0369A1' }}>
                        <strong>सुझाव:</strong> अनिर्णीत (Undecided) वोटर्स पर ध्यान केंद्रित करना जीत सुनिश्चित कर सकता है।
                    </div>
                </div>

                {/* Top Issues Chart */}
                <div className="card" style={{ background: 'white' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>मुख्य चुनावी मुद्दे</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {topIssues.map((issue) => (
                            <div key={issue.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '100px', fontSize: '13px' }}>{issue.name}</div>
                                <div style={{ flex: 1, height: '24px', background: '#F3F4F6', borderRadius: '4px', position: 'relative' }}>
                                    <div style={{ width: `${issue.percentage}%`, height: '100%', background: '#6366F1', borderRadius: '4px' }} />
                                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: '700', color: issue.percentage > 10 ? 'white' : 'var(--text-primary)' }}>
                                        {issue.percentage}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '24px' }} className="card">
                <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} /> स्विंग बूथ (Swaying Booths) - इन पर ध्यान दें
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '12px' }}>बूथ नंबर</th>
                            <th style={{ padding: '12px' }}>अनुमानित बढ़त/हार (Margin)</th>
                            <th style={{ padding: '12px' }}>जोखिम स्तर</th>
                            <th style={{ padding: '12px' }}>कार्यवाही</th>
                        </tr>
                    </thead>
                    <tbody>
                        {swingBooths.map((row) => (
                            <tr key={row.booth} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px', fontWeight: '600' }}>बूथ {row.booth}</td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: row.margin > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {row.margin > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        {row.margin}%
                                    </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        background: row.risk === 'High' ? '#FEE2E2' : '#FEF3C7',
                                        color: row.risk === 'High' ? '#B91C1C' : '#92400E'
                                    }}>
                                        {row.risk === 'High' ? 'उच्च जोखिम' : 'मध्यम जोखिम'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <button style={{ color: 'var(--primary-bg)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                        रणनीति तैयार करें
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
