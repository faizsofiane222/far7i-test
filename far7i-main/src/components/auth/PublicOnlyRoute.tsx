import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { getDashboardRoute } from "@/utils/auth-routing";

interface PublicOnlyRouteProps {
    children: ReactNode;
}

/**
 * PublicOnlyRoute Component
 * 
 * Protects routes that should only be accessible to unauthenticated users.
 * Redirects to /partner/dashboard if session exists.
 * Prevents authenticated users from accessing auth pages.
 */
export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
    const { session, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Only redirect after loading is complete and session exists
        if (!loading && session) {
            getDashboardRoute(session.user).then(route => {
                navigate(route, { replace: true });
            });
        }
    }, [session, loading, navigate]);

    // Show loading screen while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#B79A63]" />
                    <p className="text-lg font-medium text-[#1E1E1E]">Vérification...</p>
                </div>
            </div>
        );
    }

    // Prevent flash of content if authenticated
    if (session) {
        return null;
    }

    // User is not authenticated, render children
    return <>{children}</>;
}
