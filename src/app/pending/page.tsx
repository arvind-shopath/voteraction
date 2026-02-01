import Link from 'next/link';
import { Clock, ShieldAlert } from 'lucide-react';

export default function PendingPage() {
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
                    background: '#FEF3C7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                }}>
                    <Clock size={40} color="#D97706" />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginBottom: '16px' }}>प्रवेश प्रतीक्षित है</h1>
                <p style={{ color: '#64748B', lineHeight: '1.6', fontSize: '16px', marginBottom: '32px' }}>
                    नमस्ते! आपका अकाउंट सफलतापूर्वक बन गया है। सुरक्षा कारणों से, आपको एप्प का एक्सेस देने के लिए एडमिन की मंजूरी की आवश्यकता है। कृपया एडमिन के मैसेज का इंतज़ार करें।
                </p>
                <Link href="/" style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    background: '#1E293B',
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
