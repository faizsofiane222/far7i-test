import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export type EventType = 
  | 'profile_view' 
  | 'service_view' 
  | 'contact_whatsapp' 
  | 'contact_viber' 
  | 'contact_phone' 
  | 'social_click';

export const useAnalytics = () => {
  const track = useCallback(async (
    providerId: string, 
    eventType: EventType, 
    serviceId?: string, 
    visitorId?: string
  ) => {
    try {
      const { error } = await supabase.rpc('track_event', {
        p_provider_id: providerId,
        p_event_type: eventType,
        p_service_id: serviceId || null,
        p_visitor_id: visitorId || null
      });

      if (error) {
        console.error("Analytics tracking error:", error);
      }
    } catch (err) {
      console.error("Failed to track event:", err);
    }
  }, []);

  return { track };
};
