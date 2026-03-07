import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Generate or retrieve a session ID for unique visitor tracking
function getOrCreateSessionId(): string {
    const key = "far7i_visitor_session";
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
}

export function useVisitorTracking() {
    const location = useLocation();

    useEffect(() => {
        const logVisit = async () => {
            try {
                const sessionId = getOrCreateSessionId();
                const { error } = await (supabase as any)
                    .from("page_views")
                    .insert({
                        path: location.pathname,
                        visitor_session_id: sessionId,
                    });

                if (error) {
                    console.warn("Tracking error:", error.message);
                }
            } catch (e) {
                console.warn("Tracking failed anonymously");
            }
        };

        logVisit();
    }, [location.pathname]);
}
