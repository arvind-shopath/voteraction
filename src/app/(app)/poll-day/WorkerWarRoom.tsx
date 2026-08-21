/**
 * 🛡️ WORKER WAR ROOM - BOOTH MONITORING
 * ISOLATED COMPONENT FOR BOOTH MANAGERS / PANNA PRAMUKHS.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Loader2, CheckCircle2, AlertOctagon, User, Phone, MapPin, TrendingUp, ChevronDown, RefreshCw } from 'lucide-react';
import { getVoters, updateVoterVotedStatus } from '@/app/actions/voters';
import { reportBoothIncident, updateBoothPollingData, getAllBooths, getMyReportedIssues } from '@/app/actions/dashboard';
import { useView } from '@/context/ViewContext';

export default function WorkerWarRoom({ boothNumber, assemblyId }: { boothNumber: number, assemblyId: number }) {
    const { effectiveWorkerType } = useView();
    const { data: session }: any = useSession();
    const workerType = effectiveWorkerType || session?.user?.workerType;

    const isFieldWorker = workerType === 'FIELD' || workerType === 'GROUND' || workerType === 'GROUND_WORKER';
    const isPanna = workerType === 'PANNA_PRAMUKH';

    const [currentBooth, setCurrentBooth] = useState(boothNumber);
    const [boothList, setBoothList] = useState<any[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [voters, setVoters] = useState<any[]>([]);
    const [parties, setParties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [myReports, setMyReports] = useState<any[]>([]);
    const [votedPartyModal, setVotedPartyModal] = useState<{ voterId: number, name: string } | null>(null);
    const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);

    // Load Booth List & Parties
    useEffect(() => {
        if (isFieldWorker) {
            getAllBooths(assemblyId).then(setBoothList);
        }
        import('@/app/actions/admin').then(m => m.getParties().then(setParties));
    }, [isFieldWorker, assemblyId]);

    const loadVoters = async (search = '') => {
        setLoading(true);
        const res = await getVoters({
            assemblyId,
            booth: currentBooth.toString(),
            search,
            pageSize: (isPanna ? 100 : 2000), // Show more for managers as requested
            pannaOnly: isPanna
        });
        setVoters(res.voters || []);
        setLoading(false);
    };

    const loadReports = async () => {
        const reports = await getMyReportedIssues(assemblyId);
        setMyReports(reports);
    };

    useEffect(() => {
        loadVoters();
        loadReports();
        const interval = setInterval(loadReports, 10000);
        return () => clearInterval(interval);
    }, [currentBooth, isPanna]);

    const autoSyncTurnout = async (updatedVoters: any[]) => {
        const votedCount = updatedVoters.filter(v => v.isVoted).length;
        const totalCount = updatedVoters.length;
        if (totalCount === 0) return;

        const turnoutPct = Math.round((votedCount / totalCount) * 100);
        await updateBoothPollingData(currentBooth, turnoutPct, assemblyId);
    };

    const handleMarkVoted = async (voter: any) => {
        if (voter.isVoted) {
            // Unmark voted - direct
            await updateVoterVotedStatus(voter.id, false);
            const newList = voters.map(v => v.id === voter.id ? { ...v, isVoted: false, votedPartyId: null } : v);
            setVoters(newList);
            autoSyncTurnout(newList);
        } else {
            // Mark voted - Ask for Party
            setSelectedPartyId(null);
            setVotedPartyModal({ voterId: voter.id, name: voter.name });
        }
    };

    const confirmVotedWithParty = async () => {
        if (!votedPartyModal || !selectedPartyId) return;
        try {
            await updateVoterVotedStatus(votedPartyModal.voterId, true, selectedPartyId);
            const newList = voters.map(v => v.id === votedPartyModal.voterId ? { ...v, isVoted: true, votedPartyId: selectedPartyId } : v);
            setVoters(newList);
            setVotedPartyModal(null);
            setSelectedPartyId(null);
            autoSyncTurnout(newList);
        } catch (error: any) {
            alert(error.message || "Failed to update status");
        }
    };

    // Calculate Party Stats for Header
    const partyStats = voters.reduce((acc: any, v: any) => {
        if (v.isVoted && v.votedPartyId) {
            acc[v.votedPartyId] = (acc[v.votedPartyId] || 0) + 1;
        }
        return acc;
    }, {});

    const [showModal, setShowModal] = useState(false);
    const [incidentDesc, setIncidentDesc] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

    const openAlertModal = () => {
        setIncidentDesc('');
        setAttachment(null);
        setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmitAlert = async () => {
        if (!incidentDesc.trim()) return;
        setReporting(true);

        try {
            let finalDesc = incidentDesc;
            if (attachment) {
                finalDesc += ` [Attachment: ${attachment.name}]`;
            }

            // Use currentBooth (number) and assemblyId with the updated reportBoothIncident
            await reportBoothIncident(currentBooth, 'Alert', `बूथ #${currentBooth} पर समस्या`, finalDesc, assemblyId);

            setReporting(false);
            setShowModal(false);
            alert("🚨 अलर्ट वार रूम को भेज दिया गया है!");
            loadReports(); // Refresh list immediately
        } catch (error) {
            console.error("Failed to report incident", error);
            setReporting(false);
            alert("त्रुटि: अलर्ट भेजने में विफल।");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* 1. BOOTH STATUS / SELECTOR CARD */}
            <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', padding: '24px', borderRadius: '32px', color: 'white', marginBottom: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={24} color="#3B82F6" />
                            {isFieldWorker ? (
                                <select
                                    value={currentBooth}
                                    onChange={(e) => setCurrentBooth(parseInt(e.target.value))}
                                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '20px', fontWeight: '900', outline: 'none' }}
                                >
                                    <option value={boothNumber} style={{ color: 'black' }}>बूथ #{boothNumber} (डिफ़ॉल्ट)</option>
                                    {boothList.map(b => (
                                        <option key={b.id} value={b.number} style={{ color: 'black' }}>बूथ #{b.number} - {b.name?.substring(0, 20)}...</option>
                                    ))}
                                </select>
                            ) : (
                                `बूथ संख्या: ${currentBooth}`
                            )}
                        </h2>
                        <p style={{ color: '#94A3B8', marginTop: '4px', fontWeight: '700' }}>
                            {isPanna ? 'पन्ना प्रमुख मोड (Assigned Voters Only)' : (isFieldWorker ? 'ग्राउंड वर्कर मोड (Multi-Booth Access)' : 'बूथ मैनेजर मोड (Live Polling)')}
                        </p>
                    </div>
                    <button
                        onClick={openAlertModal}
                        disabled={reporting}
                        style={{ background: '#EF4444', color: 'white', padding: '10px 16px', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}
                    >
                        <AlertOctagon size={18} /> अलर्ट भेजें
                    </button>
                </div>

                {/* Voter Stats */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '800', marginBottom: '4px' }}>{isPanna ? 'मेरे मतदाता' : 'कुल मतदाता'}</div>
                        <div style={{ fontSize: '28px', fontWeight: '950' }}>{voters.length}</div>
                    </div>

                    {/* Party Breakdown (Worker View) */}
                    <div style={{ flex: 1, display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 10px', scrollbarWidth: 'none' }}>
                        {Object.entries(partyStats).map(([pid, count]: any) => {
                            const p = parties.find(pt => pt.id === parseInt(pid));
                            return (
                                <div key={pid} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '12px', border: `1px solid ${p?.color || '#3B82F6'}44`, borderLeft: `3px solid ${p?.color || '#3B82F6'}`, minWidth: '80px' }}>
                                    <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700' }}>{p?.name || 'Party'}</div>
                                    <div style={{ fontSize: '16px', fontWeight: '900', color: p?.color || 'white' }}>{count}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', color: '#10B981', fontWeight: '800', marginBottom: '4px' }}>मतदान हुआ</div>
                        <div style={{ fontSize: '28px', fontWeight: '950', color: '#10B981' }}>{voters.filter(v => v.isVoted).length}</div>
                    </div>
                </div>

                {/* Recent Reports Status */}
                {myReports.length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px', fontWeight: '700' }}>ताज़ा रिपोर्ट स्टेटस:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {myReports.slice(0, 2).map((r: any) => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                    <span style={{ color: 'white', opacity: 0.9 }}>{r.title}</span>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '4px', fontWeight: '800', fontSize: '11px',
                                        background: r.status === 'Resolved' ? '#10B981' : (r.status === 'In Progress' ? '#F59E0B' : '#EF4444'),
                                        color: 'white'
                                    }}>
                                        {r.status === 'Resolved' ? '✅ हल हुआ' : (r.status === 'In Progress' ? '👁️ देखा गया' : '⏳ पेंडिंग')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. VOTER LIST */}
            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '24px' }}>
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '16px', color: '#94A3B8' }} size={20} />
                    <input
                        placeholder="नाम या मोबाइल नंबर से खोजें..."
                        value={searchTerm}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSearchTerm(val);
                            if (val.length === 0) loadVoters('');
                            else if (val.length > 2) loadVoters(val);
                        }}
                        style={{ width: '100%', padding: '14px 20px 14px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: '800', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    {/* Pending Voters Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></div>
                            <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0F172A' }}>मतदान शेष (Pending - {voters.filter(v => !v.isVoted).length})</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
                            {voters.filter(v => !v.isVoted).map(v => (
                                <VoterCard key={v.id} v={v} handleMarkVoted={handleMarkVoted} parties={parties} />
                            ))}
                        </div>
                    </div>

                    {/* Completed Voters Section */}
                    {voters.some(v => v.isVoted) && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }}></div>
                                <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0F172A' }}>मतदान पूर्ण (Completed - {voters.filter(v => v.isVoted).length})</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
                                {voters.filter(v => v.isVoted).map(v => (
                                    <VoterCard key={v.id} v={v} handleMarkVoted={handleMarkVoted} parties={parties} />
                                ))}
                            </div>
                        </div>
                    )}

                    {voters.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontWeight: '800' }}>
                            {isPanna ? 'आपके असाइन किए गए कोई मतदाता नहीं मिले।' : 'कोई मतदाता नहीं मिला।'}
                        </div>
                    )}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Loader2 className="animate-spin" size={32} color="#2563EB" />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. MODERN ALERT MODAL */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '400px',
                        borderRadius: '24px', padding: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
                                <AlertOctagon size={40} color="#EF4444" />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '950', color: '#0F172A', marginBottom: '8px' }}>समस्या रिपोर्ट करें</h3>
                            <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>
                                वार रूम को अलर्ट भेजने के लिए कृपया समस्या का विवरण लिखें। यह जानकारी तुरंत कैंडिडेट को दिखाई देगी।
                            </p>
                            <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', background: '#F1F5F9', padding: '4px 12px', borderRadius: '12px' }}>
                                रिपोर्टिंग बूथ: #{currentBooth}
                            </div>
                        </div>

                        <textarea
                            autoFocus
                            placeholder="उदाहरण: EVM मशीन खराब है, या यहाँ भीड़ जमा हो रही है..."
                            value={incidentDesc}
                            onChange={(e) => setIncidentDesc(e.target.value)}
                            style={{
                                width: '100%', minHeight: '100px', padding: '16px',
                                borderRadius: '16px', border: '2px solid #E2E8F0',
                                fontSize: '15px', fontWeight: '600', color: '#0F172A',
                                outline: 'none', resize: 'none', marginBottom: '16px',
                                background: '#F8FAFC'
                            }}
                        />

                        {/* File Upload Section */}
                        <div style={{ marginBottom: '24px', width: '100%' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
                                फोटो/वीडियो जोड़ें (Optional)
                            </label>
                            <div style={{ position: 'relative', overflow: 'hidden' }}>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    id="file-upload"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'white',
                                        border: '1px dashed #CBD5E1',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        color: '#475569'
                                    }}
                                />
                            </div>
                            {attachment && (
                                <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={12} /> फाइल चुनी गई: {attachment.name}
                                </div>
                            )}
                        </div>


                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: '#F1F5F9', color: '#64748B', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}
                            >
                                रद्द करें
                            </button>
                            <button
                                onClick={handleSubmitAlert}
                                disabled={reporting || !incidentDesc.trim()}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: '16px', border: 'none',
                                    background: incidentDesc.trim() ? '#EF4444' : '#FCA5A5',
                                    color: 'white', fontWeight: '800', cursor: incidentDesc.trim() ? 'pointer' : 'not-allowed',
                                    fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {reporting ? <Loader2 className="animate-spin" size={18} /> : 'भेजें (Send)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. VOTED PARTY SELECTION MODAL */}
            {votedPartyModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '400px',
                        borderRadius: '24px', padding: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ background: '#F0F9FF', padding: '16px', borderRadius: '50%', width: 'fit-content', margin: '0 auto 16px' }}>
                                <CheckCircle2 size={32} color="#0EA5E9" />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '950', color: '#0F172A' }}>{votedPartyModal.name}</h3>
                            <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>वोट किस पार्टी को दिया गया?</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                            {parties.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPartyId(p.id)}
                                    style={{
                                        padding: '16px 12px', borderRadius: '16px',
                                        border: selectedPartyId === p.id ? `2px solid ${p.color}` : `1px solid ${p.color}22`,
                                        background: selectedPartyId === p.id ? `${p.color}15` : `${p.color}08`,
                                        color: '#0F172A', fontWeight: '800', fontSize: '14px',
                                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                        boxShadow: selectedPartyId === p.id ? `0 4px 12px ${p.color}33` : 'none',
                                        transform: selectedPartyId === p.id ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                >
                                    {p.logo ? (
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                            <img src={p.logo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                    ) : (
                                        <div style={{ width: '8px', height: '8px', background: p.color, borderRadius: '50%' }}></div>
                                    )}
                                    {p.name}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setVotedPartyModal(null)}
                                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: '#F1F5F9', color: '#64748B', fontWeight: '800', cursor: 'pointer' }}
                            >
                                रद्द करें
                            </button>
                            <button
                                onClick={confirmVotedWithParty}
                                disabled={!selectedPartyId}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: '16px', border: 'none',
                                    background: selectedPartyId ? '#4338CA' : '#E2E8F0',
                                    color: selectedPartyId ? 'white' : '#94A3B8',
                                    fontWeight: '800', cursor: selectedPartyId ? 'pointer' : 'not-allowed'
                                }}
                            >
                                सुरक्षित करें (OK)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>

    );
}

