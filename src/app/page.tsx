'use client';

import React from 'react';
import Link from 'next/link';
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Shield,
  Zap,
  ChevronRight,
  Database,
  BarChart3,
  Smartphone,
  Lock,
  Globe,
  Users
} from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const user = session?.user as any;
      if (user?.role === "ADMIN" || user?.role === "SUPERADMIN") {
        router.push("/admin");
      } else if (user?.status === "Active") {
        router.push("/dashboard");
      } else {
        router.push("/pending");
      }
    }
  }, [status, session, router]);

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  if (status === "loading") {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>लोड हो रहा है...</div>;
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'var(--font-inter)', overflowX: 'hidden' }}>
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow-x: hidden; width: 100%; }
        .grid-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }
        @media (max-width: 992px) {
            .grid-container { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
            .grid-container { grid-template-columns: 1fr; }
            .nav-container { padding: 12px 16px !important; }
            .hero-section { padding: 120px 20px 60px !important; }
            .footer-container { flex-direction: column !important; gap: 32px; text-align: center; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="nav-container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 5%',
        position: 'fixed',
        top: 0,
        width: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Voteraction Logo" style={{ height: '32px', width: 'auto' }} />
        </div>
        <button
          onClick={handleLoginRedirect}
          style={{
            background: '#2563EB',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '12px',
            fontWeight: '800',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
        >
          लॉगिन
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" style={{
        padding: '180px 20px 100px',
        textAlign: 'center',
        background: 'radial-gradient(circle at top, #EFF6FF 0%, #FFFFFF 100%)',
        width: '100%'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: '8px 16px',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: '700',
            color: '#2563EB',
            marginBottom: '32px',
            border: '1px solid #DBEAFE',
            boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
          }}>
            <Shield size={16} /> अधिकृत चुनावी प्रबंधन प्रणाली 2026
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 9vw, 68px)',
            fontWeight: '950',
            color: '#0F172A',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            marginBottom: '24px'
          }}>
            आपका चुनाव, <span style={{ color: '#2563EB' }}>हमारी तकनीक</span>
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 4.5vw, 20px)',
            color: '#64748B',
            lineHeight: '1.6',
            marginBottom: '40px',
            maxWidth: '650px',
            margin: '0 auto 40px'
          }}>
            MLAs और उम्मीदवारों के लिए सबसे आधुनिक डेटा एनालिटिक्स और बूथ प्रबंधन प्लेटफार्म। जीत की रणनीति अब आपके फोन पर।
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={handleLoginRedirect} style={{
              width: '100%',
              maxWidth: '280px',
              padding: '16px 32px',
              background: '#0F172A',
              color: 'white',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: '900',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              शुरुआत करें <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 5%', background: 'white', width: '100%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ color: '#2563EB', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>शक्तिशाली फीचर्स</div>
            <h2 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: '900', color: '#0F172A' }}>विजयी रणनीति के लिए टूल्स</h2>
          </div>

          <div className="grid-container">
            {[
              {
                icon: <Database size={28} color="#2563EB" />,
                title: 'एडवांस्ड वोटर डेटा',
                desc: 'जाति, उम्र और घर संख्या के आधार पर सटीक फ़िल्टरिंग और मैपिंग।'
              },
              {
                icon: <Users size={28} color="#10B981" />,
                title: 'पन्ना प्रमुख मैनेजमेंट',
                desc: 'हर कार्यकर्ता की प्रोग्रेस और सर्वे रिपोर्ट की रीयल-टाइम ट्रैकिंग।'
              },
              {
                icon: <BarChart3 size={28} color="#F59E0B" />,
                title: 'इंटेलिजेंट एनालिटिक्स',
                desc: 'बूथ-वार समर्थन और स्विंग वोटर्स का लाइव विश्लेषण डैशबोर्ड।'
              },
              {
                icon: <Smartphone size={28} color="#EC4899" />,
                title: 'मोबाइल-फर्स्ट अनुभव',
                desc: 'कार्यकर्ताओं के लिए सरल इंटरफ़ेस जिससे ग्राउंड रिपोर्टिंग हो आसान।'
              },
              {
                icon: <Lock size={28} color="#6366F1" />,
                title: 'सुरक्षित एक्सेस',
                desc: 'एडमिन द्वारा नियंत्रित एक्सेस और विधानसभा-वार डेटा सुरक्षा।'
              },
              {
                icon: <Globe size={28} color="#14B8A6" />,
                title: 'मल्टी-यूजर कोलैबोरेशन',
                desc: 'एक ही विधानसभा पर कई यूजर्स एक साथ काम कर सकते हैं।'
              },
            ].map((f, i) => (
              <div key={i} style={{
                padding: '32px',
                borderRadius: '24px',
                background: '#F8FAFC',
                border: '1px solid #F1F5F9',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', margin: 0 }}>{f.title}</h3>
                <p style={{ color: '#64748B', lineHeight: '1.6', fontSize: '15px', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 5%', borderTop: '1px solid #E2E8F0', background: 'white' }}>
        <div className="footer-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <img src="/logo.png" alt="Voteraction Logo" style={{ height: '32px', width: 'auto', marginBottom: '12px' }} />
            <div style={{ color: '#94A3B8', fontSize: '14px' }}>© 2026 Voteraction.creatiav.com | सर्वाधिकार सुरक्षित</div>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="https://creatiav.com" target="_blank" style={{ color: '#475569', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>डेवलपर: Creatiav</a>
            <a href="#" style={{ color: '#475569', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>गोपनीयता नीति</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
