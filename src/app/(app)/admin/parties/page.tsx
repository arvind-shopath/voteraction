'use client';

import React, { useState, useEffect } from 'react';
import { getParties, createParty, deleteParty } from '@/app/actions/admin';
import { Flag, Plus, Trash2, Palette, CheckCircle2, Edit2, Upload, Loader2 } from 'lucide-react';
import { UP_PARTIES } from '@/constants/parties';

export default function PartiesPage() {
    const [parties, setParties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ name: '', color: '#1E3A8A', logo: '', state: 'National', sortOrder: 0 });
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<any>({ name: '', color: '#1E3A8A', logo: '', state: 'National', sortOrder: 0 });
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
        const payload: any = {
            name: formData.name,
            color: formData.color,
            logo: formData.logo,
            state: formData.state,
            sortOrder: parseInt(formData.sortOrder.toString()) || 0
        };
        await createParty(payload);
        setFormData({ name: '', color: '#1E3A8A', logo: '', state: 'National', sortOrder: 0 });
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
        setEditData({
            name: party.name,
            color: party.color,
            logo: party.logo,
            state: party.state || 'National',
            sortOrder: party.sortOrder || 0
        });
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

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Loader2 className="animate-spin" size={40} color="#2563EB" />
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-0.5px' }}>पार्टी मैनेजमेंट</h1>
                    <p style={{ color: '#64748B', marginTop: '4px', fontSize: '16px' }}>एप्लीकेशन में उपलब्ध राजनीतिक दल और उनका क्रम</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={() => setShowAdd(true)}
                        style={{ padding: '12px 24px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <Plus size={20} /> नई पार्टी जोड़ें
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
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>राज्य/स्कोप (State/Scope)</label>
                                <select
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white' }}
                                >
                                    <option value="National">National (सभी जगह दिखेगी)</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh (सिर्फ UP)</option>
                                    <option value="Bihar">Bihar (सिर्फ बिहार)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>क्रम (Sort Order)</label>
                                <input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px' }} placeholder="उदा. 12" />
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {parties.map((party) => (
                    <div key={party.id} className="card" style={{
                        padding: '24px',
                        borderLeft: `6px solid ${editingId === party.id ? editData.color : party.color}`,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: editingId === party.id ? '400px' : 'auto',
                        justifyContent: 'center'
                    }}>
                        {editingId === party.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#64748B' }}>राज्य</label>
                                        <select value={editData.state} onChange={e => setEditData({ ...editData, state: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }}>
                                            <option value="National">National</option>
                                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                                            <option value="Bihar">Bihar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#64748B' }}>क्रम</label>
                                        <input type="number" value={editData.sortOrder} onChange={e => setEditData({ ...editData, sortOrder: parseInt(e.target.value) || 0 })}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#64748B' }}>लोगो (URL/Upload)</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" value={editData.logo} onChange={e => setEditData({ ...editData, logo: e.target.value })}
                                            style={{ flex: 1, padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }} placeholder="URL" />
                                        <label style={{ padding: '10px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            {uploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, true)} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>कैंसिल</button>
                                    <button onClick={() => handleSaveEdit(party.id)} disabled={saving} style={{ flex: 1, padding: '12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>सेव</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'white', border: '2px solid #F1F5F9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                        {party.logo ? (
                                            <img src={party.logo} alt={party.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                                        ) : (
                                            <Flag size={26} color={party.color} />
                                        )}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#1E293B' }}>{party.name}</div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: party.color }}></div>
                                            {party.color}
                                        </div>
                                        <div style={{ fontSize: '10px', fontWeight: '900', padding: '2px 8px', background: party.state === 'National' ? '#EFF6FF' : '#F8FAFC', color: party.state === 'National' ? '#2563EB' : '#475569', borderRadius: '4px', textTransform: 'uppercase' }}>
                                            {party.state || 'National'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => handleEdit(party)} style={{ color: '#2563EB', padding: '10px', background: '#F0F9FF', border: 'none', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.2s' }}>
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(party.id)} style={{ color: '#EF4444', padding: '10px', background: '#FEF2F2', border: 'none', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.2s' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
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
