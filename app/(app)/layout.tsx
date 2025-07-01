'use client';

import GlobalNavigationWrapper from "@/components/layout/GlobalNavigationWrapper";
import React, { useState, useEffect } from "react";
import ToolbarActions from '@/components/ToolbarActions';
import { Toaster } from 'sonner';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMinimized, setIsMinimized] = useState(false);

    // Persist minimize state in localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar-minimized');
        if (savedState === 'true') {
            setIsMinimized(true);
        }
    }, []);

    const toggleMinimize = () => {
        const newState = !isMinimized;
        setIsMinimized(newState);
        localStorage.setItem('sidebar-minimized', newState.toString());
    };

    return (
        <div className="app-layout">
            <GlobalNavigationWrapper isMinimized={isMinimized} />
            <main className="main-content-area">
                <div className="top-toolbar">
                    <ToolbarActions 
                        isMinimized={isMinimized}
                        onToggleMinimize={toggleMinimize}
                    />
                </div>
                <div className="app-content">{children}</div>
            </main>
            <Toaster />
        </div>
    );
} 