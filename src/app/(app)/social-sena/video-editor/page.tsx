'use client';

import { useSession } from 'next-auth/react';
import { useView } from '@/context/ViewContext';
import CentralWorkflowView from '../CentralWorkflowView';
import { useState, useEffect } from 'react';

export default function VideoEditorPage() {
    const [lang, setLang] = useState('hi');
    useEffect(() => {
        const stored = localStorage.getItem('app_lang');
        if (stored) setLang(stored);
    }, []);

    return <CentralWorkflowView lang={lang} />;
}
