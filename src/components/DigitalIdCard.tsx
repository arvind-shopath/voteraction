import React from 'react';
import { ShieldCheck, MapPin, Phone, User, QrCode } from 'lucide-react';

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
}

const DigitalIdCard: React.FC<DigitalIdCardProps> = ({ worker, assemblyName }) => {
    // Role Display Logic
    const getRoleName = (type: string) => {
        if (type === 'BOOTH_MANAGER') return 'Booth Adhyaksh';
        if (type === 'PANNA_PRAMUKH') return 'Panna Pramukh';
        if (type === 'SOCIAL_MEDIA') return 'Social Media Team';
        return 'Karyakarta';
    };

    const roleName = worker.role || getRoleName(worker.type);
    const date = new Date().toLocaleDateString('en-GB');

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '350px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(255,255,255,0.8)',
            margin: '0 auto 24px auto',
            fontFamily: 'sans-serif'
        }}>
            {/* Header / Background Pattern */}
            <div style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                height: '100px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0.1,
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                }}></div>
                <div style={{ zIndex: 1, color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Official Election Pass</div>
                    <div style={{ fontSize: '20px', fontWeight: '900' }}>Election 2026</div>
                </div>
            </div>

            {/* Profile Image & Info */}
            <div style={{ padding: '0 24px 24px 24px', marginTop: '-50px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                {/* Image Container */}
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'white',
                    padding: '4px',
                    margin: '0 auto 16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {worker.image ? (
                            <img src={worker.image} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={48} color="#94A3B8" />
                        )}
                    </div>
                </div>

                {/* Name & Role */}
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>{worker.name}</h2>
                <div style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    background: '#FEF3C7',
                    color: '#D97706',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    marginBottom: '20px',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)'
                }}>
                    {roleName}
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', textAlign: 'left', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    {worker.booth && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MapPin size={16} color="#2563EB" />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Assigned Booth</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{worker.booth.number} - {worker.booth.name}</div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={16} color="#16A34A" />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Assembly</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{assemblyName || 'Assembly Constituency'}</div>
                        </div>
                    </div>
                    {worker.mobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Phone size={16} color="#DB2777" />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Contact</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{worker.mobile}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ID Footer */}
            <div style={{
                background: '#1E293B',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white'
            }}>
                <div>
                    <div style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Issued On</div>
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QrCode size={32} color="white" style={{ opacity: 0.9 }} />
                </div>
            </div>

            {/* Shine Effect */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 60%)',
                pointerEvents: 'none',
                zIndex: 20
            }}></div>
        </div>
    );
};

export default DigitalIdCard;
