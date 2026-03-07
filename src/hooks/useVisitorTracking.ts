import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useVisitorTracking() {
    const location = useLocation();

    useEffect(() => {
        const logVisit = async () => {
            try {
                // We use a simple insert. RLS "Anyone can insert" handles this.
                const { error } = await (supabase as any)
                    .from("page_views")
                    .insert({
                        path: location.pathname,
                        // viewer_id will be handled by Supabase auth.uid() if logged in
                        // viewer_ip can be added but often requires a proxy or edge function
                    });

                if (error) {
                    // Silent fail for tracking to not disturb user experience
                    console.warn("Tracking error:", error.message);
                }
            } catch (e) {
                console.warn("Tracking failed anonymously");
            }
        };

        logVisit();
    }, [location.pathname]);
}
