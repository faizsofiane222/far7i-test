import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnreadCounts {
  notifications: number;
  messages: number;
  pendingModeration: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<UnreadCounts>({
    notifications: 0,
    messages: 0,
    pendingModeration: 0
  });
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchCounts = async () => {
    if (!user) return;

    try {
      // 1. Unread Notifications (using existing function)
      const { data: notifCount } = await supabase.rpc('get_unread_notifications_count');
      
      // 2. Unread Messages (using new function)
      const { data: msgCount } = await supabase.rpc('get_unread_messages_count');

      // 3. Pending Moderation (Admin only)
      let modCount = 0;
      const { data: adminCheck } = await supabase.rpc('is_admin');
      setIsAdmin(!!adminCheck);
      
      if (adminCheck) {
        const { data: pCount } = await supabase.rpc('get_pending_moderation_count');
        modCount = pCount || 0;
      }

      setCounts({
        notifications: notifCount || 0,
        messages: msgCount || 0,
        pendingModeration: modCount
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchCounts();

    // Set up Real-time subscriptions
    const notifSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchCounts();
      })
      .subscribe();

    const msgSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, () => {
        // We can't easily filter by user_id here since messages are in conversations
        // So we just re-fetch whenever ANY message is inserted. 
        // Optimization: only re-fetch if message is not from current user (not possible in filter)
        fetchCounts();
      })
      .subscribe();

    const providerSubscription = supabase
      .channel('admin_moderation_sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'providers'
      }, () => {
        if (isAdmin) fetchCounts();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'services'
      }, () => {
        if (isAdmin) fetchCounts();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reviews'
      }, () => {
        if (isAdmin) fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifSubscription);
      supabase.removeChannel(msgSubscription);
      supabase.removeChannel(providerSubscription);
    };
  }, [user, isAdmin]);

  const markAsRead = async (notificationId: string) => {
    await supabase.rpc('mark_notification_read', { notification_id: notificationId });
    fetchCounts();
  };

  const markAllAsRead = async () => {
    await supabase.rpc('mark_all_notifications_read');
    fetchCounts();
  };

  const markConversationRead = async (convId: string) => {
    await supabase.rpc('mark_conversation_read', { conv_id: convId });
    fetchCounts();
  };

  return {
    ...counts,
    isAdmin,
    fetchCounts,
    markAsRead,
    markAllAsRead,
    markConversationRead
  };
}
