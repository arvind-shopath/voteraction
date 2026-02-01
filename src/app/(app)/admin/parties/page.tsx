'use client';

import React, { useState, useEffect } from 'react';
import { getParties, createParty, deleteParty } from '@/app/actions/admin';
import { Flag, Plus, Trash2, Palette, CheckCircle2, Edit2, Upload, Loader2 } from 'lucide-react';
import { UP_PARTIES } from '@/constants/parties';

export default function PartiesPage() {
    const [parties, setParties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ name: '', color: '#1E3A8A', logo: '' });
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<any>({});
    const [uploadingLogo, setUploadingLogo] = useState(false);

    useEffect(() => {
        fetchParties();
    }, []);

    async function fetchParties() {
        setLoading(true);
        const data = await getParties();

        // If no parties in DB, prompt to seed from constants
        if (data.length === 0) {
            setParties([]);
        } else {
            setParties(data);
        }
        setLoading(false);
    }

    const handleSeed = async () => {
        setSaving(true);
        for (const p of UP_PARTIES) {
            await createParty({
                name: p.name,
                color: p.color,
                logo: p.logo
            });
        }
        fetchParties();
        setSaving(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await createParty(formData);
        setFormData({ name: '', color: '#1E3A8A', logo: '' });
        setShowAdd(false);
        fetchParties();
        setSaving(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, forEdit: boolean = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const json = await res.json();
            if (json.success) {
                if (forEdit && editingId !== null) {
                    setEditData({ ...editData, logo: json.url });
                } else {
                    setFormData({ ...formData, logo: json.url });
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleEdit = (party: any) => {
        setEditingId(party.id);
        setEditData({ name: party.name, color: party.color, logo: party.logo });
    };

    const handleSaveEdit = async (id: number) => {
        setSaving(true);
        // Update party via API (you'll need to create an updateParty action)
        await fetch('/api/parties/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editData)
        });
        setEditingId(null);
        fetchParties();
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('क्या आप वाकई इस पार्टी को हटाना चाहते हैं?')) {
            await deleteParty(id);
            fetchParties();
        }
    };

    if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>लोड हो रहा है...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>पार्टी मैनेजमेंट</h1>
                    <p style={{ color: '#6B7280' }}>एप्लीकेशन में उपलब्ध राजनीतिक दल</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {parties.length === 0 && (
                        <button
                            onClick={handleSeed}
                            disabled={saving}
                            style={{ padding: '10px 20px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                        >
                            डिफ़ॉल्ट पार्टियाँ जोड़ें
                        </button>
                    )}
                    <button
                        onClick={() => setShowAdd(true)}
                        style={{ padding: '10px 20px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} /> नई पार्टी जोड़ें
                    </button>
                </div>
            </div>

            {showAdd && (
                <div className="card" style={{ marginBottom: '32px', padding: '24px', border: '2px solid var(--primary-bg)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>नई पार्टी का विवरण</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>पार्टी का नाम</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} placeholder="उदा. भाजपा (BJP)" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>थीम कलर</label>
                                <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    style={{ width: '100%', height: '45px', padding: '2px', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>लोगो/चिन्ह</label>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input type="text" value={formData.logo} onChange={e => setFormData({ ...formData, logo: e.target.value })}
                                    style={{ flex: 1, padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} placeholder="https://..." />
                                <label style={{ padding: '12px 20px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {uploadingLogo ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                    अपलोड करें
                                    <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e)} style={{ display: 'none' }} />
                                </label>
                            </div>
                            {formData.logo && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={formData.logo} alt="Logo Preview" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', background: 'white', padding: '4px' }} />
                                    <span style={{ fontSize: '13px', color: '#64748B' }}>Logo Preview</span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '12px 20px', color: '#666', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>कैंसिल</button>
                            <button type="submit" disabled={saving} style={{ padding: '12px 24px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700' }}>सेव करें</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {parties.map((party) => (
                    <div key={party.id} className="card" style={{ padding: '20px', borderLeft: `6px solid ${editingId === party.id ? editData.color : party.color}` }}>
                        {editingId === party.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#64748B' }}>नाम</label>
                                    <input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#64748B' }}>कलर</label>
                                    <input type="color" value={editData.color} onChange={e => setEditData({ ...editData, color: e.target.value })}
                                        style={{ width: '100%', height: '40px', padding: '2px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#64748B' }}>लोगो</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" value={editData.logo} onChange={e => setEditData({ ...editData, logo: e.target.value })}
                                            style={{ flex: 1, padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }} placeholder="URL" />
                                        <label style={{ padding: '10px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            {uploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, true)} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                    {editData.logo && (
                                        <div style={{ marginTop: '8px', width: '50px', height: '50px', borderRadius: '8px', background: '#F1F5F9', padding: '6px' }}>
                                            <img src={editData.logo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '10px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>कैंसिल</button>
                                    <button onClick={() => handleSaveEdit(party.id)} disabled={saving} style={{ flex: 1, padding: '10px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>सेव</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#F1F5F9', border: '2px solid #E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {party.logo ? (
                                        <img src={party.logo} alt={party.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <Flag size={20} color={party.color} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{party.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: party.color }}></div>
                                        {party.color}
                                    </div>
                                </div>
                                <button onClick={() => handleEdit(party)} style={{ color: '#2563EB', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px' }}>
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(party.id)} style={{ color: '#EF4444', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {parties.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '80px', background: '#F9FAFB', borderRadius: '20px', border: '2px dashed #E5E7EB' }}>
                    <Flag size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
                    <div style={{ fontWeight: '700', color: '#4B5563', fontSize: '18px' }}>कोई पार्टी नहीं मिली</div>
                    <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>कृपया नई पार्टी जोड़ें या डिफ़ॉल्ट पार्टियाँ लोड करें।</p>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
