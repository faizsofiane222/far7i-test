import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication.
 * Redirects to /partner/auth if no session exists.
 * Prevents flash of unauthenticated content.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { session, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Only redirect after loading is complete and no session exists
        if (!loading && !session) {
            navigate("/partner/auth", { replace: true });
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

    // Prevent flash of content if not authenticated
    if (!session) {
        return null;
    }

    // User is authenticated, render children
    return <>{children}</>;
}
