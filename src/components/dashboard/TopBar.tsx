import { LogOut, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "./NotificationCenter";

interface TopBarProps {
    unreadCount?: number;
}

export function TopBar({ unreadCount = 0 }: TopBarProps) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success("Déconnexion réussie");
            navigate("/partner/auth");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la déconnexion");
        }
    };

    return (
        <header className="h-16 border-b border-[#D4D2CF] bg-[#F8F5F0] px-8 flex items-center justify-end gap-6">
            <NotificationCenter unreadCount={unreadCount} onRead={() => { }} />

            <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-[#1E1E1E] hover:text-red-500 transition-colors duration-150 py-2 px-3 rounded-md hover:bg-black/5"
            >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Déconnexion</span>
            </button>
        </header>
    );
}
