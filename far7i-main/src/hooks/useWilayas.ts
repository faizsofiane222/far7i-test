import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Wilaya {
    id: string; // UUID
    code: string; // e.g. "16"
    name: string; // e.g. "Alger"
}

export function useWilayas() {
    const [wilayas, setWilayas] = useState<Wilaya[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchWilayas() {
            try {
                setLoading(true);
                const { data, error: supabaseError } = await supabase
                    .from("wilayas")
                    .select("id, code, name")
                    .order("code", { ascending: true });

                if (supabaseError) throw supabaseError;
                setWilayas(data || []);
            } catch (e: any) {
                console.error("Error fetching wilayas:", e);
                setError(e);
            } finally {
                setLoading(false);
            }
        }

        fetchWilayas();
    }, []);

    return { wilayas, loading, error };
}
