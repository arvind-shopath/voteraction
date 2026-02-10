'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileType, AlertTriangle, CheckCircle, Info, Tent, RefreshCw, Trash2, Clock, Loader2, Filter, Settings, X } from 'lucide-react';
import { getAssemblies } from '@/app/actions/admin';

export default function ImportVotersPage() {
    const [files, setFiles] = useState<FileList | null>(null);
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [selectedAssemblyId, setSelectedAssemblyId] = useState<string>('');
    const [selectedState, setSelectedState] = useState<string>('');
    const [boothNumber, setBoothNumber] = useState<string>('');
    const [boothName, setBoothName] = useState<string>('');
    const [commonAddress, setCommonAddress] = useState<string>('');
    const [expectedVoters, setExpectedVoters] = useState<string>('');
    const [startPage, setStartPage] = useState<string>('');
    const [endPage, setEndPage] = useState<string>('');
    const [queue, setQueue] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Bulk Import Management
    const [pendingFiles, setPendingFiles] = useState<any[]>([]);
    const [isUploadingAll, setIsUploadingAll] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    // Edit Modal State
    const [editingJob, setEditingJob] = useState<any>(null);
    const [editBoothNumber, setEditBoothNumber] = useState('');
    const [editBoothName, setEditBoothName] = useState('');
    const [editCommonAddress, setEditCommonAddress] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        async function fetchAssemblies() {
            const data = await getAssemblies();
            setAssemblies(data);
        }
        fetchAssemblies();
        fetchQueue();

        const interval = setInterval(fetchQueue, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    // Filter assemblies by state
    const filteredAssemblies = selectedState
        ? assemblies.filter(a => a.state === selectedState)
        : assemblies;

    // No auto-selection logic needed here to keep it empty
    useEffect(() => {
        if (!filteredAssemblies.find(a => a.id.toString() === selectedAssemblyId)) {
            setSelectedAssemblyId('');
        }
    }, [selectedState, assemblies]);

    const fetchQueue = async () => {
        try {
            const res = await fetch('/api/voters/data-import/queue');
            if (res.ok) {
                const data = await res.json();
                setQueue(data.jobs || []);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error('Failed to fetch queue', e);
        }
    };

    // Filter Queue
    const filteredQueue = queue.filter(job => {
        if (!job.assembly) return true; // Show jobs with no assembly info? mostly valid jobs have it.
        const jobAssembly = assemblies.find(a => a.id === job.assembly.id || a.id === job.assemblyId);

        // Filter by State
        if (selectedState && jobAssembly?.state !== selectedState) return false;

        // Filter by Assembly (if selected)
        if (selectedAssemblyId && jobAssembly?.id.toString() !== selectedAssemblyId) return false;

        return true;
    });

    const uniqueStates = Array.from(new Set(assemblies.map(a => a.state))).sort();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map((file, idx) => ({
                id: `${Date.now()}-${idx}`,
                file: file,
                boothNumber: boothNumber, // Auto-fill from current global if exists
                boothName: boothName,
                expectedVoters: expectedVoters,
                startPage: startPage,
                endPage: endPage
            }));
            setPendingFiles(prev => [...prev, ...newFiles]);
            // Reset central inputs to prevent confusion
            setBoothNumber('');
            setBoothName('');
            setExpectedVoters('');
            setStartPage('');
            setEndPage('');
            // Clear the actual input so same file can be selected again
            e.target.value = '';
        }
    };

    const removePendingFile = (id: string) => {
        setPendingFiles(prev => prev.filter(f => f.id !== id));
    };

    const updatePendingFile = (id: string, field: string, value: string) => {
        setPendingFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const handleStartImport = async () => {
        if (pendingFiles.length === 0 || !selectedAssemblyId) return;

        // Validation: Every file needs a booth number
        const invalid = pendingFiles.find(f => !f.boothNumber);
        if (invalid) {
            alert(`File "${invalid.file.name}" requires a Booth Number.`);
            return;
        }

        setIsUploadingAll(true);
        setUploadProgress({ current: 0, total: pendingFiles.length || 1 });

        let successCount = 0;
        let failCount = 0;

        // If it's a single file, we can treat it as a bulk of 1 or just handle it.
        // The current loop handles it fine if we ensure the metadata is correct.

        const filesToProcess = [...pendingFiles];
        // If 1 file, we sync global inputs to it just in case
        if (filesToProcess.length === 1) {
            filesToProcess[0].boothNumber = boothNumber;
            filesToProcess[0].boothName = boothName;
            filesToProcess[0].expectedVoters = expectedVoters;
            filesToProcess[0].startPage = startPage;
            filesToProcess[0].endPage = endPage;
        }

        for (let i = 0; i < filesToProcess.length; i++) {
            const item = filesToProcess[i];
            setUploadProgress({ current: i + 1, total: filesToProcess.length });

            try {
                const formData = new FormData();
                formData.append('file', item.file);
                formData.append('assemblyId', selectedAssemblyId);
                formData.append('boothNumber', item.boothNumber);
                if (item.boothName) formData.append('boothName', item.boothName);
                if (commonAddress) formData.append('commonAddress', commonAddress);
                if (item.expectedVoters) formData.append('expectedVoters', item.expectedVoters);
                if (item.startPage) formData.append('startPage', item.startPage);
                if (item.endPage) formData.append('endPage', item.endPage);

                const response = await fetch('/api/voters/data-import', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) successCount++;
                else failCount++;
            } catch (err) {
                console.error('Upload error', err);
                failCount++;
            }
        }

        alert(`Process Complete: ${successCount} files added to queue, ${failCount} failed.`);
        setPendingFiles([]);
        setBoothNumber('');
        setBoothName('');
        setExpectedVoters('');
        setStartPage('');
        setEndPage('');
        setIsUploadingAll(false);
        fetchQueue();
    };

    const handleUpdateJob = async () => {
        if (!editingJob) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/voters/data-import/queue/job?id=${editingJob.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boothNumber: editBoothNumber,
                    boothName: editBoothName,
                    commonAddress: editCommonAddress
                })
            });
            if (res.ok) {
                setEditingJob(null);
                fetchQueue();
            } else {
                alert('Update failed');
            }
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteJob = async (job: any) => {
        const msg = job.status === 'COMPLETED'
            ? `विशेष सूचना: यह एक्शन इस जॉब और इसमें अपलोड हुए सभी ${job.totalVoters} मतदाताओं को हमेशा के लिए डिलीट कर देगा। क्या आप सुनिश्चित हैं?`
            : job.status === 'PROCESSING'
                ? 'चेतावनी: यह जॉब अभी प्रोसेस हो रही है। डिलीट करने से डेटा में गड़बड़ी हो सकती है। क्या आप डिलीट करना चाहते हैं?'
                : 'क्या आप इस जॉब को डिलीट करना चाहते हैं?';

        if (!confirm(msg)) return;

        try {
            const res = await fetch(`/api/voters/data-import/queue/job?id=${job.id}`, { method: 'DELETE' });
            if (res.ok) {
                const data = await res.json();
                fetchQueue();
            } else {
                const data = await res.json();
                alert(data.error || 'Delete failed');
            }
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return '#DCFCE7'; // Green
            case 'PROCESSING': return '#DBEAFE'; // Blue
            case 'FAILED': return '#FEE2E2'; // Red
            default: return '#F3F4F6'; // Gray
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return '#166534';
            case 'PROCESSING': return '#1E40AF';
            case 'FAILED': return '#991B1B';
            default: return '#4B5563';
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Bulk Import Queue (Background)</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Upload multiple PDFs. Processed automatically.</p>
                    </div>
                    {/* State Filter - Added here as requested */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            style={{ padding: '10px 16px', paddingRight: '36px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', fontWeight: '700', appearance: 'none', cursor: 'pointer', minWidth: '160px', height: '42px' }}
                        >
                            <option value="">All States</option>
                            {uniqueStates.map((state: any) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                        <Filter size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> Updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                </div>
            </div>

            <div className="import-grid">
                {/* Upload Section */}
                <div className="card" style={{ background: 'white', padding: '24px', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Upload New Files</h3>

                    {/* Compact Grid Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>
                                Target Assembly <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select
                                value={selectedAssemblyId}
                                onChange={(e) => setSelectedAssemblyId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    background: 'white'
                                }}
                            >
                                <option value="">Select Assembly...</option>
                                {filteredAssemblies.map(a => (
                                    <option key={a.id} value={a.id}>{a.number} - {a.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Hide these fields ONLY when MULTIPLE files are selected */}
                        {pendingFiles.length <= 1 && (
                            <>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>
                                        बूथ नंबर (Booth Number) <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={boothNumber}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setBoothNumber(val);
                                            if (pendingFiles.length === 1) updatePendingFile(pendingFiles[0].id, 'boothNumber', val);
                                        }}
                                        placeholder="जैसे: 154"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #D1D5DB',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>
                                        गांव/वार्ड (Village/Ward)
                                    </label>
                                    <input
                                        type="text"
                                        value={boothName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setBoothName(val);
                                            if (pendingFiles.length === 1) updatePendingFile(pendingFiles[0].id, 'boothName', val);
                                        }}
                                        placeholder="जैसे: सुल्तानपुर या वार्ड नं. 15"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #D1D5DB',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>
                            बाकी का पता (अन्य विवरण - वैकल्पिक)
                        </label>
                        <input
                            type="text"
                            value={commonAddress}
                            onChange={(e) => setCommonAddress(e.target.value)}
                            placeholder="जैसे: ब्लॉक, तहसील या जिला"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #D1D5DB',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    {pendingFiles.length <= 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>
                                    कुल मतदाताओं की संख्या (Optional)
                                </label>
                                <input
                                    type="number"
                                    value={expectedVoters}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setExpectedVoters(val);
                                        if (pendingFiles.length === 1) updatePendingFile(pendingFiles[0].id, 'expectedVoters', val);
                                    }}
                                    placeholder="जैसे: 750"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>
                                    शुरुआत वाला पेज
                                </label>
                                <input
                                    type="number"
                                    value={startPage}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setStartPage(val);
                                        if (pendingFiles.length === 1) updatePendingFile(pendingFiles[0].id, 'startPage', val);
                                    }}
                                    placeholder="जैसे: 3"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#374151' }}>
                                    अंत वाला पेज
                                </label>
                                <input
                                    type="number"
                                    value={endPage}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setEndPage(val);
                                        if (pendingFiles.length === 1) updatePendingFile(pendingFiles[0].id, 'endPage', val);
                                    }}
                                    placeholder="जैसे: 27"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{
                        border: '2px dashed #D1D5DB',
                        borderRadius: '12px',
                        padding: '32px 20px',
                        textAlign: 'center',
                        background: '#F9FAFB',
                        cursor: 'pointer',
                        marginBottom: '20px'
                    }} onClick={() => document.getElementById('file-upload')?.click()}>
                        <Upload size={32} color="var(--primary-bg)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept=".pdf"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        {pendingFiles.length > 0 ? (
                            <div>
                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>{pendingFiles.length} Files Selected</div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Ready to configure</div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>Click to Select PDFs</div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Supports Multiple Files</div>
                            </div>
                        )}
                    </div>

                    {/* Show list ONLY when MULTIPLE files are selected */}
                    {pendingFiles.length > 1 && (
                        <div style={{ marginBottom: '24px', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ background: '#F9FAFB', padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#374151' }}>Configure Individual Files</span>
                                <button onClick={() => setPendingFiles([])} style={{ fontSize: '12px', color: '#EF4444', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Clear All</button>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {pendingFiles.map((item, index) => (
                                    <div key={item.id} style={{ padding: '16px', borderBottom: index === pendingFiles.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#111827', maxWidth: '80%', wordBreak: 'break-all' }}>
                                                {index + 1}. {item.file.name}
                                            </div>
                                            <button onClick={() => removePendingFile(item.id)} style={{ color: '#9CA3AF', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                            <div>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Booth No. *</label>
                                                <input
                                                    type="text"
                                                    value={item.boothNumber}
                                                    onChange={(e) => updatePendingFile(item.id, 'boothNumber', e.target.value)}
                                                    placeholder="e.g. 154"
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Village/Ward</label>
                                                <input
                                                    type="text"
                                                    value={item.boothName}
                                                    onChange={(e) => updatePendingFile(item.id, 'boothName', e.target.value)}
                                                    placeholder="Optional"
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Voter Count</label>
                                                <input
                                                    type="number"
                                                    value={item.expectedVoters}
                                                    onChange={(e) => updatePendingFile(item.id, 'expectedVoters', e.target.value)}
                                                    placeholder="Opt"
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Pages</label>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <input
                                                        type="number"
                                                        value={item.startPage}
                                                        onChange={(e) => updatePendingFile(item.id, 'startPage', e.target.value)}
                                                        placeholder="Start"
                                                        style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
                                                    />
                                                    <input
                                                        type="number"
                                                        value={item.endPage}
                                                        onChange={(e) => updatePendingFile(item.id, 'endPage', e.target.value)}
                                                        placeholder="End"
                                                        style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        disabled={pendingFiles.length === 0 || !selectedAssemblyId || isUploadingAll}
                        onClick={handleStartImport}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: (pendingFiles.length > 0 && selectedAssemblyId && !isUploadingAll) ? 'var(--primary-bg)' : '#E5E7EB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            cursor: (pendingFiles.length > 0 && selectedAssemblyId && !isUploadingAll) ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {isUploadingAll ? (
                            <>Uploading ({uploadProgress.current}/{uploadProgress.total})...</>
                        ) : (
                            <>Add {pendingFiles.length > 0 ? pendingFiles.length : ''} Files to Queue</>
                        )}
                    </button>
                </div>

                {/* Queue List */}
                <div className="card" style={{ background: 'white', padding: '0', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                    <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Processing Queue</h3>
                            {selectedState && <span style={{ fontSize: '12px', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '12px' }}>{selectedState}</span>}
                            {selectedAssemblyId && <span style={{ fontSize: '12px', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '12px' }}>Seat: {selectedAssemblyId}</span>}
                        </div>
                        <button onClick={() => fetchQueue()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <RefreshCw size={16} color="#64748B" />
                        </button>
                    </div>

                    {filteredQueue.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                            No jobs in queue for selected filter.
                        </div>
                    ) : (
                        <div>
                            {/* Card view for mobile */}
                            <div className="mobile-cards">
                                {filteredQueue.map((job) => (
                                    <div key={job.id} style={{
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid #E5E7EB',
                                        marginBottom: '16px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <span style={{ fontWeight: '800', fontSize: '14px', color: '#64748B' }}>#{job.id}</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => {
                                                        setEditingJob(job);
                                                        setEditBoothNumber(job.boothNumber?.toString() || '');
                                                        setEditBoothName(job.boothName || '');
                                                        setEditCommonAddress(job.commonAddress || '');
                                                    }}
                                                    style={{ padding: '8px', color: '#2563EB', background: '#EFF6FF', borderRadius: '8px', border: 'none' }}
                                                >
                                                    <Settings size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteJob(job)}
                                                    style={{ padding: '8px', color: '#EF4444', background: '#FEF2F2', borderRadius: '8px', border: 'none' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px', wordBreak: 'break-all' }}>
                                            {job.fileName}
                                            {(job.startPage || job.endPage) && (
                                                <div style={{ fontSize: '10px', color: '#2563EB', marginTop: '4px' }}>
                                                    Pages: {job.startPage || 1}-{job.endPage || 'End'}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600' }}>STATUS & PROGRESS</div>
                                                <div style={{ marginTop: '4px' }}>
                                                    {job.status === 'PROCESSING' ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <RefreshCw size={12} className="animate-spin" color="#3B82F6" />
                                                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E40AF' }}>{job.progress || 0}%</span>
                                                            </div>
                                                            <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${job.progress || 0}%`, height: '100%', background: '#3B82F6', transition: 'width 0.5s ease-out' }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '8px',
                                                            fontSize: '11px',
                                                            fontWeight: '800',
                                                            background: getStatusColor(job.status),
                                                            color: getStatusTextColor(job.status)
                                                        }}>
                                                            {job.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600' }}>VOTERS</div>
                                                <div style={{ fontWeight: '700', marginTop: '4px' }}>
                                                    {job.status === 'COMPLETED' ? job.totalVoters : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600' }}>DEFAULT VILLAGE</div>
                                                <div style={{ fontWeight: '600', color: '#475569', marginTop: '4px' }}>{job.boothName || 'Automatic'}</div>
                                            </div>
                                        </div>

                                        {/* Extracted Villages List (Mobile) */}
                                        {job.status === 'COMPLETED' && job.detectedVillages?.length > 0 && (
                                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                                                <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>DETECTION SUMMARY</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {job.detectedVillages.map((v: any, idx: number) => (
                                                        <div key={idx} style={{ fontSize: '11px', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px', border: '1px solid #A7F3D0', fontWeight: '700' }}>
                                                            {v.name}: {v.count}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {job.logs && job.logs.includes('WARNING') && (
                                            <div style={{ color: '#D97706', fontSize: '11px', marginTop: '12px', background: '#FFFBEB', padding: '8px', borderRadius: '6px', border: '1px solid #FEF3C7' }}>
                                                <AlertTriangle size={12} style={{ display: 'inline', marginRight: '6px' }} />
                                                Missing Data Detected
                                            </div>
                                        )}
                                        {job.status === 'FAILED' && job.errorMessage && (
                                            <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '12px', background: '#FEF2F2', padding: '8px', borderRadius: '6px', border: '1px solid #FEE2E2' }}>
                                                Error: {job.errorMessage}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Table view for desktop */}
                            <div className="desktop-table-wrapper">
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead style={{ background: '#F1F5F9', color: '#475569', fontWeight: '700', textAlign: 'left' }}>
                                        <tr>
                                            <th style={{ padding: '12px 24px' }}>ID</th>
                                            <th style={{ padding: '12px 24px' }}>File Name</th>
                                            <th style={{ padding: '12px 24px' }}>Status & Progress</th>
                                            <th style={{ padding: '12px 24px' }}>Voters Found</th>
                                            <th style={{ padding: '12px 24px' }}>Default Village (Fallback)</th>
                                            <th style={{ padding: '12px 24px' }}>Detection Method</th>
                                            <th style={{ padding: '12px 24px' }}>Assembly</th>
                                            <th style={{ padding: '12px 24px' }}>Time</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredQueue.map((job) => (
                                            <tr key={job.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '12px 24px', fontWeight: '600', color: '#64748B' }}>#{job.id}</td>
                                                <td style={{ padding: '12px 24px', fontWeight: '500', maxWidth: '300px', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                                                    {job.fileName}
                                                    {(job.startPage || job.endPage) && (
                                                        <div style={{ fontSize: '10px', color: '#2563EB', marginTop: '2px' }}>
                                                            Pages: {job.startPage || 1} to {job.endPage || 'End'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 24px' }}>
                                                    {job.status === 'PROCESSING' ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <RefreshCw size={12} className="animate-spin" color="#3B82F6" />
                                                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E40AF' }}>{job.progress || 0}%</span>
                                                            </div>
                                                            <div style={{ width: '120px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${job.progress || 0}%`, height: '100%', background: '#3B82F6', transition: 'width 0.5s ease-out' }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '800',
                                                            background: getStatusColor(job.status),
                                                            color: getStatusTextColor(job.status)
                                                        }}>
                                                            {job.status}
                                                        </span>
                                                    )}
                                                    {job.status === 'FAILED' && (
                                                        <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '4px', maxWidth: '150px' }}>
                                                            {job.errorMessage}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 24px', fontWeight: '700' }}>
                                                    {job.status === 'COMPLETED' ? job.totalVoters : '-'}
                                                    {job.logs && job.logs.includes('WARNING') && (
                                                        <div style={{ color: '#D97706', fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>
                                                            <AlertTriangle size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                                            Missing Data
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 24px', color: '#475569', fontWeight: '600' }}>
                                                    {job.boothName || '---'}
                                                </td>
                                                <td style={{ padding: '12px 24px' }}>
                                                    {job.status === 'COMPLETED' ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                fontWeight: '800',
                                                                color: job.boothName ? '#6B7280' : '#059669',
                                                                background: job.boothName ? '#F3F4F6' : '#ECFDF5',
                                                                padding: '2px 6px',
                                                                borderRadius: '8px',
                                                                width: 'fit-content'
                                                            }}>
                                                                {job.boothName ? 'User Defined + Auto' : 'Auto-Detected'}
                                                            </span>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                {job.detectedVillages?.map((v: any, i: number) => (
                                                                    <span key={i} style={{ fontSize: '10px', color: '#166534', fontWeight: '600' }}>
                                                                        • {v.name} ({v.count})
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ padding: '12px 24px', color: '#64748B' }}>
                                                    {job.assembly?.name}
                                                </td>
                                                <td style={{ padding: '12px 24px', color: '#94A3B8', fontSize: '11px' }}>
                                                    {new Date(job.addedAt).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => {
                                                                setEditingJob(job);
                                                                setEditBoothNumber(job.boothNumber?.toString() || '');
                                                                setEditBoothName(job.boothName || '');
                                                                setEditCommonAddress(job.commonAddress || '');
                                                            }}
                                                            style={{ padding: '6px', color: '#2563EB', background: '#EFF6FF', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteJob(job)}
                                                            style={{ padding: '6px', color: '#EF4444', background: '#FEF2F2', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .import-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                        margin-bottom: 32px;
                    }
                    .mobile-cards {
                        display: none;
                    }
                    .desktop-table-wrapper {
                        width: 100%;
                        overflow-x: auto;
                        border: 1px solid #E2E8F0;
                        border-radius: 8px;
                    }
                    .data-table {
                        min-width: 1000px;
                    }
                    
                    @media (max-width: 768px) {
                        .mobile-cards {
                            display: block;
                            padding: 12px;
                        }
                        .desktop-table-wrapper {
                            display: none;
                        }
                    }
                `}</style>
                {editingJob && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '500px',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>जॉब डेटा अपडेट करें</h3>
                                <button onClick={() => setEditingJob(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>बूथ नंबर</label>
                                <input
                                    type="text"
                                    value={editBoothNumber}
                                    onChange={(e) => setEditBoothNumber(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>गांव/वार्ड</label>
                                <input
                                    type="text"
                                    value={editBoothName}
                                    onChange={(e) => setEditBoothName(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>बाकी का पता</label>
                                <input
                                    type="text"
                                    value={editCommonAddress}
                                    onChange={(e) => setEditCommonAddress(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                                />
                            </div>

                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#64748B', marginBottom: '20px' }}>
                                <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                यहाँ डेटा अपडेट करने पर इस जॉब से जुड़े सभी मतदाताओं का डेटा भी अपने आप अपडेट हो जायेगा।
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setEditingJob(null)}
                                    style={{ flex: 1, padding: '12px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    कैंसिल
                                </button>
                                <button
                                    onClick={handleUpdateJob}
                                    disabled={isUpdating}
                                    style={{ flex: 1, padding: '12px', background: 'var(--primary-bg)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    {isUpdating ? 'अपडेट हो रहा है...' : 'डेटा सेव करें'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