function VoterCard({ v, handleMarkVoted, parties }: { v: any, handleMarkVoted: (v: any) => void, parties: any[] }) {
    return (
        <div style={{
            padding: '14px 16px', borderRadius: '18px', border: '1px solid #F1F5F9',
            background: v.isVoted ? '#F0FDF4' : 'white',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '10px', minWidth: 0,
            transition: 'all 0.2s',
            boxShadow: v.isVoted ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.04)'
        }}>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '950', color: '#0F172A', wordBreak: 'break-word' }}>{v.name}</div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px', wordBreak: 'break-word' }}>
                    Epic: {v.epic || '-'} • Age: {v.age || '-'}
                </div>
                {v.mobile && (
                    <div style={{ marginTop: '6px' }}>
                        <a href={`tel:${v.mobile}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            textDecoration: 'none', color: '#3B82F6', fontSize: '12px', fontWeight: '800',
                            padding: '3px 8px', background: '#EFF6FF', borderRadius: '8px'
                        }}>
                            <Phone size={11} fill="#3B82F6" /> {v.mobile}
                        </a>
                    </div>
                )}
            </div>
            <button
                onClick={() => handleMarkVoted(v)}
                style={{
                    background: v.isVoted ? '#22C55E' : '#EEF2FF',
                    color: v.isVoted ? 'white' : '#4F46E5',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    flexShrink: 0,
                    minWidth: '65px'
                }}
            >
                {v.isVoted ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, border: '2px solid #4F46E5', borderRadius: '50%' }}></div>}
                <span style={{ fontSize: '10px' }}>{v.isVoted ? (parties.find(p => p.id === v.votedPartyId)?.name || 'Voted') : 'Vote?'}</span>
            </button>
        </div>
    );
}

