import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Determines the correct dashboard URL based on the user's role.
 * Queries the 'users' table (profile) to get the role.
 * Default fallback is '/partner/dashboard'.
 */
export async function getDashboardRoute(user: User): Promise<string> {
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.warn("Error fetching user role, defaulting to partner dashboard.", error);
            return "/partner/dashboard";
        }

        if (!data) {
            console.warn("No role found for user, defaulting to partner dashboard.");
            return "/partner/dashboard";
        }

        if (data.role === 'admin') {
            return "/admin/dashboard";
        }

        return "/partner/dashboard";
    } catch (e) {
        console.error("Error determining dashboard route:", e);
        return "/partner/dashboard";
    }
}
