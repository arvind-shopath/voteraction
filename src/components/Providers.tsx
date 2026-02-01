'use client';

import { SessionProvider } from "next-auth/react";
import { ViewProvider } from "@/context/ViewContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ViewProvider>
                {children}
            </ViewProvider>
        </SessionProvider>
    );
}
