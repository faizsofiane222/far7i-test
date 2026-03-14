import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Trash2, Bell, X, Loader2, MessageSquare, AlertCircle, Info, CheckCircle2, Video, Grid, Calendar, ExternalLink } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { GildedButton } from "@/components/ui/gilded-button";

interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    data?: any;
    link?: string;
}

interface NotificationCenterProps {
    unreadCount: number;
    onRead: () => void;
}

export function NotificationCenter({ unreadCount, onRead }: NotificationCenterProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    // State for Detail Modal
    const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

    useEffect(() => {
        if (open && user) {
            fetchNotifications();
        }
    }, [open, user]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from("notifications")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false })
                .limit(50); // Increased limit to find older unread ones

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markReadAndOpen = async (notif: Notification) => {
        // Optimistically mark as read locally
        if (!notif.read) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
            );

            // Call API
            (supabase as any).rpc("mark_notification_read", { notification_id: notif.id }).then(({ error }: any) => {
                if (!error) {
                    onRead(); // Trigger global count update
                }
            });
        }

        // Open Detail Modal
        setSelectedNotif(notif);
        // We keep the Popover open? Or close it?
        // Usually clicking runs an action, so maybe close popover?
        setOpen(false);
    };

    const handleMarkAllRead = async () => {
        try {
            const { error } = await (supabase as any).rpc("mark_all_notifications_read");
            if (error) throw error;

            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            onRead();
            toast.success("Toutes les notifications marquées comme lues");
        } catch (error) {
            console.error("Error marking all read:", error);
            toast.error("Erreur action");
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await (supabase as any).from("notifications").delete().eq("id", id);
            if (error) throw error;

            setNotifications((prev) => prev.filter((n) => n.id !== id));
            onRead();
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleModalAction = () => {
        if (selectedNotif?.link) {
            navigate(selectedNotif.link);
            setSelectedNotif(null);
        } else {
            setSelectedNotif(null);
        }
    };

    const getIcon = (type: string) => {
        if (type.includes("approved")) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        if (type.includes("rejected")) return <AlertCircle className="w-5 h-5 text-red-500" />;
        if (type.includes("message")) return <MessageSquare className="w-5 h-5 text-blue-500" />;
        return <Info className="w-5 h-5 text-[#B79A63]" />;
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative group cursor-pointer p-2 rounded-full hover:bg-black/5 transition-colors">
                        <Bell className="h-5 w-5 text-[#1E1E1E]" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 md:w-96 p-0 bg-white border border-[#D4D2CF] shadow-xl rounded-xl overflow-hidden z-[60]">
                    <div className="flex items-center justify-between p-4 bg-[#F8F5F0] border-b border-[#D4D2CF]">
                        <h4 className="font-serif font-bold text-[#1E1E1E]">Notifications</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-bold text-[#B79A63] hover:text-[#B79A63]/80 uppercase tracking-wider flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    <ScrollArea className="h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2 text-[#1E1E1E]/40">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <p className="text-xs">Chargement...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2 text-[#1E1E1E]/40">
                                <Bell className="w-8 h-8 opacity-20" />
                                <p className="text-sm">Aucune notification</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#F8F5F0]">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => markReadAndOpen(notif)}
                                        className={`relative p-4 hover:bg-[#F8F5F0]/50 transition-colors cursor-pointer group ${!notif.read ? "bg-[#B79A63]/5" : ""}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className={`text-sm ${!notif.read ? "font-bold text-[#1E1E1E]" : "font-medium text-[#1E1E1E]/80"}`}>
                                                        {notif.title}
                                                    </p>
                                                    {!notif.read && (
                                                        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#1E1E1E]/60 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[10px] text-[#1E1E1E]/40 font-medium capitalize">
                                                        {format(new Date(notif.created_at), "d MMM, HH:mm", { locale: fr })}
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleDelete(notif.id, e)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-[#1E1E1E]/20 hover:text-red-500 transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            {/* Detail Modal */}
            <Dialog open={!!selectedNotif} onOpenChange={(open) => !open && setSelectedNotif(null)}>
                <DialogContent className="max-w-md bg-[#FDFCFB] border-[#B79A63]/20 shadow-2xl p-0 overflow-hidden">
                    {/* Header with decorative background */}
                    <div className="bg-[#1E1E1E] p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#B79A63]/10 pattern-grid-lg opacity-20" />

                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#B79A63]/20 flex items-center justify-center mb-2 ring-1 ring-[#B79A63]/40">
                                {selectedNotif && getIcon(selectedNotif.type)}
                            </div>
                            <DialogTitle className="font-serif text-xl text-[#F8F5F0] text-center leading-tight">
                                {selectedNotif?.title}
                            </DialogTitle>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-white p-4 rounded-xl border border-[#D4D2CF]/50 shadow-sm space-y-4">
                            <p className="text-[#1E1E1E] text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedNotif?.message}
                            </p>
                            
                            {selectedNotif?.data?.rejection_reason && (
                                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Remarque de l'admin
                                    </p>
                                    <p className="text-red-700 text-sm font-medium italic">
                                        "{selectedNotif.data.rejection_reason}"
                                    </p>
                                </div>
                            )}

                            {selectedNotif?.data?.diff && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Champs modifiés
                                    </p>
                                    <p className="text-blue-700 text-xs font-semibold">
                                        {Object.keys(selectedNotif.data.diff).length} champ(s) mis à jour
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <div className="w-full flex gap-3">
                                <button
                                    onClick={() => setSelectedNotif(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-[#D4D2CF] text-xs font-bold text-[#1E1E1E]/60 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                                >
                                    Fermer
                                </button>
                                {selectedNotif?.link && (
                                    <GildedButton
                                        onClick={handleModalAction}
                                        className="flex-1"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                        Voir
                                    </GildedButton>
                                )}
                            </div>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
