import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    MessageSquare,
    Send,
    Search,
    MoreVertical,
    Phone,
    Video,
    ShieldCheck,
    Loader2,
    ArrowLeft,
    Trash2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GildedInput } from "@/components/ui/gilded-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Types
type Conversation = {
    id: string;
    type: 'support' | 'client' | 'system';
    status: 'open' | 'closed' | 'resolved';
    updated_at: string;
    last_message?: string;
    unread_count?: number;
    title?: string;
    participants?: {
        user_id: string;
        // Mocked profile data for now
        full_name?: string;
        avatar_url?: string;
    }[];
};

type Message = {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_me: boolean;
};

export default function Messaging() {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { markConversationRead } = useNotifications();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [supportTitle, setSupportTitle] = useState("");
    const [supportMessage, setSupportMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
            await fetchConversations();
            setLoading(false);
        };
        loadInitialData();

        // Subscribe to new conversations
        const channel = supabase
            .channel('public:conversations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Load messages when active conversation changes
    useEffect(() => {
        if (!activeConversationId) return;

        markConversationRead(activeConversationId);
        fetchMessages(activeConversationId);

        // Subscribe to messages for this conversation
        const channel = supabase
            .channel(`conversation:${activeConversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConversationId}`
            }, (payload) => {
                const newMsg = payload.new as any;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, {
                        id: newMsg.id,
                        content: newMsg.content,
                        sender_id: newMsg.sender_id,
                        created_at: newMsg.created_at,
                        is_me: newMsg.sender_id === userId
                    }];
                });
                scrollToBottom();

                // If the message is not from us, mark it as read since we are currently viewing the conversation
                if (newMsg.sender_id !== userId) {
                    markConversationRead(activeConversationId);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeConversationId, userId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    conversation_participants!inner(user_id)
                `)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            // Transform data (mocking participant details for now, usually would join with profiles)
            const mapped: Conversation[] = data.map((c: any) => ({
                id: c.id,
                type: c.type,
                status: c.status,
                title: c.title,
                updated_at: c.updated_at,
                last_message: "Message récent...", // Ideally fetch last message
                unread_count: 0
            }));

            setConversations(mapped);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const fetchMessages = async (convId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const mapped: Message[] = data.map((m: any) => ({
                id: m.id,
                content: m.content,
                sender_id: m.sender_id,
                created_at: m.created_at,
                is_me: m.sender_id === userId
            }));

            setMessages(mapped);
            scrollToBottom();
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId || !userId) return;

        const messageContent = newMessage.trim();
        const optimisticId = crypto.randomUUID(); // Temporary ID

        // 1. Optimistic Update (Immediate Feedback)
        setMessages(prev => [...prev, {
            id: optimisticId,
            content: messageContent,
            sender_id: userId,
            created_at: new Date().toISOString(),
            is_me: true
        }]);
        setNewMessage("");
        scrollToBottom();

        setSending(true);
        try {
            const { data, error } = await supabase.from('messages').insert({
                conversation_id: activeConversationId,
                sender_id: userId,
                content: messageContent
            }).select().single();

            if (error) {
                // Rollback if error (remove the optimistically added message)
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
                throw error;
            }

            // 2. Swap Optimistic ID with Real ID
            if (data) {
                setMessages(prev => prev.map(m =>
                    m.id === optimisticId
                        ? { ...m, id: data.id, created_at: data.created_at }
                        : m
                ));
            }
        } catch (error) {
            toast.error("Erreur lors de l'envoi");
        } finally {
            setSending(false);
        }
    };

    const startSupportChat = async () => {
        if (!supportTitle.trim() || !supportMessage.trim()) {
            toast.error("Veuillez remplir le titre et le message");
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('start_support_conversation', {
                p_title: supportTitle.trim(),
                p_message: supportMessage.trim()
            });
            if (error) throw error;

            await fetchConversations();
            setActiveConversationId(data); // data is the new UUID
            toast.success("Ticket support créé");
            setIsSupportModalOpen(false);
            setSupportTitle("");
            setSupportMessage("");
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConversation = async () => {
        if (!activeConversationId) return;

        try {
            const { error } = await supabase.rpc('delete_conversation', {
                target_conversation_id: activeConversationId
            });

            if (error) throw error;

            toast.success("Conversation supprimée");
            setActiveConversationId(null);
            setIsDeleteDialogOpen(false);
            await fetchConversations();
        } catch (error: any) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Derived UI State
    const activeConv = conversations.find(c => c.id === activeConversationId);
    const isSupport = activeConv?.type === 'support';

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-[#F8F5F0] rounded-2xl border border-[#D4D2CF] shadow-sm overflow-hidden relative">
            {/* Sidebar List */}
            <div className={cn(
                "w-full md:w-80 flex flex-col border-r border-[#D4D2CF] bg-[#F8F5F0]",
                activeConversationId ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-[#D4D2CF]/50 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-serif font-bold text-xl text-[#1E1E1E]">Messages</h2>
                        <button className="md:hidden p-2 text-[#B79A63]">
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
                        <DialogTrigger asChild>
                            <button
                                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1E1E1E] text-white rounded-xl text-sm font-bold shadow-lg shadow-black/5 hover:bg-black transition-all"
                            >
                                <ShieldCheck className="w-4 h-4 text-[#B79A63]" />
                                Ouvrir un ticket Support
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-[#F8F5F0] border-[#D4D2CF] z-[9999]">
                            <DialogHeader>
                                <DialogTitle className="font-serif text-2xl font-bold text-[#1E1E1E]">
                                    Nouveau ticket support
                                </DialogTitle>
                                <DialogDescription className="text-slate-600">
                                    Précisez l'objet de votre demande et expliquez-nous votre problème.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#1E1E1E]">Objet (Titre)</label>
                                    <GildedInput
                                        value={supportTitle}
                                        onChange={(e) => setSupportTitle(e.target.value)}
                                        placeholder="ex: Problème de paiement, Bug sur mon profil..."
                                        className="w-full bg-white border-[#D4D2CF] focus:border-[#B79A63]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#1E1E1E]">Message</label>
                                    <textarea
                                        value={supportMessage}
                                        onChange={(e) => setSupportMessage(e.target.value)}
                                        placeholder="Décrivez votre problème en quelques mots..."
                                        className="w-full min-h-[120px] p-3 rounded-xl border border-[#D4D2CF] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B79A63]/20 focus:border-[#B79A63] transition-all"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <button
                                    onClick={() => { setIsSupportModalOpen(false); setSupportTitle(""); setSupportMessage(""); }}
                                    className="px-4 py-2 text-sm font-bold text-[#1E1E1E] hover:bg-black/5 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={startSupportChat}
                                    disabled={!supportTitle.trim() || !supportMessage.trim() || loading}
                                    className="px-6 py-2 bg-[#B79A63] hover:bg-[#A68952] text-white font-bold rounded-xl disabled:opacity-50 transition-all shadow-md"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Créer le ticket"}
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[#B79A63]" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-slate-500 font-serif">Votre messagerie est vide.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversationId(conv.id)}
                                    className={cn(
                                        "w-full p-4 flex items-start gap-4 hover:bg-[#EBE6DA]/50 transition-colors text-left border-b border-[#D4D2CF] last:border-0 group relative",
                                        activeConversationId === conv.id ? "bg-[#EBE6DA] border-l-4 border-l-[#B79A63]" : "pl-4 border-l-4 border-l-transparent"
                                    )}
                                >
                                    <Avatar className="w-10 h-10 border border-[#D4D2CF]">
                                        <AvatarFallback className={cn("text-xs font-bold", conv.type === 'support' ? "bg-[#1E1E1E] text-[#B79A63]" : "bg-slate-100 text-[#1E1E1E]")}>
                                            {conv.type === 'support' ? 'SP' : 'CL'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm text-[#1E1E1E] truncate">
                                                {conv.type === 'support' ? (conv.title || 'Assistance Far7i') : 'Client'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{new Date(conv.updated_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate pr-6">
                                            {conv.last_message}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-white",
                !activeConversationId ? "hidden md:flex" : "flex"
            )}>
                {activeConversationId ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-[#D4D2CF] flex items-center justify-between px-6 flex-shrink-0 bg-[#F8F5F0]">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveConversationId(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-500"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback className={cn("text-xs font-bold", isSupport ? "bg-[#1E1E1E] text-[#B79A63]" : "bg-slate-100")}>
                                        {isSupport ? 'SP' : 'CL'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-serif font-bold text-[#1E1E1E]">
                                        {isSupport ? (activeConv?.title || 'Assistance Far7i') : 'Client'}
                                    </h3>
                                    {isSupport && (
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#B79A63] flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            En ligne
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 text-slate-400 hover:text-[#B79A63] transition-colors rounded-full hover:bg-slate-50">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                            onClick={() => setIsDeleteDialogOpen(true)}
                                            className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 bg-white"
                        >
                            {messages.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <p className="font-serif text-lg text-[#1E1E1E]">Début de la conversation</p>
                                    <p className="text-sm text-slate-500">Posez votre question à notre équipe.</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex w-full",
                                            msg.is_me ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "max-w-[75%] rounded-2xl p-4 text-sm font-lato shadow-sm",
                                            msg.is_me
                                                ? "bg-[#1E1E1E] text-white rounded-tr-none"
                                                : "bg-[#D4D2CF] text-[#1E1E1E] rounded-tl-none"
                                        )}>
                                            <p>{msg.content}</p>
                                            <div className={cn(
                                                "text-[10px] mt-1 text-right opacity-50",
                                                msg.is_me ? "text-white" : "text-black"
                                            )}>
                                                {formatTime(msg.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-[#F8F5F0] bg-white">
                            <form onSubmit={handleSendMessage} className="flex gap-3">
                                <GildedInput
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Écrivez votre message..."
                                    className="flex-1 rounded-full border border-[#D4D2CF] bg-white focus:border-[#B79A63] focus:ring-[#B79A63] transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className="w-10 h-10 rounded-full bg-[#B79A63] text-white flex items-center justify-center hover:bg-[#A68952] disabled:opacity-50 transition-all shadow-md transform hover:scale-105"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="font-serif text-xl font-bold text-[#1E1E1E]">Vos échanges</h3>
                        <p className="max-w-xs mx-auto text-sm text-slate-500">
                            Sélectionnez une conversation pour voir les messages ou contactez le support pour obtenir de l'aide.
                        </p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirer la conversation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette conversation sera retirée de votre liste. L'historique sera conservé pour le support.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConversation} className="bg-red-500 hover:bg-red-600">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
