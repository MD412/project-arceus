import GlobalNavigationWrapper from "@/components/layout/GlobalNavigationWrapper";
import React from "react";
import ToolbarActions from '@/components/ToolbarActions';
import { Toaster } from 'sonner';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-layout">
            <GlobalNavigationWrapper />
            <main className="main-content-area">
                <div className="top-toolbar">
                    <ToolbarActions />
                </div>
                <div className="app-content">{children}</div>
            </main>
            <Toaster />
        </div>
    );
} 