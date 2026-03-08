import { useState, useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    MessageSquare,
    Mail,
    Search as SearchIcon,
    Send,
    Plus,
    Loader2,
    Calendar,
    ChevronRight,
    Filter,
    Users2,
    Trash2,
    Braces,
    ArrowLeft,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Eye as EyeIcon,
    History as HistoryIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Types
type Conversation = {
    id: string;
    type: 'support' | 'client' | 'system';
    status: 'open' | 'closed' | 'resolved';
    updated_at: string;
    guest_email?: string;
    guest_name?: string;
    last_message?: string;
    participants?: {
        user_id: string;
        full_name?: string;
        avatar_url?: string;
        business_name?: string;
    }[];
};

type Message = {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
};

export default function AdminMessagingPanel() {
    const [activeTab, setActiveTab] = useState("messages");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const { markConversationRead } = useNotifications();
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Newsletter State
    const [campaign, setCampaign] = useState({
        title: "",
        subject: "",
        content: "",
        target_type: "providers",
        filters: { category: "all", wilaya: "all" }
    });
    const [categories, setCategories] = useState<{ id: string, slug: string, name: string }[]>([]);
    const [wilayas, setWilayas] = useState<{ id: string, code: string, name: string }[]>([]);
    const [campaignHistory, setCampaignHistory] = useState<any[]>([]);
    const [estimatedAudience, setEstimatedAudience] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // New Conversation State
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [newChatInitialMessage, setNewChatInitialMessage] = useState("Bonjour, nous souhaiterions échanger avec vous concernant votre profil Far7i.");

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
            await Promise.all([
                fetchConversations(),
                fetchCategories(),
                fetchWilayas(),
                fetchCampaignHistory()
            ]);
            setLoading(false);
        };
        init();

        // Real-time subscriptions for conversations
        const convChannel = supabase
            .channel('admin_conversations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => { supabase.removeChannel(convChannel); };
    }, []);

    useEffect(() => {
        estimateAudience();
    }, [campaign.target_type, campaign.filters]);

    useEffect(() => {
        if (activeConvId) {
            markConversationRead(activeConvId);
            fetchMessages(activeConvId);
        }
    }, [activeConvId]);

    useEffect(() => {
        if (!activeConvId) return;

        const msgChannel = supabase
            .channel(`msg_${activeConvId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConvId}`
            }, (payload) => {
                const newMsg = payload.new as Message;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                scrollToBottom();
            })
            .subscribe();

        return () => { supabase.removeChannel(msgChannel); };
    }, [activeConvId]);

    const fetchCategories = async () => {
        const { data } = await supabase.from('service_categories').select('id, slug, name');
        if (data) setCategories(data as any);
    };

    const fetchWilayas = async () => {
        const { data } = await supabase.from('wilayas').select('id, code, name').eq('active', true);
        if (data) setWilayas(data);
    };

    const fetchCampaignHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data } = await supabase
                .from('newsletter_campaigns')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setCampaignHistory(data);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const estimateAudience = async () => {
        try {
            let count = 0;
            if (campaign.target_type === 'providers') {
                let query = supabase.from('providers').select('id', { count: 'exact', head: true });

                if (campaign.filters.category !== 'all') {
                    // Filter by category slug directly
                    const selectedCat = categories.find(c => c.id === campaign.filters.category);
                    if (selectedCat) {
                        query = query.eq('category_slug', selectedCat.slug);
                    }
                }
                if (campaign.filters.wilaya !== 'all') {
                    query = query.eq('wilaya_id', campaign.filters.wilaya);
                }
                const { count: c, error } = await query;
                if (error) console.error("Audience calc error:", error);
                count = c || 0;
            } else if (campaign.target_type === 'clients') {
                const { count: c } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'client');
                count = c || 0;
            } else {
                const { count: c } = await supabase.from('users').select('id', { count: 'exact', head: true });
                count = c || 0;
            }
            setEstimatedAudience(count);
        } catch (error) {
            console.error("Error estimating audience:", error);
        }
    };

    const fetchConversations = async () => {
        try {
            // Fetch conversations with participants and their simple profiles
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    conversation_participants(
                        user_id,
                        profiles:user_id(full_name, avatar_url)
                    )
                `)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("Error fetching conversations:", error);
                return;
            }

            if (!data) {
                setConversations([]);
                return;
            }

            // Simple mapping to inject participant names if guest_name is missing
            const mapped = data.map((c: any) => {
                if (!c.guest_name && c.conversation_participants) {
                    // Find the other participant (not the admin)
                    const other = c.conversation_participants.find((p: any) => p.user_id !== userId);
                    if (other && other.profiles) {
                        return { ...c, guest_name: other.profiles.full_name, avatar_url: other.profiles.avatar_url };
                    }
                }
                return c;
            });

            setConversations(mapped);
        } catch (error) {
            console.error("Error in fetchConversations:", error);
        }
    };

    // Load all users - 3 fallback strategies
    const loadAllUsers = async () => {
        setLoadingUsers(true);
        try {
            // Strategy 1: New RPC (needs migration 20260308110000 in Supabase)
            const { data: rpcData, error: rpcErr } = await (supabase as any).rpc('search_users_for_chat', { p_query: '' });
            if (!rpcErr && rpcData && rpcData.length > 0) {
                setAllUsers(rpcData);
                return;
            }

            // Strategy 2: get_admin_moderation_list (already applied, returns users)
            const { data: modData, error: modErr } = await (supabase as any).rpc('get_admin_moderation_list');
            if (!modErr && modData && modData.length > 0) {
                const usersMap = new Map();
                modData.forEach((item: any) => {
                    if (!usersMap.has(item.user_id)) {
                        usersMap.set(item.user_id, {
                            user_id: item.user_id,
                            display_name: item.display_name,
                            email: item.email,
                            commercial_name: item.profile?.commercial_name || null,
                            role: 'provider'
                        });
                    }
                });
                setAllUsers(Array.from(usersMap.values()));
                return;
            }

            // Strategy 3: Direct providers table (public read policy exists)
            const { data: provData } = await (supabase as any)
                .from('providers')
                .select('user_id, commercial_name')
                .limit(50);
            if (provData && provData.length > 0) {
                setAllUsers(provData.map((p: any) => ({
                    user_id: p.user_id,
                    display_name: null,
                    email: null,
                    commercial_name: p.commercial_name,
                    role: 'provider'
                })));
                return;
            }
            setAllUsers([]);
        } catch (error) {
            console.error('Load users error:', error);
            setAllUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Filter displayed users by search query (client-side after initial load)
    const filteredUsers = allUsers.filter(u =>
        !searchQuery.trim() ||
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.commercial_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );


    const handleStartNewConversation = async (targetUserId: string) => {
        try {
            const { data, error } = await (supabase as any).rpc('start_admin_conversation', {
                p_target_user_id: targetUserId,
                p_initial_message: newChatInitialMessage.trim()
            });
            if (error) throw error;
            return data as string;
        } catch (error: any) {
            throw error;
        }
    };

    const handleStartConversationsWithSelected = async () => {
        if (selectedUserIds.length === 0 || !newChatInitialMessage.trim()) return;
        setSending(true);
        let lastConvId: string | null = null;
        let successCount = 0;
        for (const uid of selectedUserIds) {
            try {
                lastConvId = await handleStartNewConversation(uid);
                successCount++;
            } catch (err: any) {
                toast.error(`Erreur pour un contact : ${err.message}`);
            }
        }
        setSending(false);
        if (successCount > 0) {
            toast.success(`${successCount} conversation${successCount > 1 ? 's' : ''} démarrée${successCount > 1 ? 's' : ''} !`);
            setIsNewChatOpen(false);
            setSelectedUserIds([]);
            setSearchQuery('');
            await fetchConversations();
            if (lastConvId) setActiveConvId(lastConvId);
        }
    };


    const fetchMessages = async (id: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            toast.error("Erreur lors de la récupération des messages");
            return;
        }
        setMessages(data || []);
        scrollToBottom();
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConvId || !userId) return;

        setSending(true);
        const { error } = await supabase.from('messages').insert({
            conversation_id: activeConvId,
            sender_id: userId,
            content: newMessage.trim()
        });

        if (error) {
            toast.error("Erreur d'envoi");
        } else {
            setNewMessage("");
            scrollToBottom();
        }
        setSending(false);
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
    };

    // WRAPS CONTENT IN GOLD & BLACK HTML TEMPLATE
    const wrapWithTemplate = (bodyContent: string) => {
        // Simple HTML template for Far7i
        // Replace newlines with <br/> if not HTML? No, assuming simple text/HTML mix.
        // If content is plain text, we preserve newlines.
        const formattedBody = bodyContent.replace(/\n/g, '<br/>');

        return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 0; background-color: #F8F5F0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  .wrapper { width: 100%; table-layout: fixed; background-color: #F8F5F0; padding-bottom: 40px; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .header { background-color: #1E1E1E; padding: 30px; text-align: center; }
  .logo { height: 45px; width: auto; }
  .body { padding: 40px 30px; color: #1E1E1E; line-height: 1.6; font-size: 16px; }
  .footer { background-color: #1E1E1E; color: #888888; padding: 30px; text-align: center; font-size: 12px; border-top: 2px solid #B79A63; }
  a { color: #B79A63; text-decoration: none; font-weight: bold; }
  .btn { display: inline-block; background-color: #B79A63; color: white !important; padding: 12px 24px; border-radius: 4px; margin-top: 20px; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <!-- Using a public logo URL or placeholder -->
        <h1 style="color: #B79A63; margin: 0; font-family: 'Georgia', serif; font-style: italic;">Far7i</h1>
      </div>
      
      <!-- BODY -->
      <div class="body">
        ${formattedBody}
      </div>
      
      <!-- FOOTER -->
      <div class="footer">
        <p style="margin-bottom: 10px;">Vous recevez cet email car vous êtes membre de la communauté Far7i.</p>
        <p>© 2025 Far7i Events. Tous droits réservés.</p>
        <p><a href="#">Se désabonner</a></p>
      </div>
    </div>
  </div>
</body>
</html>
        `;
    };

    const insertVariable = (variable: string) => {
        if (!textAreaRef.current) return;

        const start = textAreaRef.current.selectionStart;
        const end = textAreaRef.current.selectionEnd;
        const text = campaign.content;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        const newText = before + variable + after;

        setCampaign({ ...campaign, content: newText });

        // Reset focus
        setTimeout(() => {
            if (textAreaRef.current) {
                textAreaRef.current.focus();
                textAreaRef.current.setSelectionRange(start + variable.length, start + variable.length);
            }
        }, 10);
    };

    const handleSendNewsletter = async () => {
        if (!campaign.title || !campaign.subject || !campaign.content) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }

        const finalHtmlContent = wrapWithTemplate(campaign.content);

        try {
            // 1. Create Campaign
            const { data: newCampaign, error: createError } = await supabase.from('newsletter_campaigns').insert({
                title: campaign.title,
                subject: campaign.subject,
                content: finalHtmlContent, // Save the fully wrapped HTML
                target_type: campaign.target_type,
                target_filters: campaign.filters,
                status: 'draft', // Start as draft
                created_by: userId
            }).select().single();

            if (createError) throw createError;

            toast.info("Campagne créée, traitement de l'audience...");

            // 2. Call RPC to process audience
            const { data: rpcResult, error: rpcError } = await supabase.rpc('process_newsletter_campaign', {
                campaign_id: newCampaign.id
            });

            if (rpcError) throw rpcError;

            if ((rpcResult as any)?.success) {
                toast.success(`Campagne envoyée ! (${(rpcResult as any).recipients_count} destinataires)`);
            } else {
                toast.warning(`Campagne créée mais erreur de traitement: ${(rpcResult as any)?.error}`);
            }

            // Reset form & Refresh
            setCampaign({
                title: "",
                subject: "",
                content: "",
                target_type: "providers",
                filters: { category: "all", wilaya: "all" }
            });
            fetchCampaignHistory();

        } catch (error: any) {
            console.error("Newsletter Error:", error);
            toast.error(`Erreur: ${error.message}`);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-secondary">Messagerie & Newsletters</h1>
                    <p className="text-muted-foreground mt-1">Gérez les communications avec vos utilisateurs et lancez des campagnes.</p>
                </div>

                <Tabs defaultValue="messages" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2 bg-[#F8F5F0] border border-[#D4D2CF] p-1 rounded-xl">
                        <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-white transition-all">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Messages
                        </TabsTrigger>
                        <TabsTrigger value="newsletters" className="rounded-lg data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-white transition-all">
                            <Mail className="w-4 h-4 mr-2" />
                            Newsletters
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="messages" className="mt-6 border-0 p-0">
                        <div className="flex bg-[#F8F5F0] rounded-2xl border border-[#D4D2CF] shadow-sm overflow-hidden h-[calc(100vh-16rem)] relative">
                            {/* Sidebar List */}
                            <div className={cn(
                                "w-full md:w-80 flex flex-col border-r border-[#D4D2CF] bg-[#F8F5F0]",
                                activeConvId ? "hidden md:flex" : "flex"
                            )}>
                                <div className="p-4 border-b border-[#D4D2CF]/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-serif font-bold text-xl text-[#1E1E1E]">Messages</h2>
                                        <Dialog open={isNewChatOpen} onOpenChange={(open) => {
                                            setIsNewChatOpen(open);
                                            if (open) {
                                                setSearchQuery("");
                                                setSelectedUserIds([]);
                                                loadAllUsers();
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="text-[#B79A63] hover:bg-[#B79A63]/10">
                                                    <Plus className="w-5 h-5" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[460px] bg-[#F8F5F0] border-[#D4D2CF]">
                                                <DialogHeader>
                                                    <DialogTitle className="font-serif text-2xl font-bold text-[#1E1E1E]">
                                                        Nouvelle conversation
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Sélectionnez un ou plusieurs contacts, puis rédigez votre message.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-2">
                                                    {/* Search filter */}
                                                    <div className="relative">
                                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <Input
                                                            placeholder="Filtrer par nom, email ou nom commercial..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="pl-9 h-10 bg-white border-[#D4D2CF] focus:ring-[#B79A63]/50 focus:border-[#B79A63]"
                                                        />
                                                    </div>

                                                    {/* Users list */}
                                                    <div className="rounded-xl border border-[#D4D2CF] bg-white overflow-hidden">
                                                        <div className="max-h-[260px] overflow-y-auto divide-y divide-[#F0EDE8]">
                                                            {loadingUsers ? (
                                                                <div className="flex items-center justify-center p-6 gap-3">
                                                                    <Loader2 className="w-5 h-5 animate-spin text-[#B79A63]" />
                                                                    <span className="text-sm text-slate-500">Chargement des contacts...</span>
                                                                </div>
                                                            ) : filteredUsers.length === 0 ? (
                                                                <div className="p-6 text-center text-sm text-slate-400">
                                                                    {searchQuery ? "Aucun résultat pour cette recherche." : "Aucun utilisateur trouvé."}
                                                                </div>
                                                            ) : (
                                                                filteredUsers.map(user => {
                                                                    const isSelected = selectedUserIds.includes(user.user_id);
                                                                    const name = user.display_name || user.email?.split('@')[0] || 'Utilisateur';
                                                                    const sub = user.email;
                                                                    return (
                                                                        <button
                                                                            key={user.user_id}
                                                                            onClick={() => toggleUserSelection(user.user_id)}
                                                                            className={cn(
                                                                                "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                                                                                isSelected ? "bg-[#B79A63]/10" : "hover:bg-[#F8F5F0]"
                                                                            )}
                                                                        >
                                                                            {/* Checkbox */}
                                                                            <div className={cn(
                                                                                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                                                isSelected ? "bg-[#B79A63] border-[#B79A63]" : "border-[#D4D2CF] bg-white"
                                                                            )}>
                                                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                                            </div>
                                                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                                                <AvatarFallback className={cn(
                                                                                    "text-xs font-bold",
                                                                                    isSelected ? "bg-[#B79A63] text-white" : "bg-[#1E1E1E] text-[#B79A63]"
                                                                                )}>
                                                                                    {name[0]?.toUpperCase() || '?'}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-semibold text-sm truncate text-[#1E1E1E]">{name}</p>
                                                                                {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
                                                                            </div>
                                                                            {user.role && (
                                                                                <span className={cn(
                                                                                    "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0",
                                                                                    user.role === 'provider' ? "bg-green-50 text-green-700" :
                                                                                        user.role === 'admin' ? "bg-red-50 text-red-700" :
                                                                                            "bg-slate-100 text-slate-500"
                                                                                )}>{user.role}</span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                        {/* Selected count badge */}
                                                        {selectedUserIds.length > 0 && (
                                                            <div className="border-t border-[#F0EDE8] px-4 py-2 bg-[#B79A63]/5 flex items-center justify-between">
                                                                <span className="text-xs text-[#B79A63] font-bold">
                                                                    {selectedUserIds.length} contact{selectedUserIds.length > 1 ? 's' : ''} sélectionné{selectedUserIds.length > 1 ? 's' : ''}
                                                                </span>
                                                                <button
                                                                    onClick={() => setSelectedUserIds([])}
                                                                    className="text-xs text-slate-400 hover:text-red-500"
                                                                >
                                                                    Effacer
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Message */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-[#1E1E1E]">Message initial</label>
                                                        <textarea
                                                            value={newChatInitialMessage}
                                                            onChange={(e) => setNewChatInitialMessage(e.target.value)}
                                                            className="w-full p-3 rounded-xl border border-[#D4D2CF] bg-white text-sm focus:ring-[#B79A63]/50 focus:border-[#B79A63] outline-none min-h-[80px] resize-none"
                                                        />
                                                    </div>

                                                    {/* Send button */}
                                                    <Button
                                                        onClick={handleStartConversationsWithSelected}
                                                        disabled={selectedUserIds.length === 0 || !newChatInitialMessage.trim() || sending}
                                                        className="w-full bg-[#1E1E1E] hover:bg-[#B79A63] text-white font-bold rounded-xl h-11 transition-colors"
                                                    >
                                                        {sending ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Envoi en cours...</>
                                                        ) : (
                                                            <><Send className="w-4 h-4 mr-2" />
                                                                Démarrer {selectedUserIds.length > 1 ? `${selectedUserIds.length} conversations` : 'la conversation'}
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
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
                                            <p className="text-sm text-slate-500 font-serif">Aucune conversation.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {conversations.map(conv => (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => setActiveConvId(conv.id)}
                                                    className={cn(
                                                        "w-full p-4 flex items-start gap-4 hover:bg-[#EBE6DA]/50 transition-colors text-left border-b border-[#D4D2CF] last:border-0 group relative",
                                                        activeConvId === conv.id ? "bg-[#EBE6DA] border-l-4 border-l-[#B79A63]" : "pl-4 border-l-4 border-l-transparent"
                                                    )}
                                                >
                                                    <Avatar className="w-10 h-10 border border-[#D4D2CF]">
                                                        <AvatarFallback className={cn("text-xs font-bold", conv.type === 'support' ? "bg-[#1E1E1E] text-[#B79A63]" : "bg-slate-100 text-[#1E1E1E]")}>
                                                            {conv.guest_name?.[0] || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-sm text-[#1E1E1E] truncate">
                                                                {conv.guest_name || 'Utilisateur'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">{new Date(conv.updated_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase tracking-tighter opacity-60">
                                                                {conv.type}
                                                            </Badge>
                                                            {conv.status === 'open' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                                        </div>
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
                                !activeConvId ? "hidden md:flex" : "flex"
                            )}>
                                {activeConvId ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="h-16 border-b border-[#D4D2CF] flex items-center justify-between px-6 flex-shrink-0 bg-[#F8F5F0]">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setActiveConvId(null)}
                                                    className="md:hidden p-2 -ml-2 text-slate-500"
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </button>
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="text-xs font-bold bg-[#1E1E1E] text-[#B79A63]">
                                                        {conversations.find(c => c.id === activeConvId)?.guest_name?.[0] || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-serif font-bold text-[#1E1E1E]">
                                                        {conversations.find(c => c.id === activeConvId)?.guest_name || 'Conversation'}
                                                    </h3>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B79A63] flex items-center gap-1">
                                                        {conversations.find(c => c.id === activeConvId)?.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Trash icon for closing/deleting could go here */}
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
                                                </div>
                                            ) : (
                                                messages.map((msg) => (
                                                    <div
                                                        key={msg.id}
                                                        className={cn(
                                                            "flex w-full",
                                                            msg.sender_id === userId ? "justify-end" : "justify-start"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "max-w-[75%] rounded-2xl p-4 text-sm font-lato shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200",
                                                            msg.sender_id === userId
                                                                ? "bg-[#1E1E1E] text-white rounded-tr-none"
                                                                : "bg-white text-[#1E1E1E] rounded-tl-none border border-[#D4D2CF]/50"
                                                        )}>
                                                            <p className="leading-relaxed">{msg.content}</p>
                                                            <div className={cn(
                                                                "text-[10px] mt-1 text-right opacity-50",
                                                                msg.sender_id === userId ? "text-white" : "text-black"
                                                            )}>
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Input Area */}
                                        <div className="p-4 border-t border-[#F8F5F0] bg-white">
                                            <form onSubmit={handleSendMessage} className="flex gap-3">
                                                <Input
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Répondre..."
                                                    className="flex-1 rounded-full border border-[#D4D2CF] bg-white focus:ring-[#B79A63]/50 focus:border-[#B79A63]"
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
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                                            <MessageSquare className="w-10 h-10 opacity-20" />
                                        </div>
                                        <h3 className="font-serif text-xl font-bold text-[#1E1E1E]">Messagerie</h3>
                                        <p className="max-w-xs mx-auto text-sm text-slate-500">
                                            Sélectionnez une conversation ou utilisez le bouton "+" pour contacter un prestataire inscrit.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="newsletters" className="mt-6 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                            {/* Editor & History */}
                            <div className="xl:col-span-3 space-y-6">
                                <Card className="border-[#D4D2CF] rounded-2xl overflow-hidden shadow-sm">
                                    <CardHeader className="bg-[#F8F5F0] border-b border-[#D4D2CF]">
                                        <CardTitle className="font-serif text-xl">Rédiger une Newsletter</CardTitle>
                                        <CardDescription>Concevez votre message et visualisez le rendu.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-[#1E1E1E]">Nom de la campagne</label>
                                                <Input
                                                    value={campaign.title}
                                                    onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                                                    placeholder="ex: Offres spéciales Hiver"
                                                    className="border-[#D4D2CF] rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-[#1E1E1E]">Sujet de l'email</label>
                                                <Input
                                                    value={campaign.subject}
                                                    onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                                                    placeholder="Découvrez nos nouveautés !"
                                                    className="border-[#D4D2CF] rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-bold text-[#1E1E1E]">Contenu</label>
                                                    {/* Variables Toolbar */}
                                                    <div className="flex items-center gap-1 bg-[#F8F5F0] rounded-md p-1 border border-[#D4D2CF]">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => insertVariable("{{name}}")}
                                                            className="h-6 px-2 text-[10px] hover:bg-white text-[#1E1E1E]"
                                                        >
                                                            [Nom]
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => insertVariable("{{business}}")}
                                                            className="h-6 px-2 text-[10px] hover:bg-white text-[#1E1E1E]"
                                                        >
                                                            [Business]
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="bg-[#FAF9F6] border-[#D4D2CF] text-xs">
                                                            <EyeIcon className="w-3 h-3 mr-1" /> Prévisualiser
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden rounded-2xl border-[#D4D2CF]">
                                                        <DialogHeader className="p-6 border-b bg-[#F8F5F0]">
                                                            <DialogTitle className="font-serif italic text-2xl text-[#1E1E1E]">Aperçu de la Newsletter</DialogTitle>
                                                            <DialogDescription>Voici à quoi ressemblera l'email pour vos destinataires (Template Inclus).</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="flex-1 overflow-y-auto bg-white p-0">
                                                            <iframe
                                                                title="preview"
                                                                srcDoc={wrapWithTemplate(campaign.content)}
                                                                className="w-full h-full border-none"
                                                            />
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <textarea
                                                ref={textAreaRef}
                                                value={campaign.content}
                                                onChange={(e) => setCampaign({ ...campaign, content: e.target.value })}
                                                className="w-full min-h-[400px] p-4 rounded-xl border border-[#D4D2CF] focus:border-[#B79A63] outline-none font-mono text-sm bg-[#F8F5F0]/30"
                                                placeholder="Écrivez votre message ici... (Sauts de lignes préservés)"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-[#D4D2CF] rounded-2xl overflow-hidden shadow-sm">
                                    <CardHeader className="bg-[#F8F5F0] border-b border-[#D4D2CF]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="font-serif text-xl flex items-center gap-2">
                                                    <HistoryIcon className="w-5 h-5 text-[#B79A63]" />
                                                    Campagnes Précédentes
                                                </CardTitle>
                                                <CardDescription>Consultez l'historique de vos envois.</CardDescription>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={fetchCampaignHistory} className="text-[#B79A63]">
                                                Actualiser
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-[#F8F5F0]/50 hover:bg-[#F8F5F0]/50 border-b border-[#D4D2CF]">
                                                    <TableHead className="font-bold">Campagne</TableHead>
                                                    <TableHead className="font-bold">Cible</TableHead>
                                                    <TableHead className="font-bold">Date d'envoi</TableHead>
                                                    <TableHead className="font-bold">Statut</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {loadingHistory ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-8">
                                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#B79A63]" />
                                                        </TableCell>
                                                    </TableRow>
                                                ) : campaignHistory.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic">
                                                            Aucune campagne envoyée
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    campaignHistory.map((hist) => (
                                                        <TableRow key={hist.id} className="hover:bg-slate-50 transition-colors">
                                                            <TableCell>
                                                                <div className="font-bold text-[#1E1E1E]">{hist.title}</div>
                                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">{hist.subject}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className="bg-[#B79A63]/10 text-[#B79A63] border-none uppercase text-[10px]">
                                                                    {hist.target_type}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {new Date(hist.sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Envoyé</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#B79A63]">
                                                                    <EyeIcon className="w-4 h-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar Options */}
                            <div className="space-y-6">
                                {/* REMOVED STICKY from the Card itself to avoid overlay issues on small screens/scrolling. 
                                    Instead, let it scroll naturally or manage sticky on parent if needed.
                                    For now, Standard scroll. */}
                                <Card className="border-[#D4D2CF] rounded-2xl shadow-sm overflow-hidden">
                                    <CardHeader className="bg-[#1E1E1E] text-white border-b border-[#B79A63]/30 py-4">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                                            <Filter className="w-4 h-4 text-[#B79A63]" />
                                            Ciblage
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6 bg-white">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-400 tracking-tighter">Type de public</label>
                                                <Select value={campaign.target_type} onValueChange={(val) => setCampaign({ ...campaign, target_type: val })}>
                                                    <SelectTrigger className="rounded-xl border-[#D4D2CF] h-11 bg-[#F8F5F0]/30 shadow-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-[#D4D2CF]">
                                                        <SelectItem value="providers">Tous les Prestataires</SelectItem>
                                                        <SelectItem value="clients">Clients Inscrits</SelectItem>
                                                        <SelectItem value="all">Tout le monde</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {campaign.target_type === 'providers' && (
                                                <>
                                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                        <label className="text-xs font-bold uppercase text-slate-400 tracking-tighter">Par Catégorie</label>
                                                        <Select value={campaign.filters.category} onValueChange={(val) => setCampaign({ ...campaign, filters: { ...campaign.filters, category: val } })}>
                                                            <SelectTrigger className="rounded-xl border-[#D4D2CF] h-11 bg-[#F8F5F0]/30 shadow-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-[#D4D2CF]">
                                                                <SelectItem value="all">Toutes les catégories</SelectItem>
                                                                {categories.map(cat => (
                                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                        <label className="text-xs font-bold uppercase text-slate-400 tracking-tighter">Par Wilaya</label>
                                                        <Select value={campaign.filters.wilaya} onValueChange={(val) => setCampaign({ ...campaign, filters: { ...campaign.filters, wilaya: val } })}>
                                                            <SelectTrigger className="rounded-xl border-[#D4D2CF] h-11 bg-[#F8F5F0]/30 shadow-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-[#D4D2CF]">
                                                                <SelectItem value="all">Toutes les wilayas</SelectItem>
                                                                {wilayas.map(w => (
                                                                    <SelectItem key={w.id} value={w.id}>{w.code} - {w.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="pt-6 border-t border-[#D4D2CF]">
                                            <div className="bg-[#F8F5F0] rounded-xl p-4 border border-[#B79A63]/20 mb-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Users2 className="w-4 h-4 text-[#B79A63]" />
                                                        <span className="text-xs font-bold text-[#1E1E1E]/70 uppercase">Audience</span>
                                                    </div>
                                                    <span className="text-xl font-serif font-bold text-[#1E1E1E]">{estimatedAudience.toLocaleString()}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 italic">Destinataires uniques estimés</p>
                                            </div>

                                            <Button
                                                onClick={handleSendNewsletter}
                                                className="w-full h-14 rounded-2xl bg-[#1E1E1E] hover:bg-black text-[#B79A63] font-bold text-lg shadow-xl shadow-black/10 transition-all active:scale-95 group"
                                            >
                                                Envoyer
                                                <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="p-6 bg-gradient-to-br from-[#1E1E1E] to-[#2D2D2D] rounded-2xl border border-[#B79A63]/30 text-white shadow-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-[#B79A63] flex items-center justify-center">
                                            <Braces className="w-4 h-4 text-[#1E1E1E]" />
                                        </div>
                                        <h4 className="font-serif italic text-lg">Variables</h4>
                                    </div>
                                    <div className="space-y-2 text-[11px] opacity-80">
                                        <div className="flex justify-between border-b border-white/10 pb-1">
                                            <span>Nom :</span>
                                            <code className="text-[#B79A63]">{"{{name}}"}</code>
                                        </div>
                                        <div className="flex justify-between border-b border-white/10 pb-1">
                                            <span>Entreprise :</span>
                                            <code className="text-[#B79A63]">{"{{business}}"}</code>
                                        </div>
                                        <div className="mt-4 pt-2 border-t border-white/10">
                                            <p className="text-[10px] leading-relaxed italic text-[#B79A63]/70">
                                                Utilisez les boutons dans l'éditeur pour insérer ces variables rapidement.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
