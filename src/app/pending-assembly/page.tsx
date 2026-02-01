import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';

export default function PendingAssemblyPage() {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F8FAFC',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '20px',
            textAlign: 'center'
        }}>
            <div style={{
                background: 'white',
                padding: '48px',
                borderRadius: '32px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                maxWidth: '500px'
            }}>
                <img src="/logo.png" alt="Voteraction" style={{ height: '36px', marginBottom: '32px' }} />
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#DBEAFE',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                }}>
                    <LayoutGrid size={40} color="#2563EB" />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginBottom: '16px' }}>विधानसभा असाइन नहीं है</h1>
                <p style={{ color: '#64748B', lineHeight: '1.6', fontSize: '16px', marginBottom: '32px' }}>
                    आपका अकाउंट सक्रिय है, लेकिन अभी तक आपको कोई विधानसभा असाइन नहीं की गई है। कृपया एडमिन से संपर्क करें ताकि वे आपको आपकी संबंधित विधानसभा का डैशबोर्ड प्रदान कर सकें।
                </p>
                <Link href="/" style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    background: '#2563EB',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: '800'
                }}>
                    वापस होम पर जाएँ
                </Link>
            </div>
        </div>
    );
}
