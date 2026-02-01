'use client';

import React from 'react';
import { LogOut, User, Search, Bell, Menu, Smartphone } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import { useLayout } from '@/context/LayoutContext';
import { getAppEnvironment } from '@/lib/app-utils';
import Link from 'next/link';

interface HeaderProps {
    candidateName?: string;
    candidateImageUrl?: string | null;
}

const Header = ({ candidateName, candidateImageUrl }: HeaderProps) => {
    const { data: session }: any = useSession();
    const { effectiveRole, effectiveWorkerType, setEffectiveRole, isSimulating, simulationPersona } = useView();
    const { toggleSidebar } = useLayout();

    const userRole = session?.user?.role || 'MANAGER';
    const workerType = effectiveWorkerType || session?.user?.workerType;
    const isCentralSocial = effectiveRole === 'SOCIAL_MEDIA' && (workerType === 'SOCIAL_CENTRAL' || workerType?.startsWith('CENTRAL_'));

    const centralRoleName = workerType === 'CENTRAL_MANAGER' ? 'मैनेजर' :
        workerType === 'CENTRAL_DESIGNER' ? 'डिजाइनर' :
            workerType === 'CENTRAL_EDITOR' ? 'वीडियो एडिटर' :
                workerType === 'CENTRAL_MONITOR' ? 'मॉनिटरिंग' : 'संपादक';

    const userName = isCentralSocial ? `${centralRoleName} (App Central)` : (simulationPersona?.name || session?.user?.name || candidateName || 'यूजर');
    const userImage = simulationPersona?.image || session?.user?.image || candidateImageUrl;

    const effectiveRoleToUse = effectiveRole || userRole;
    const isSimulatingActive = isSimulating;

    const isGlobal = effectiveRoleToUse === 'ADMIN' || effectiveRoleToUse === 'SUPERADMIN';
    const displayName = isCentralSocial ? `ऐप सोशल मीडिया ${centralRoleName}` : (isSimulatingActive
        ? (effectiveRoleToUse === 'MANAGER' ? (candidateName || 'कैंडिडेट मोड') : (effectiveRoleToUse === 'WORKER' ? 'कार्यकर्ता मोड' : userName))
        : (userRole === 'SUPERADMIN' ? 'सर्वेसर्वा (Super Admin)' : userRole === 'ADMIN' ? 'सुपर एडमिन' : userName));

    const displaySub = isCentralSocial ? 'सेंट्रल कंट्रोल टावर' : (isSimulatingActive
        ? (effectiveRoleToUse === 'MANAGER' ? 'कैंडिडेट डैशबोर्ड' : 'कार्यकर्ता दृश्य')
        : (isGlobal ? 'सेंट्रल कंट्रोलर' : 'विधानसभा डैशबोर्ड'));

    return (
        <header className="header" style={{ padding: '12px 32px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                    onClick={toggleSidebar}
                    className="mobile-menu-btn"
                    style={{ background: 'transparent', border: 'none', color: '#64748B', display: 'none', cursor: 'pointer', padding: 0 }}
                >
                    <Menu size={24} />
                </button>
                <style jsx>{`
                    @media (max-width: 768px) {
                        .mobile-menu-btn { display: block !important; }
                    }
                `}</style>

                {isSimulatingActive && (
                    <span className="phase-indicator" style={{ background: '#FFF7ED', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', border: '1px solid #FFEDD5', color: '#C2410C', fontWeight: '800' }}>
                        सिमुलेशन: <span style={{ textTransform: 'uppercase' }}>{effectiveRoleToUse === 'MANAGER' ? 'कैंडिडेट' : 'कार्यकर्ता'} दृश्य</span>
                    </span>
                )}
                {!isGlobal && !isSimulatingActive && (
                    <span className="phase-indicator" style={{ background: '#F8FAFC', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', border: '1px solid #E2E8F0' }}>
                        वर्तमान चरण: <strong style={{ color: '#2563EB' }}>चुनाव प्रचार (Campaign)</strong>
                    </span>
                )}
                {/* Mobile Search Icon */}
                <div className="search-icon-mobile" style={{ display: 'none', color: '#64748B' }}>
                    <Search size={20} />
                </div>

                <div className="desktop-search" style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input suppressHydrationWarning type="text" placeholder="खोजें..." style={{ padding: '8px 16px 8px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', width: '220px', fontSize: '14px' }} />
                </div>
                <style jsx>{`
                    @media (max-width: 768px) {
                        .desktop-search { display: none !important; }
                    }
                `}</style>


            </div>

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }}>
                    <Bell size={20} color="#64748B" />
                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px solid #E2E8F0'
                    }}>
                        {userImage ? (
                            <img
                                src={userImage}
                                alt={userName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <User size={20} color="#64748B" />
                        )}
                    </div>
                    <div style={{ lineHeight: '1.2' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>
                            {displayName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>{displaySub}</div>
                    </div>
                </div>

                <div style={{ width: '1px', height: '28px', background: '#E2E8F0' }}></div>

                {getAppEnvironment() === 'WEB' && (
                    <Link
                        href="/apps"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '800',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            border: '1px solid #DBEAFE'
                        }}
                        onMouseEnter={(e: any) => e.currentTarget.style.background = '#DBEAFE'}
                        onMouseLeave={(e: any) => e.currentTarget.style.background = '#EFF6FF'}
                    >
                        <Smartphone size={16} /> डाउनलोड एप्प
                    </Link>
                )}

                <button
                    suppressHydrationWarning
                    onClick={() => signOut({ callbackUrl: '/' })}
                    style={{
                        background: '#F1F5F9',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        color: '#64748B',
                        transition: 'all 0.2s'
                    }}
                    title="लॉग आउट करें"
                    onMouseEnter={(e: any) => e.currentTarget.style.background = '#FEE2E2'}
                    onMouseLeave={(e: any) => e.currentTarget.style.background = '#F1F5F9'}
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
