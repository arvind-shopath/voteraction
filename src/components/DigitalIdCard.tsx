import React from 'react';
import { ShieldCheck, Phone, User, QrCode } from 'lucide-react';

interface DigitalIdCardProps {
    worker: {
        name: string;
        role?: string;
        type: string;
        mobile?: string;
        image?: string;
        booth?: {
            number: number;
            name: string;
        };
        assemblyName?: string;
        id?: number;
    };
    assemblyName?: string;
    assembly?: {
        name?: string;
        themeColor?: string;
        candidateName?: string;
        candidateImageUrl?: string;
        party?: string;
        logoUrl?: string;
    } | null;
}

const DigitalIdCard: React.FC<DigitalIdCardProps> = ({ worker, assemblyName, assembly }) => {
    const getRoleName = (type: string) => {
        if (type === 'BOOTH_MANAGER') return 'बूथ अध्यक्ष';
        if (type === 'PANNA_PRAMUKH') return 'PANNA PRAMUKH';
        if (type === 'FIELD') return 'PANNA PRAMUKH';
        if (type === 'SOCIAL_MEDIA') return 'Social Media Team';
        return 'Karyakarta';
    };

    const roleName = worker.role || getRoleName(worker.type);
    const date = new Date().toLocaleDateString('en-GB');

    // Theme from assembly, fallback to orange
    const themeColor = assembly?.themeColor || '#F97316';
    const candidateName = assembly?.candidateName;
    const candidateImage = assembly?.candidateImageUrl;
    const partyName = assembly?.party || '';
    const asmName = assemblyName || assembly?.name || 'विधानसभा';

    // Booth number (use .number not .id)
    const boothDisplay = worker.booth
        ? `बूथ ${worker.booth.number}`
        : '';

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 35px -5px rgba(0,0,0,0.15), 0 10px 15px -5px rgba(0,0,0,0.08)',
            border: `1px solid ${themeColor}30`,
            margin: '0 auto 24px auto',
            fontFamily: 'sans-serif'
        }}>
            {/* Header with candidate theme */}
            <div style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 100%)`,
                height: '110px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {/* Decorative dot pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0.12,
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '18px 18px'
                }} />
                {/* Party logo if available */}
                {assembly?.logoUrl && (
                    <img
                        src={assembly.logoUrl}
                        alt={partyName}
                        style={{
                            position: 'absolute', left: '16px', top: '50%',
                            transform: 'translateY(-50%)',
                            width: '44px', height: '44px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                        }}
                    />
                )}
                <div style={{ zIndex: 1, color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '2.5px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.9 }}>
                        Official Election Pass
                    </div>
                    <div style={{ fontSize: '21px', fontWeight: '900', letterSpacing: '0.5px' }}>
                        Election 2026
                    </div>
                    {partyName && (
                        <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px', fontWeight: '600' }}>
                            {partyName}
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Image & Info */}
            <div style={{ padding: '0 24px 20px 24px', marginTop: '-50px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                {/* Worker Photo */}
                <div style={{
                    width: '100px', height: '100px',
                    borderRadius: '50%',
                    background: 'white',
                    padding: '4px',
                    margin: '0 auto 14px',
                    boxShadow: `0 8px 20px -3px ${themeColor}40`,
                    border: `3px solid ${themeColor}`
                }}>
                    <div style={{
                        width: '100%', height: '100%',
                        borderRadius: '50%',
                        background: '#E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {worker.image ? (
                            <img src={worker.image} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={48} color="#94A3B8" />
                        )}
                    </div>
                </div>

                {/* Worker Name & Role */}
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', marginBottom: '6px' }}>
                    {worker.name}
                </h2>
                <div style={{
                    display: 'inline-block',
                    padding: '5px 16px',
                    background: `${themeColor}18`,
                    color: themeColor,
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    marginBottom: '18px',
                    letterSpacing: '1px',
                    border: `1px solid ${themeColor}30`
                }}>
                    {roleName}
                </div>

                {/* Details Grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr',
                    gap: '10px', textAlign: 'left',
                    background: 'white', padding: '14px',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    {/* Booth */}
                    {boothDisplay && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${themeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                🗳️
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Booth</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{boothDisplay}</div>
                            </div>
                        </div>
                    )}
                    {/* Assembly */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={16} color="#16A34A" />
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assembly</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{asmName}</div>
                        </div>
                    </div>
                    {/* Mobile */}
                    {worker.mobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Phone size={16} color="#DB2777" />
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{worker.mobile}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Candidate Endorsement Strip */}
            {candidateName && (
                <div style={{
                    margin: '0 16px 16px 16px',
                    padding: '12px 16px',
                    background: `linear-gradient(135deg, ${themeColor}10, ${themeColor}20)`,
                    border: `1px solid ${themeColor}30`,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {/* Candidate Photo */}
                    <div style={{
                        width: '44px', height: '44px',
                        borderRadius: '50%',
                        border: `2px solid ${themeColor}`,
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: '#E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {candidateImage ? (
                            <img src={candidateImage} alt={candidateName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={22} color="#94A3B8" />
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', color: themeColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Authorized by
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>
                            {candidateName}
                        </div>
                        {partyName && (
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{partyName}</div>
                        )}
                    </div>
                    <div style={{ fontSize: '20px' }}>✅</div>
                </div>
            )}

            {/* Footer */}
            <div style={{
                background: '#1E293B',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white'
            }}>
                <div>
                    <div style={{ fontSize: '9px', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '1px' }}>Issued On</div>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>{date}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>ID</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', color: themeColor }}>
                        WK-{String(worker.id || '').padStart(4, '0')}
                    </div>
                </div>
                <QrCode size={34} color="white" style={{ opacity: 0.85 }} />
            </div>

            {/* Shine */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 60%)',
                pointerEvents: 'none', zIndex: 20
            }} />
        </div>
    );
};

export default DigitalIdCard;
