'use client';

/* 🔒 LOCKED BY USER */
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { getAssemblies, getUsers } from '@/app/actions/admin';
import BoothDashboardView from './BoothDashboardView';
import PannaDashboardView from './PannaDashboardView';
import CandidateDashboardView from './CandidateDashboardView';

export default function Dashboard() {
  const { data: session }: any = useSession();
  const { effectiveRole, effectiveWorkerType, setEffectiveRole } = useView();
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [candidateUsers, setCandidateUsers] = useState<any[]>([]);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [isMobile, setIsMobile] = useState(false);

  const currentUser = session?.user as any;
  const realRole = currentUser?.role || 'CANDIDATE';
  // effectiveRole is only set for SUPERADMIN - for all others we use their actual role
  const role = realRole === 'SUPERADMIN' ? (effectiveRole || realRole) : realRole;
  const userId = Number(currentUser?.id);

  // Only SUPERADMIN can switch views
  const canSwitch = realRole === 'SUPERADMIN';
  const isGlobalDisplay = role === 'SUPERADMIN' && !effectiveRole;

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as 'hi' | 'en' || 'hi';
    setLang(savedLang);

    Promise.all([getAssemblies(), getUsers()]).then(([aData, uData]) => {
      setAssemblies(aData);
      setCandidateUsers(uData.filter((u: any) => u.role === 'CANDIDATE'));
      if (!canSwitch) {
        if (currentUser?.assemblyId) {
          setSelectedAssemblyId(currentUser.assemblyId);
        }
        if (currentUser?.campaignId) {
          setSelectedCampaignId(currentUser.campaignId);
        }
      }
    }).catch(err => console.error("Failed to load dashboard initial data", err))
      .finally(() => setLoading(false));
  }, [canSwitch, currentUser]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic Theme Logic
  useEffect(() => {
    if (selectedAssemblyId && assemblies.length > 0) {
      const assembly = assemblies.find(a => a.id === selectedAssemblyId);
      if (assembly?.themeColor) {
        document.documentElement.style.setProperty('--primary-bg', assembly.themeColor);
      }
    } else if (isGlobalDisplay) {
      document.documentElement.style.setProperty('--primary-bg', '#1E293B');
    }
  }, [selectedAssemblyId, assemblies, isGlobalDisplay]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
      <div className="spinner"></div>
      <div style={{ fontWeight: '600', color: '#6B7280' }}>
        {lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading Data...'}
      </div>
    </div>
  );

  // View Selection Logic - use REAL session role, not effective role for workers
  const sessionRole = realRole;
  const sessionWorkerType = currentUser?.workerType;
  // effectiveWorkerType only applies for SUPERADMIN simulation
  const workerType = (realRole === 'SUPERADMIN' ? effectiveWorkerType : null) || sessionWorkerType;

  const isBoothIncharge = sessionRole === 'WORKER' && workerType === 'BOOTH_MANAGER';
  const isPP = sessionRole === 'WORKER' && (workerType === 'PANNA_PRAMUKH' || workerType === 'FIELD');

  if (isBoothIncharge) {
    return (
      <BoothDashboardView
        userId={userId}
        lang={lang}
        assemblyId={selectedAssemblyId}
        isMobile={isMobile}
        assemblyName={assemblies.find(a => a.id === selectedAssemblyId)?.name}
      />
    );
  }

  if (isPP) {
    return (
      <PannaDashboardView
        userId={userId}
        lang={lang}
        assemblyId={selectedAssemblyId}
        isMobile={isMobile}
        assemblyName={assemblies.find(a => a.id === selectedAssemblyId)?.name}
      />
    );
  }

  return (
    <CandidateDashboardView
      role={role}
      selectedAssemblyId={selectedAssemblyId}
      selectedCampaignId={selectedCampaignId}
      setSelectedAssemblyId={setSelectedAssemblyId}
      setSelectedCampaignId={setSelectedCampaignId}
      assemblies={assemblies}
      candidateUsers={candidateUsers}
      canSwitch={canSwitch}
      isGlobalDisplay={isGlobalDisplay}
      lang={lang}
      isMobile={isMobile}
      currentUser={currentUser}
      setEffectiveRole={setEffectiveRole}
      effectiveRole={effectiveRole}
      realRole={realRole}
    />
  );
}
