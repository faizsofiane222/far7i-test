import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";


interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user } = useAuth();
    const location = useLocation();

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            checkModerationNotifications();

            // Set up Realtime subscription for notifications
            const channel = supabase
                .channel('realtime_notifications')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to ALL events (INSERT, UPDATE, DELETE) for correct counter
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('Notification update received:', payload);
                        checkModerationNotifications(); // Refresh both unread count and latest moderation note
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);



    const checkModerationNotifications = async () => {
        try {


            // Also fetch total unread count
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id)
                .eq('read', false);

            setUnreadCount(count || 0);
        } catch (err) {
            console.error("Error checking notifications:", err);
        }
    };



    return (
        <div className="flex h-screen bg-[#F8F5F0] overflow-hidden relative">
            {/* Sidebar - fixed on the left (Desktop Only) */}
            <div className="hidden md:block h-full">
                <Sidebar
                    isCollapsed={isCollapsed}
                    onToggle={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Bar */}
                <TopBar unreadCount={unreadCount} />

                {/* Scrollable Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 font-lato text-[#1E1E1E]">
                    <div className="max-w-[1600px] w-full mx-auto pb-24 md:pb-0">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
}
