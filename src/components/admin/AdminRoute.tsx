import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                setIsAdmin(false);
                return;
            }

            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (data?.role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        };

        if (!loading) {
            checkAdmin();
        }
    }, [user, loading]);

    if (loading || isAdmin === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8F5F0]">
                <Loader2 className="h-8 w-8 animate-spin text-[#B79A63]" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/partner/auth" replace />;
    }

    if (!isAdmin) {
        // Redirect non-admins to their dashboard or home
        return <Navigate to="/partner/dashboard" replace />;
    }

    return <>{children}</>;
}
