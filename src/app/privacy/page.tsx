'use client';

import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#1E293B', lineHeight: '1.6' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>Privacy Policy</h1>
            <p style={{ marginBottom: '16px' }}>Last Updated: February 6, 2026</p>

            <p style={{ marginBottom: '24px' }}>
                At VoterAction, accessible from https://voteraction.com/, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by VoterAction and how we use it.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '32px', marginBottom: '16px' }}>Information We Collect</h2>
            <p style={{ marginBottom: '16px' }}>
                The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '32px', marginBottom: '16px' }}>How We Use Your Information</h2>
            <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our website</li>
                <li>Understand and analyze how you use our website</li>
                <li>Develop new products, services, features, and functionality</li>
            </ul>

            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '32px', marginBottom: '16px' }}>Contact Us</h2>
            <p style={{ marginBottom: '16px' }}>
                If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at support@voteraction.com.
            </p>
        </div>
    );
}
