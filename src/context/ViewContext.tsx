'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Role = 'SUPERADMIN' | 'ADMIN' | 'CANDIDATE' | 'WORKER' | 'SOCIAL_MEDIA';
type WorkerType = 'BOOTH_MANAGER' | 'PANNA_PRAMUKH' | 'FIELD' | 'SOCIAL_CENTRAL' | 'CENTRAL_MANAGER' | 'CENTRAL_DESIGNER' | 'CENTRAL_EDITOR' | 'CENTRAL_MONITOR' | null;

interface ViewContextType {
    effectiveRole: Role;
    effectiveWorkerType: WorkerType;
    simulationPersona?: { name: string; image: string | null };
    setEffectiveRole: (role: Role, workerType?: WorkerType, persona?: { name: string; image: string | null }, redirectTo?: string) => void;
    isSimulating: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const realRole = (session?.user as any)?.role as Role;
    const realWorkerType = (session?.user as any)?.workerType as WorkerType;

    const [effectiveRole, setEffectiveRoleState] = useState<Role>('CANDIDATE');
    const [effectiveWorkerType, setEffectiveWorkerTypeState] = useState<WorkerType>(null);
    const [simulationPersona, setSimulationPersona] = useState<{ name: string; image: string | null } | undefined>(undefined);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        if (realRole) {
            // Read from Cookie for server-side persistence
            const cookieValue = document.cookie
                .split('; ')
                .find(row => row.startsWith('effectiveRole='))
                ?.split('=')[1] as Role;

            const workerTypeCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('effectiveWorkerType='))
                ?.split('=')[1] as WorkerType;

            const personaCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('simulationPersona='))
                ?.split('=')[1];

            if (cookieValue && (realRole === 'SUPERADMIN' || realRole === 'ADMIN')) {
                setEffectiveRoleState(cookieValue);
                setEffectiveWorkerTypeState(workerTypeCookie || null);
                if (personaCookie) {
                    try { setSimulationPersona(JSON.parse(decodeURIComponent(personaCookie))); } catch (e) { }
                }
                setIsSimulating(cookieValue !== realRole || !!(workerTypeCookie && workerTypeCookie !== realWorkerType) || !!personaCookie);
            } else {
                setEffectiveRoleState(realRole);
                setEffectiveWorkerTypeState(realWorkerType || null);
                setSimulationPersona(undefined);
                setIsSimulating(false);
            }
        }
    }, [realRole, realWorkerType]);

    const setEffectiveRole = (role: Role, workerType?: WorkerType, persona?: { name: string; image: string | null }, redirectTo?: string) => {
        setEffectiveRoleState(role);
        setEffectiveWorkerTypeState(workerType || null);
        setSimulationPersona(persona);

        // Set cookies with 7 days expiry
        const date = new Date();
        date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
        document.cookie = `effectiveRole=${role}; expires=${date.toUTCString()}; path=/`;

        if (workerType) {
            document.cookie = `effectiveWorkerType=${workerType}; expires=${date.toUTCString()}; path=/`;
        } else {
            document.cookie = `effectiveWorkerType=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        }

        if (persona) {
            document.cookie = `simulationPersona=${encodeURIComponent(JSON.stringify(persona))}; expires=${date.toUTCString()}; path=/`;
        } else {
            document.cookie = `simulationPersona=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        }

        setIsSimulating(role !== realRole || !!(workerType && workerType !== realWorkerType) || !!persona);

        if (redirectTo) {
            window.location.href = redirectTo;
        } else {
            window.location.reload();
        }
    };

    return (
        <ViewContext.Provider value={{ effectiveRole, effectiveWorkerType, simulationPersona, setEffectiveRole, isSimulating }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (context === undefined) {
        return {
            effectiveRole: 'CANDIDATE' as Role,
            effectiveWorkerType: null as WorkerType,
            setEffectiveRole: () => { },
            isSimulating: false
        };
    }
    return context;
}
