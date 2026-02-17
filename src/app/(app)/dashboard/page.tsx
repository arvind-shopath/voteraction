/* 🔒 LOCKED BY USER */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import {
  Shield, ArrowUpRight, BarChart3, TrendingUp, Filter, Users, List, PieChart, Handshake, Crown, Medal, Calendar
} from 'lucide-react';
import { getCasteAnalytics, getDashboardStats, getBoothSentimentAnalytics, getAgeAnalytics, getBoothDashboardStats, updateBoothAnalytics, getPannaDashboardStats } from '@/app/actions/dashboard';
import { getAssemblies } from '@/app/actions/admin';
import { getWorkerPointsSum, getAssemblyLeaderboard } from '@/app/actions/worker';
import { PARTY_CONFIG } from '@/lib/constants';
import DigitalIdCard from '@/components/DigitalIdCard';

export default function Dashboard() {
  const { data: session }: any = useSession();
  const { effectiveRole, effectiveWorkerType, setEffectiveRole } = useView();
  const [stats, setStats] = useState<any>(null);
  const [casteData, setCasteData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [boothSentiment, setBoothSentiment] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [isMobile, setIsMobile] = useState(false);

  const currentUser = session?.user as any;
  const realRole = currentUser?.role || 'CANDIDATE';
  const role = effectiveRole || realRole;

  const canSwitch = realRole === 'SUPERADMIN' || realRole === 'ADMIN';
  const isGlobalDisplay = role === 'SUPERADMIN' || role === 'ADMIN';

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as 'hi' | 'en' || 'hi';
    setLang(savedLang);

    getAssemblies().then(data => {
      setAssemblies(data);
      if (!canSwitch) {
        // Non-admin: Lock to their assigned assembly/campaign
        if (currentUser?.assemblyId) {
          setSelectedAssemblyId(currentUser.assemblyId);
        }
        if (currentUser?.campaignId) {
          setSelectedCampaignId(currentUser.campaignId);
        }
      }
    }).catch(err => console.error("Failed to load assemblies", err));
  }, [canSwitch, currentUser]);

  // Dynamic Theme Logic
  useEffect(() => {
    if (selectedAssemblyId && assemblies.length > 0) {
      const assembly = assemblies.find(a => a.id === selectedAssemblyId);
      if (assembly?.themeColor) {
        document.documentElement.style.setProperty('--primary-bg', assembly.themeColor);
      }
    } else if (isGlobalDisplay) {
      document.documentElement.style.setProperty('--primary-bg', '#1E293B'); // Admin Slate
    }
  }, [selectedAssemblyId, assemblies, isGlobalDisplay]);

  useEffect(() => {
    async function fetchData() {
      if (!selectedAssemblyId) return;

      setLoading(true);
      try {
        const dashboardStats = await getDashboardStats(role, selectedAssemblyId, currentUser?.id);
        setStats(dashboardStats);

        const [casteStats, sentimentStats, ageStats] = await Promise.all([
          getCasteAnalytics(selectedAssemblyId),
          getBoothSentimentAnalytics(selectedAssemblyId),
          getAgeAnalytics(selectedAssemblyId)
        ]);
        setCasteData(casteStats || []);
        setBoothSentiment(sentimentStats || []);
        setAgeData(ageStats || []);

        if (dashboardStats?.electionHistory?.length > 0) {
          const years = [...new Set(dashboardStats.electionHistory.map((h: any) => h.year.toString()))] as string[];
          setActiveHistoryTab(years[0]);
        } else if (dashboardStats?.historicalResults) {
          setActiveHistoryTab('Default');
        }
      } catch (err) {
        console.error("Dashboard data fetch error", err);
      } finally {
        setLoading(false);
      }
    }
    if (selectedAssemblyId) {
      fetchData();
    } else {
      setLoading(false);
      setStats(null);
    }
  }, [selectedAssemblyId, role]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
      <div className="spinner"></div>
      <div style={{ fontWeight: '600', color: '#6B7280' }}>
        {lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading Data...'}
      </div>
    </div>
  );



  const t = {
    workspace: lang === 'hi' ? 'Candidate Workspace' : 'Candidate Workspace',
    adminView: lang === 'hi' ? 'एडमिन दृश्य (Admin View)' : 'Admin View',
    liveAnalysis: lang === 'hi' ? 'आपकी विधानसभा का लाइव विश्लेषण' : 'Live analysis of your assembly',
    globalData: lang === 'hi' ? 'किसी भी विधानसभा का रीयल-टाइम डेटा देखें' : 'View real-time data for any assembly',
    voters: lang === 'hi' ? 'कुल मतदाता' : 'Total Voters',
    booths: lang === 'hi' ? 'सक्रिय बूथ' : 'Active Booths',
    workers: lang === 'hi' ? 'पूरी टीम (कार्यकर्ता)' : 'Total Workers',
    tasks: lang === 'hi' ? 'पूरे कार्य' : 'Completed Tasks',
    boothAnalysis: lang === 'hi' ? 'बूथ विश्लेषण (Booth Analysis)' : 'Booth Analysis',
    casteAnalytics: lang === 'hi' ? 'जातिगत समीकरण (Calculated)' : 'Caste Analytics',
    ageDist: lang === 'hi' ? 'आयु वर्ग (Age Distribution)' : 'Age Distribution',
    todayStatus: lang === 'hi' ? 'आज की स्थिति (Today\'s Status)' : "Today's Status",
    topBooths: lang === 'hi' ? 'बूथ सेंटीमेंट (Top 5 Positive)' : 'Top Sentiment Booths',
    feedback: lang === 'hi' ? 'जनसंपर्क फीडबैक' : 'Jansampark Feedback',
    historicalHeader: lang === 'hi' ? 'पिछले चुनाव के आंकड़े (Historical)' : 'Historical Election Data',
    casteEquationHeader: lang === 'hi' ? 'विधानसभा का जाति समीकरण (Admin Input)' : 'Assembly Caste Equation',
    selectAssembly: lang === 'hi' ? 'विधानसभा चुनें' : 'Select Assembly'
  };

  // Safe parsing for admin inputs
  let historicalLines: any[] = [];
  try { if (stats.historicalResults) historicalLines = JSON.parse(stats.historicalResults); } catch (e) { }

  let adminCastes: any[] = [];
  try { if (stats?.casteEquation) adminCastes = JSON.parse(stats.casteEquation); } catch (e) { }

  const totalVoters = stats?.voters || 0;

  // View Selection Logic
  const isBoothIncharge = (effectiveRole === 'WORKER' && effectiveWorkerType === 'BOOTH_MANAGER') || (realRole === 'WORKER' && currentUser?.workerType === 'BOOTH_MANAGER' && !effectiveRole);
  const isPP = (effectiveRole === 'WORKER' && effectiveWorkerType === 'PANNA_PRAMUKH') || (realRole === 'WORKER' && currentUser?.workerType === 'PANNA_PRAMUKH' && !effectiveRole);

  if (isBoothIncharge) {
    return <BoothDashboardView userId={currentUser.id} lang={lang} assemblyId={selectedAssemblyId} isMobile={isMobile} />;
  }

  if (isPP) {
    return <PannaDashboardView userId={currentUser.id} lang={lang} assemblyId={selectedAssemblyId} isMobile={isMobile} />;
  }

  return (
    <div style={{ paddingBottom: '100px' }}>
      {/* Header and Assembly/Campaign selection */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Title and description */}
        <div style={{ width: isMobile ? '100%' : 'auto' }}>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            {isGlobalDisplay ? t.adminView : (selectedAssemblyId ? (() => {
              const assembly = assemblies.find(a => a.id === selectedAssemblyId);
              return `${assembly?.number || ''} ${assembly?.name || ''} विधानसभा`;
            })() : 'विधानसभा चुनें')}
          </h1>
          <p style={{
            color: '#64748B',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            {isGlobalDisplay ? t.globalData : t.liveAnalysis}
          </p>
        </div>

        {/* Global/Admin Selections */}
        {canSwitch && (
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            width: isMobile ? '100%' : 'auto'
          }}>
            {role !== 'CANDIDATE' && (
              <select
                value={selectedAssemblyId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedAssemblyId(id);
                  setSelectedCampaignId(null);

                  // If simulating, sync the identity
                  if (effectiveRole === 'CANDIDATE') {
                    const assm = assemblies.find((a: any) => a.id === id);
                    if (assm) {
                      setEffectiveRole('CANDIDATE', null, {
                        name: assm.candidateName || 'Candidate',
                        image: assm.candidateImageUrl
                      });
                    }
                  }
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  background: 'white',
                  fontWeight: '700',
                  color: '#1E293B',
                  outline: 'none',
                  flex: isMobile ? 1 : 'none'
                }}
              >
                <option value="">{t.selectAssembly}</option>
                {assemblies.map((a: any, idx: number) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.number || idx + 1})</option>
                ))}
              </select>
            )}

            {selectedAssemblyId && (
              <select
                value={selectedCampaignId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedCampaignId(id || null);
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  background: 'white',
                  fontWeight: '700',
                  color: '#1E293B',
                  outline: 'none',
                  flex: isMobile ? 1 : 'none'
                }}
              >
                <option value="">{lang === 'hi' ? 'अभियान चुनें (सभी)' : 'Select Campaign (All)'}</option>
                {assemblies.find(a => a.id === selectedAssemblyId)?.campaigns?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {isGlobalDisplay && (
              <div style={{
                display: 'flex',
                background: '#F1F5F9',
                padding: '4px',
                borderRadius: '14px',
                gap: '4px',
                width: isMobile ? '100%' : 'auto'
              }}>
                <button
                  onClick={() => setEffectiveRole(null)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: !effectiveRole ? 'white' : 'transparent',
                    color: !effectiveRole ? '#1E293B' : '#64748B',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: !effectiveRole ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  Admin View
                </button>
                <button
                  onClick={() => setEffectiveRole('CANDIDATE')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: effectiveRole === 'CANDIDATE' ? 'white' : 'transparent',
                    color: effectiveRole === 'CANDIDATE' ? '#1E293B' : '#64748B',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: effectiveRole === 'CANDIDATE' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  Simulation
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {
        !stats && !loading && (
          <div style={{ padding: '80px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginTop: '20px' }}>
            {isGlobalDisplay ? (
              <>
                <Shield size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>{lang === 'hi' ? 'कृपया विधानसभा चुनें' : 'Please Select an Assembly'}</h2>
                <p style={{ color: '#64748B', maxWidth: '400px', margin: '8px auto' }}>{lang === 'hi' ? 'डेटा और विश्लेषण देखने के लिए ऊपर दिए गए फिल्टर से विधानसभा का चुनाव करें।' : 'Select an assembly from the filter above to view live data and analysis.'}</p>
              </>
            ) : (
              <>
                <Users size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B' }}>{lang === 'hi' ? 'कैंडिडेट का चुनाव करें' : 'Select a Candidate'}</h2>
                <p style={{ color: '#64748B', maxWidth: '400px', margin: '8px auto' }}>{lang === 'hi' ? 'कैंडिडेट डैशबोर्ड देखने के लिए एक कैंडिडेट का चुनाव करें।' : 'Select a candidate campaign to view this workspace.'}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '32px', maxWidth: '1000px', margin: '32px auto 0' }}>
                  {(assemblies || []).flatMap(a => (a.campaigns || []).map((c: any) => ({ ...c, assemblyName: a.name, assemblyNumber: a.number }))).map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedAssemblyId(c.assemblyId);
                        setSelectedCampaignId(c.id);
                      }}
                      style={{ padding: '20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-bg)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                    >
                      <div style={{ width: '40px', height: '40px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary-bg)' }}>
                        {c.candidateName?.[0] || 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: '#1E293B' }}>{c.candidateName}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{c.assemblyName} ({c.assemblyNumber})</div>
                      </div>
                    </button>
                  ))}
                  {(!assemblies || assemblies.length === 0) && (
                    <div style={{ gridColumn: '1/-1', color: '#94A3B8' }}>{lang === 'hi' ? 'कोई विधानसभा/अभियान नहीं मिला।' : 'No assemblies or campaigns found.'}</div>
                  )}
                </div>
              </>
            )}
          </div>
        )
      }

      {
        stats && (
          <>
            <div className="kpi-grid" style={{ gap: '20px' }}>
              <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)', borderRadius: '20px' }}>
                <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.voters}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <div className="kpi-value" style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{totalVoters.toLocaleString('hi-IN')}</div>
                  <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                    <ArrowUpRight size={12} /> Verified
                  </div>
                </div>
              </div>
              <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.5)', borderRadius: '20px' }}>
                <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.booths}</div>
                <div className="kpi-value" style={{ color: 'white' }}>{stats.booths || 0}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>{lang === 'hi' ? 'प्रभारी नियुक्त हैं' : 'Incharge assigned'}</div>
              </div>
              <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)', borderRadius: '20px' }}>
                <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.workers}</div>
                <div className="kpi-value" style={{ color: 'white' }}>{stats.workers || 0}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>On-field active</div>
              </div>
              <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.5)', borderRadius: '20px' }}>
                <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.tasks}</div>
                <div className="kpi-value" style={{ color: 'white' }}>{stats.tasks || 0}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>{lang === 'hi' ? 'सफलता दर: 84%' : 'Success Rate: 84%'}</div>
              </div>
            </div>

            <div className="dashboard-layout">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="dashboard-subgrid">
                  <div className="card" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
                      <BarChart3 size={20} color="#2563EB" /> {t.casteAnalytics}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {casteData.slice(0, 6).map((item: any, idx: number) => {
                        const colors = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                        const w = totalVoters > 0 ? (item.count / totalVoters) * 100 : 0;
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                              <span style={{ fontWeight: '700' }}>{item.name}</span>
                              <span style={{ fontWeight: '800', color: '#64748B' }}>{item.count.toLocaleString('hi-IN')}</span>
                            </div>
                            <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                              <div style={{ width: `${w}%`, height: '100%', background: colors[idx % colors.length], borderRadius: '10px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
                      <Users size={20} color="#8B5CF6" /> {t.ageDist}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {ageData.map((item: any, idx: number) => {
                        const colors = ['#F59E0B', '#10B981', '#2563EB', '#8B5CF6', '#94A3B8'];
                        const percent = totalVoters > 0 ? Math.round((item.count / totalVoters) * 100) : 0;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: colors[idx % colors.length] }}></div>
                            <div style={{ flex: 1, fontSize: '14px', fontWeight: '700' }}>{item.range}</div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>{percent}%</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)', border: '1px solid #DBEAFE', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.1)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieChart size={20} color="#2563EB" /> {lang === 'hi' ? 'विधानसभा का जाति समीकरण' : 'Assembly Caste Equation'}
                  </h3>
                  {adminCastes.length > 0 ? (
                    <div className="caste-grid">
                      {/* Pie Chart */}
                      <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
                        <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                          {(() => {
                            let currentAngle = 0;
                            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'];
                            return adminCastes.map((c: any, idx: number) => {
                              const startAngle = currentAngle;
                              const sliceAngle = (c.percent / 100) * 360;
                              currentAngle += sliceAngle;

                              const startRad = (startAngle - 90) * (Math.PI / 180);
                              const endRad = (currentAngle - 90) * (Math.PI / 180);

                              const x1 = 100 + 90 * Math.cos(startRad);
                              const y1 = 100 + 90 * Math.sin(startRad);
                              const x2 = 100 + 90 * Math.cos(endRad);
                              const y2 = 100 + 90 * Math.sin(endRad);

                              const largeArc = sliceAngle > 180 ? 1 : 0;

                              return (
                                <path
                                  key={idx}
                                  d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={colors[idx % colors.length]}
                                  stroke="white"
                                  strokeWidth="2"
                                />
                              );
                            });
                          })()}
                          {/* Center circle for donut effect */}
                          <circle cx="100" cy="100" r="50" fill="white" />
                          <text x="100" y="95" textAnchor="middle" fontSize="14" fontWeight="700" fill="#64748B">जाति</text>
                          <text x="100" y="110" textAnchor="middle" fontSize="14" fontWeight="700" fill="#64748B">समीकरण</text>
                        </svg>
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                        {adminCastes.map((c: any, idx: number) => {
                          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'];
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: colors[idx % colors.length], flexShrink: 0 }}></div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '800', fontSize: '14px', color: '#1E293B' }}>{c.name}</div>
                                <div style={{ fontWeight: '900', fontSize: '16px', color: colors[idx % colors.length] }}>{c.percent}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94A3B8', padding: '60px 20px' }}>डेटा अनुपलब्ध</div>
                  )}
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <List size={20} color="#1E293B" /> {t.historicalHeader}
                    </h3>

                    {/* Year Tabs */}
                    {(stats?.electionHistory?.length > 0 || stats.historicalResults) && (
                      <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                        {stats?.electionHistory?.length > 0 && [...new Set(stats.electionHistory.map((h: any) => h.year.toString()))].map((year: any) => (
                          <button
                            key={year}
                            onClick={() => setActiveHistoryTab(year)}
                            style={{
                              padding: '6px 16px',
                              borderRadius: '10px',
                              border: 'none',
                              background: activeHistoryTab === year ? 'white' : 'transparent',
                              fontWeight: '700',
                              fontSize: '13px',
                              color: activeHistoryTab === year ? '#1E40AF' : '#64748B',
                              cursor: 'pointer',
                              boxShadow: activeHistoryTab === year ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="responsive-table-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                          <th style={{ textAlign: 'left', padding: '14px 16px', color: '#64748B', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'hi' ? 'पार्टी' : 'Party'}</th>
                          <th style={{ textAlign: 'left', padding: '14px 16px', color: '#64748B', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'hi' ? 'प्रत्याशी' : 'Candidate'}</th>
                          <th style={{ textAlign: 'right', padding: '14px 16px', color: '#64748B', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'hi' ? 'वोट मिले' : 'Votes Obtained'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let displayLines = [];
                          if (activeHistoryTab === 'Default') {
                            displayLines = historicalLines.map(l => ({
                              partyName: l.party,
                              candidateName: l.candidate,
                              votesReceived: l.votes
                            }));
                          } else {
                            displayLines = stats.electionHistory.filter((h: any) => h.year.toString() === activeHistoryTab);
                          }

                          const sortedLines = [...displayLines].sort((a, b) => (b.votesReceived || 0) - (a.votesReceived || 0));
                          const winner = sortedLines[0];
                          const runnerUp = sortedLines[1];
                          const winningMargin = winner && runnerUp ? (winner.votesReceived || 0) - (runnerUp.votesReceived || 0) : 0;

                          return (
                            <>
                              {sortedLines.map((line: any, idx: number) => {
                                const pConfig = stats?.partyDetails?.[line.partyName] || PARTY_CONFIG[line.partyName] || { color: '#64748B', logo: '' };
                                return (
                                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx === 0 ? '#F0FDF4' : 'white', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '18px 16px', fontWeight: '800', color: idx === 0 ? '#059669' : '#1E293B', fontSize: '15px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px' }}>
                                          {pConfig.logo ? (
                                            <img src={pConfig.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                          ) : (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pConfig.color }}></div>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {line.partyName}
                                            {idx === 0 && <span style={{ padding: '2px 8px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', borderRadius: '20px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>विजेता</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '18px 16px', fontWeight: '700', color: '#64748B', fontSize: '14px' }}>{line.candidateName}</td>
                                    <td style={{ padding: '18px 16px', fontWeight: '900', textAlign: 'right', color: idx === 0 ? '#059669' : '#10B981', fontSize: '16px' }}>{line.votesReceived?.toLocaleString('hi-IN')}</td>
                                  </tr>
                                );
                              })}
                              {displayLines.length === 0 && (
                                <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>कोई डेटा उपलब्ध नहीं</td></tr>
                              )}
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    let displayLines = [];
                    if (activeHistoryTab === 'Default') {
                      displayLines = historicalLines.map(l => ({ votesReceived: l.votes }));
                    } else {
                      displayLines = stats.electionHistory.filter((h: any) => h.year.toString() === activeHistoryTab);
                    }
                    const sortedLines = [...displayLines].sort((a, b) => (b.votesReceived || 0) - (a.votesReceived || 0));
                    const winner = sortedLines[0];
                    const runnerUp = sortedLines[1];
                    const winningMargin = winner && runnerUp ? (winner.votesReceived || 0) - (runnerUp.votesReceived || 0) : 0;

                    return winningMargin > 0 ? (
                      <div style={{ marginTop: '24px', padding: '20px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '16px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)' }}>
                          <TrendingUp size={24} color="#2563EB" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>विजयी अंतराल (Winning Margin)</div>
                          <div style={{ fontSize: '28px', fontWeight: '900', color: '#1E40AF' }}>{winningMargin.toLocaleString('hi-IN')} वोट</div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Leaderboard Card */}
                {selectedAssemblyId && <LeaderboardCard assemblyId={selectedAssemblyId} />}

                <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                    <TrendingUp size={18} color="white" /> {t.todayStatus}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>पार्टी की ताकत (Current)</div>
                      <div style={{ fontSize: '24px', fontWeight: '900' }}>{(stats.prevPartyVotes || 0).toLocaleString('hi-IN')}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>प्रत्याशी के अपने वोट</div>
                      <div style={{ fontSize: '24px', fontWeight: '900' }}>{(stats.prevCandidateVotes || 0).toLocaleString('hi-IN')}</div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                    <TrendingUp size={18} color="#059669" /> {t.topBooths}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {boothSentiment.slice(0, 5).map((booth: any, idx: number) => (
                      <div key={idx} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>बूथ #{booth.boothNumber}</div>
                        <div style={{ fontWeight: '900', color: '#10B981', fontSize: '15px' }}>{booth.support}% +</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#2563EB' }}>
                    <Shield size={18} color="#2563EB" /> {t.feedback}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.latestFeedback?.length > 0 ? (
                      <>
                        {stats.latestFeedback.map((f: any, idx: number) => (
                          <div key={idx} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '800', fontSize: '13px' }}>{f.personName}</span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '800',
                                background: f.atmosphere === 'Positive' ? '#DCFCE7' : f.atmosphere === 'Negative' ? '#FEE2E2' : '#FEF3C7',
                                color: f.atmosphere === 'Positive' ? '#166534' : f.atmosphere === 'Negative' ? '#991B1B' : '#92400E'
                              }}>{f.atmosphere === 'Positive' ? 'सकारात्मक' : f.atmosphere === 'Negative' ? 'नकारात्मक' : 'सामान्य'}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>{f.village} • {f.worker?.name || 'कार्यकर्ता'}</div>
                          </div>
                        ))}
                        <button onClick={() => window.location.href = '/jansampark'} style={{ marginTop: '12px', padding: '10px', border: '1px solid #2563EB', color: '#2563EB', background: 'white', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>रजिस्टर खोलें</button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 0', border: '2px dashed #F1F5F9', borderRadius: '12px' }}>
                        <p style={{ color: '#94A3B8', fontSize: '13px' }}>नवीनतम दौरों की रिपोर्ट देखने के लिए जनसंपर्क रजिस्टर देखें।</p>
                        <button onClick={() => window.location.href = '/jansampark'} style={{ marginTop: '12px', padding: '8px 16px', border: '1px solid var(--primary-bg)', color: 'var(--primary-bg)', background: 'white', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>रजिस्टर खोलें</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width Booth Analysis at the bottom */}
            <div className="card" style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={20} color="#2563EB" /> {t.boothAnalysis}
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }}></div> {lang === 'hi' ? 'सकारात्मक (Strong Support)' : 'Strong Support'}</span>
                  <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }}></div> {lang === 'hi' ? 'सामान्य (Neutral)' : 'Neutral'}</span>
                  <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }}></div> {lang === 'hi' ? 'नकारात्मक (Challenge)' : 'Challenge'}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '12px' }}>
                {boothSentiment.map((booth: any, idx: number) => {
                  const color = booth.support > 60 ? '#10B981' : booth.support > 40 ? '#F59E0B' : '#EF4444';
                  return (
                    <div
                      key={idx}
                      style={{
                        aspectRatio: '1',
                        background: `${color}08`,
                        border: `1.5px solid ${color}`,
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 2px 4px ${color}10`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                        e.currentTarget.style.boxShadow = `0 8px 16px ${color}20`;
                        e.currentTarget.style.background = `${color}15`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = `0 2px 4px ${color}10`;
                        e.currentTarget.style.background = `${color}08`;
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', marginBottom: '2px' }}>Booth</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: color, lineHeight: '1' }}>{booth.boothNumber}</div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: color, marginTop: '4px' }}>{booth.support}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )
      }

      <style jsx>{`
        .dashboard-layout {
           display: grid;
           grid-template-columns: minmax(0, 1fr) 350px;
           gap: 24px;
           margin-top: 24px;
        }
        .dashboard-subgrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        .caste-grid {
             display: grid;
             grid-template-columns: 300px 1fr;
             gap: 40px;
             align-items: center;
        }
        @media (max-width: 900px) {
           .dashboard-layout {
              grid-template-columns: 1fr;
           }
           .dashboard-subgrid {
              grid-template-columns: 1fr;
           }
           .caste-grid {
               grid-template-columns: 1fr;
               justify-items: center;
               gap: 24px;
           }
        }
      `}</style>
    </div >
  );
}



function BoothDashboardView({ userId, lang, assemblyId, isMobile }: { userId: number, lang: string, assemblyId: number | null, isMobile: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ historical: '', caste: '' });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getBoothDashboardStats(userId, assemblyId || undefined);
        if (res) {
          setData(res);
          setEditData({
            historical: res.historicalResults || '[]',
            caste: res.casteEquation || '[]'
          });
        } else {
          setError('बूथ की जानकारी मिल नहीं पाई। कृपया एडमिन से संपर्क करें।');
        }
      } catch (err) {
        console.error('Booth dashboard error:', err);
        setError('डेटा लोड करने में समस्या आई। कृपया पुनः प्रयास करें।');
      } finally {
        setLoading(false);
      }
    };

    // Set timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('डेटा लोड करने में बहुत समय लग रहा है। कृपया पेज रिफ्रेश करें।');
      }
    }, 5000);

    fetchData();

    return () => clearTimeout(timeoutId);
  }, [userId, assemblyId]);

  const handleSave = async () => {
    try {
      // Validate JSON
      JSON.parse(editData.historical);
      JSON.parse(editData.caste);

      await updateBoothAnalytics(data.booth.id, {
        historicalResults: editData.historical,
        casteEquation: editData.caste
      });
      alert(lang === 'hi' ? 'डेटा सेव हो गया!' : 'Data Saved!');
      setIsEditing(false);
      // Refetch data
      const res = await getBoothDashboardStats(userId, assemblyId || undefined);
      if (res) {
        setData(res);
        setEditData({
          historical: res.historicalResults || '[]',
          caste: res.casteEquation || '[]'
        });
      }
    } catch (e) {
      alert(lang === 'hi' ? 'गलत JSON फॉर्मेट!' : 'Invalid JSON format!');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '16px' }}>
      <div className="spinner"></div>
      <div style={{ fontWeight: '600', color: '#6B7280' }}>
        {lang === 'hi' ? 'बूथ डैशबोर्ड लोड हो रहा है...' : 'Loading Booth Dashboard...'}
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginTop: '40px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', marginBottom: '12px' }}>
        {error || 'बूथ की जानकारी नहीं मिली'}
      </h2>
      <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 24px' }}>
        {lang === 'hi'
          ? 'आपको बूथ मैनेजर के रूप में असाइन नहीं किया गया है। कृपया एडमिन से संपर्क करें।'
          : 'You are not assigned as a Booth Manager. Please contact admin.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '12px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
      >
        {lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
      </button>
    </div>
  );

  const t = {
    voters: lang === 'hi' ? 'बूथ मतदाता' : 'Booth Voters',
    panna: lang === 'hi' ? 'पन्ना प्रभारी' : 'Panna Pramukhs',
    tasks: lang === 'hi' ? 'मेरे पूरे कार्य' : 'Tasks Completed',
    sentiment: lang === 'hi' ? 'बूथ सेंटिमेंट (Live)' : 'Booth Sentiment',
    caste: lang === 'hi' ? 'बूथ जाति समीकरण' : 'Booth Caste Equation',
    age: lang === 'hi' ? 'आयु वर्ग' : 'Age Distribution',
    historical: lang === 'hi' ? 'पिछले चुनाव (बूथ रिकॉर्ड)' : 'Historical Votes',
    edit: lang === 'hi' ? 'डेटा एडिट' : 'Edit Data',
    save: lang === 'hi' ? 'सेव करें' : 'Save Changes'
  };

  const historical = JSON.parse(data.historicalResults || '[]');
  const adminCaste = JSON.parse(data.casteEquation || '[]');

  return (
    <div style={{ paddingBottom: '100px' }}>
      {data.worker && <DigitalIdCard worker={data.worker} assemblyName={data.assembly?.name} />}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '20px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800' }}>बूथ डैशबोर्ड (Booth #{data.booth.number})</h1>
          <p style={{ color: '#64748B' }}>{data.booth.name || 'Booth Incharge Interface'}</p>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} style={{ width: isMobile ? '100%' : 'auto', background: '#2563EB', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
          {isEditing ? (lang === 'hi' ? 'कैंसिल' : 'Cancel') : t.edit}
        </button>
      </div>

      {isEditing ? (
        <div className="card" style={{ padding: isMobile ? '20px' : '32px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: isMobile ? '14px' : '18px' }}>एनालिटिक्स डेटा अपडेट करें (JSON Format)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700' }}>{t.historical} (JSON)</label>
              <textarea rows={10} value={editData.historical} onChange={e => setEditData({ ...editData, historical: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '13px' }} placeholder='[{"party": "BJP", "votes": 450}, ...]' />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700' }}>{t.caste} (JSON)</label>
              <textarea rows={10} value={editData.caste} onChange={e => setEditData({ ...editData, caste: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '13px' }} placeholder='[{"name": "Brahmin", "percent": 25}, ...]' />
            </div>
          </div>
          <button onClick={handleSave} style={{ width: '100%', padding: '16px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>{t.save}</button>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">{t.voters}</div>
              <div className="kpi-value">{data.stats.voters}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t.panna}</div>
              <div className="kpi-value">{data.stats.pannaPramukhs}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t.tasks}</div>
              <div className="kpi-value">{data.stats.tasks}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">बूथ सेंटिमेंट</div>
              <div className="kpi-value" style={{ color: '#10B981' }}>{Math.round(((data.realTimeAnalytics.sentiment.support || 0) / (data.stats.voters || 1)) * 100)}% +</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '24px', marginTop: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Caste Section */}
              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PieChart size={20} color="#2563EB" /> {t.caste}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px' }}>
                  {/* Real-time (Calculated) */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '16px' }}>वास्तविक डेटा (Live)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {data.realTimeAnalytics.caste.slice(0, 5).map((c: any, i: number) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                            <span>{c.name}</span>
                            <span style={{ fontWeight: '800' }}>{c.count}</span>
                          </div>
                          <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${(c.count / data.stats.voters) * 100}%`, height: '100%', background: '#2563EB', borderRadius: '10px' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Manual / Admin input */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', marginBottom: '16px' }}>अनुमानित (Target)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {adminCaste.map((c: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700' }}>{c.name}</span>
                          <span style={{ fontSize: '14px', fontWeight: '900', color: '#2563EB' }}>{c.percent}%</span>
                        </div>
                      ))}
                      {adminCaste.length === 0 && <div style={{ color: '#94A3B8', fontSize: '12px' }}>डेटा सेट करें</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Section */}
              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} color="#1E293B" /> {t.historical}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '12px' }}>पार्टी</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>प्राप्त वोट</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historical.map((h: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px', fontWeight: '700' }}>{h.party}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '900', color: '#10B981' }}>{h.votes}</td>
                      </tr>
                    ))}
                    {historical.length === 0 && <tr><td colSpan={2} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>डेटा उपलब्ध नहीं</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Sentiment Card */}
              <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white' }}>
                <h3 style={{ color: 'white', marginBottom: '24px' }}>{t.sentiment}</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>पार्टी समर्थक</div>
                    <div style={{ fontSize: '24px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.support}</div>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>विरोध / अन्य</div>
                    <div style={{ fontSize: '24px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.oppose}</div>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>सामान्य (Neutral)</div>
                    <div style={{ fontSize: '24px', fontWeight: '900' }}>{data.realTimeAnalytics.sentiment.neutral}</div>
                  </div>
                </div>
              </div>

              {/* Age Card */}
              <div className="card">
                <h3 style={{ marginBottom: '20px' }}><Users size={18} /> {t.age}</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {data.realTimeAnalytics.age.map((a: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{a.range}</span>
                      <span style={{ fontWeight: '800' }}>{a.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PannaDashboardView({ userId, lang, assemblyId, isMobile }: { userId: number, lang: string, assemblyId: number | null, isMobile: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPannaDashboardStats(userId, assemblyId || undefined);
        if (res) {
          setData(res);
        } else {
          setError('पन्ना की जानकारी मिल नहीं पाई। कृपया एडमिन से संपर्क करें।');
        }
      } catch (err) {
        console.error('Panna dashboard error:', err);
        setError('डेटा लोड करने में समस्या आई। कृपया पुनः प्रयास करें।');
      } finally {
        setLoading(false);
      }
    };

    // Set timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('डेटा लोड करने में बहुत समय लग रहा है। कृपया पेज रिफ्रेश करें।');
      }
    }, 5000);

    fetchData();

    return () => clearTimeout(timeoutId);
  }, [userId, assemblyId]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '16px' }}>
      <div className="spinner"></div>
      <div style={{ fontWeight: '600', color: '#6B7280' }}>
        {lang === 'hi' ? 'पन्ना डैशबोर्ड लोड हो रहा है...' : 'Loading Panna Dashboard...'}
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginTop: '40px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', marginBottom: '12px' }}>
        {error || 'पन्ना की जानकारी नहीं मिली'}
      </h2>
      <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 24px' }}>
        {lang === 'hi'
          ? 'आपको पन्ना प्रमुख के रूप में असाइन नहीं किया गया है। कृपया बूथ मैनेजर या एडमिन से संपर्क करें।'
          : 'You are not assigned as a Panna Pramukh. Please contact your Booth Manager or Admin.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '12px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
      >
        {lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
      </button>
    </div>
  );

  const t = {
    title: lang === 'hi' ? 'मेरा पन्ना (My Page)' : 'My Page',
    greeting: lang === 'hi' ? 'पन्ना प्रमुख डैशबोर्ड' : 'Panna Pramukh Dashboard',
    liveAnalysis: lang === 'hi' ? 'आपके पन्ना का लाइव विश्लेषण' : 'Live Analysis of Your Page',
    voters: lang === 'hi' ? 'मेरे मतदाता' : 'My Voters',
    tasks: lang === 'hi' ? 'पूर्ण काम' : 'Completed Tasks',
    pending: lang === 'hi' ? 'पेंडिंग काम' : 'Pending Tasks',
    coverage: lang === 'hi' ? 'कवरेज' : 'Coverage',
    sentiment: lang === 'hi' ? 'वोटर सेंटिमेंट' : 'Voter Sentiment',
    age: lang === 'hi' ? 'आयु वर्ग' : 'Age Groups',
    caste: lang === 'hi' ? 'जाति वितरण' : 'Caste Distribution',
    actions: lang === 'hi' ? 'त्वरित कार्य' : 'Quick Actions',
    viewVoters: lang === 'hi' ? 'सभी मतदाता देखें' : 'View All Voters',
    addContact: lang === 'hi' ? 'जनसंपर्क दर्ज करें' : 'Add Contact',
    notifications: lang === 'hi' ? 'सूचनाएं' : 'Notifications'
  };

  // Extract booth info
  const boothName = data.worker?.booth?.name || 'बूथ';
  const boothNumber = data.worker?.booth?.number || data.worker?.boothId || '';

  return (
    <div style={{ paddingBottom: '100px' }}>
      {data.worker && <DigitalIdCard worker={data.worker} assemblyName={data.assembly?.name} />}
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          {boothNumber ? `${boothNumber} ${boothName}` : boothName} - {t.title}
        </h1>
        <p style={{
          color: '#64748B',
          fontSize: isMobile ? '13px' : '15px',
          fontWeight: '600'
        }}>
          {t.liveAnalysis}
        </p>
      </div>

      {/* Points Card */}
      <PointsKPICard workerId={data.worker.id} />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid #F97316' }}>
          <div className="kpi-label">{t.voters}</div>
          <div className="kpi-value">{data.stats.totalVoters}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="kpi-label">{t.tasks}</div>
          <div className="kpi-value">{data.stats.completedTasks}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #EF4444' }}>
          <div className="kpi-label">{t.pending}</div>
          <div className="kpi-value">{data.stats.pendingTasks}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <div className="kpi-label">{t.coverage}</div>
          <div className="kpi-value">{data.stats.coverage}%</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Sentiment Card */}
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={22} color="#10B981" /> {t.sentiment}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['support', 'neutral', 'oppose'].map((key) => {
                const count = data.analytics.sentiment[key] || 0;
                const percent = data.stats.totalVoters > 0 ? (count / data.stats.totalVoters) * 100 : 0;
                const color = key === 'support' ? '#10B981' : key === 'oppose' ? '#EF4444' : '#64748B';
                const label = key === 'support' ? 'सकारात्मक' : key === 'oppose' ? 'नकारात्मक' : 'सामान्य';
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', fontWeight: '700' }}>
                      <span style={{ color: '#1E293B' }}>{label}</span>
                      <span style={{ color: color }}>{count} ({Math.round(percent)}%)</span>
                    </div>
                    <div style={{ height: '10px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '10px', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Caste Distribution */}
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="#F97316" /> {t.caste}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.analytics.caste.slice(0, 5).map((c: any, i: number) => {
                const percent = data.stats.totalVoters > 0 ? (c.count / data.stats.totalVoters) * 100 : 0;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{c.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>{Math.round(percent)}%</div>
                      <div style={{ fontWeight: '900', fontSize: '16px', color: '#F97316' }}>{c.count}</div>
                    </div>
                  </div>
                );
              })}
              {data.analytics.caste.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>डेटा उपलब्ध नहीं</div>
              )}
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Age Distribution */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', color: 'white' }}>
            <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} /> {t.age}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.analytics.age.map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>{a.range}</span>
                  <span style={{ fontWeight: '900', fontSize: '18px' }}>{a.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white' }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>{t.actions}</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                onClick={() => window.location.href = '/voters?filter=my-panna'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  color: 'white',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <Users size={18} /> {t.viewVoters}
              </button>
              <button
                onClick={() => window.location.href = '/jansampark'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  color: 'white',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <Handshake size={18} /> {t.addContact}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// 🏆 COMPONENT: WORKER POINTS KPI CARD
function PointsKPICard({ workerId }: { workerId: number }) {
  const [points, setPoints] = useState(0);
  const [filterType, setFilterType] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'LIFETIME' | 'CUSTOM'>('THIS_MONTH');
  const [loading, setLoading] = useState(false);

  // Custom filter state
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchPoints();
  }, [filterType, year, month, workerId]);

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const p = await getWorkerPointsSum(workerId, {
        type: filterType,
        year: filterType === 'CUSTOM' ? year : undefined,
        month: filterType === 'CUSTOM' ? month : undefined
      });
      setPoints(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const hindiMonths = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

  return (
    <div style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderRadius: '24px', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)', marginBottom: '24px' }}>
      {/* Background Decor */}
      <Crown size={120} color="white" style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'rotate(15deg)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Medal size={20} /> आपके प्वॉइंट्स (My Points)
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>प्रदर्शन स्कोर कार्ड</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '4px', display: 'flex', gap: '4px' }}>
          <button onClick={() => setFilterType('THIS_MONTH')} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: filterType === 'THIS_MONTH' ? 'white' : 'transparent', color: filterType === 'THIS_MONTH' ? '#D97706' : 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>This Month</button>
          <button onClick={() => setFilterType('LAST_MONTH')} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: filterType === 'LAST_MONTH' ? 'white' : 'transparent', color: filterType === 'LAST_MONTH' ? '#D97706' : 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Last Month</button>
          <button onClick={() => setFilterType('LIFETIME')} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: filterType === 'LIFETIME' ? 'white' : 'transparent', color: filterType === 'LIFETIME' ? '#D97706' : 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Lifetime</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
        <div>
          {loading ? (
            <div style={{ height: '56px', display: 'flex', alignItems: 'center' }}>Loading...</div>
          ) : (
            <div style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1 }}>{points}</div>
          )}
          <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9, marginTop: '8px' }}>
            {filterType === 'LIFETIME' ? 'Total Lifetime Points' : 'Points Earned in Period'}
          </div>
        </div>

        {/* Custom Filters Dropdown */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setFilterType('CUSTOM'); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '6px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
          >
            {[currentYear, currentYear - 1].map(y => <option key={y} value={y} style={{ color: 'black' }}>{y}</option>)}
          </select>
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setFilterType('CUSTOM'); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '6px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
          >
            {hindiMonths.map((m, i) => <option key={i} value={i} style={{ color: 'black' }}>{m}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// 🏅 COMPONENT: CANDIDATE LEADERBOARD CARD
function LeaderboardCard({ assemblyId }: { assemblyId: number }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'LIFETIME' | 'CUSTOM'>('THIS_MONTH');
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchLeaderboard();
  }, [filterType, year, month, assemblyId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getAssemblyLeaderboard(assemblyId, {
        type: filterType,
        year: filterType === 'CUSTOM' ? year : undefined,
        month: filterType === 'CUSTOM' ? month : undefined
      });
      setLeaderboard(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const hindiMonths = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

  return (
    <div className="card" style={{ background: 'white' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
            <Crown size={20} color="#F59E0B" /> टॉप कार्यकर्ता (Top Performers)
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B' }}>प्वॉइंट्स और प्रदर्शन के आधार पर रैंकिंग</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: '600', color: '#475569', background: '#F8FAFC', minWidth: '100px' }}
          >
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="LIFETIME">Lifetime</option>
            <option value="CUSTOM">Custom Range</option>
          </select>

          {(filterType === 'CUSTOM' || filterType === 'THIS_MONTH' || filterType === 'LAST_MONTH') && (
            <>
              <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setFilterType('CUSTOM'); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', minWidth: '80px' }}>
                {hindiMonths.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setFilterType('CUSTOM'); }} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
                {[currentYear, currentYear - 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>कोई डेटा नहीं मिला</div>
        ) : (
          leaderboard.map((worker, index) => (
            <div key={worker.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: index === 0 ? '#FFFBEB' : '#F8FAFC', borderRadius: '12px', border: index === 0 ? '1px solid #FCD34D' : '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: index === 0 ? '#F59E0B' : index === 1 ? '#94A3B8' : index === 2 ? '#B45309' : '#E2E8F0',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px'
                }}>
                  #{index + 1}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>
                    {worker.name}
                    {index === 0 && <Crown size={12} fill="#F59E0B" color="#F59E0B" style={{ marginLeft: '6px', display: 'inline' }} />}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{worker.type} • {worker.mobile}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '900', fontSize: '16px', color: '#0F172A' }}>{worker.points}</div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Points</div>
              </div>
            </div>
          ))
        )}
        <button
          onClick={() => window.location.href = '/workers'}
          style={{ marginTop: '12px', padding: '12px', width: '100%', border: '1px dashed #E2E8F0', borderRadius: '12px', color: '#64748B', fontWeight: '600', cursor: 'pointer', background: 'transparent' }}
        >
          सभी कार्यकर्ता देखें (View All)
        </button>
      </div>
    </div>
  );
}
