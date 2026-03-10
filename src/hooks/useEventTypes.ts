import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventType {
    id: string; // UUID
    label: string; // e.g. "Mariage"
    slug: string; // e.g. "mariage"
}

export function useEventTypes() {
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchEventTypes() {
            try {
                setLoading(true);
                const { data, error: supabaseError } = await supabase
                    .from("event_types")
                    .select("id, label, slug")
                    .eq("active", true)
                    .order("label", { ascending: true });

                if (supabaseError) throw supabaseError;
                setEventTypes(data || []);
            } catch (e: any) {
                console.error("Error fetching event types:", e);
                setError(e);
            } finally {
                setLoading(false);
            }
        }

        fetchEventTypes();
    }, []);

    return { eventTypes, loading, error };
}
