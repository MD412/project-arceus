import GlobalNavigationWrapper from "@/components/layout/GlobalNavigationWrapper";
import React from "react";
import ToolbarActions from '@/components/ToolbarActions';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-layout">
            <GlobalNavigationWrapper />
            <div className="main-content-area">
                <div className="top-toolbar">
                    <ToolbarActions />
                    <div className="toolbar-status"></div>
                </div>
                <main id="main-content" className="app-content">
                    {children}
                </main>
            </div>
        </div>
    );
} 