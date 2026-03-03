import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Edit, Trash2, Eye, Clock, Calendar, CheckCircle2, Circle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

export default function BlogList() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('blog_articles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setArticles(data || []);
        } catch (error: any) {
            console.error("Error fetching articles:", error);
            toast.error("Erreur lors de la récupération des articles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, [statusFilter]);

    const handleDelete = async () => {
        if (!articleToDelete) return;

        try {
            const { error } = await supabase
                .from('blog_articles')
                .delete()
                .eq('id', articleToDelete);

            if (error) throw error;
            toast.success("Article supprimé");
            setDeleteDialogOpen(false);
            setArticleToDelete(null);
            fetchArticles();
        } catch (error: any) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-secondary">Blog & Articles</h1>
                        <p className="text-muted-foreground mt-1">Gérez le contenu éditorial de Far7i</p>
                    </div>
                    <Button
                        onClick={() => navigate("/admin/blog/new")}
                        className="bg-[#B79A63] hover:bg-[#A68952] text-white gap-2"
                    >
                        <Plus size={18} />
                        Nouvel Article
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Rechercher par titre ou catégorie..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 px-3 py-2 bg-white border border-input rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="published">Publiés</option>
                        <option value="draft">Brouillons</option>
                    </select>
                    <div className="flex items-center justify-end text-sm text-muted-foreground">
                        {filteredArticles.length} article(s) trouvé(s)
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b">
                                    <th className="p-4 font-serif font-bold text-slate-700">Article</th>
                                    <th className="p-4 font-serif font-bold text-slate-700">Catégorie</th>
                                    <th className="p-4 font-serif font-bold text-slate-700">Statut</th>
                                    <th className="p-4 font-serif font-bold text-slate-700">Date</th>
                                    <th className="p-4 font-serif font-bold text-slate-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                                            Chargement des articles...
                                        </td>
                                    </tr>
                                ) : filteredArticles.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                                            Aucun article trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredArticles.map((article) => (
                                        <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <Link
                                                    to={`/admin/blog/edit/${article.id}`}
                                                    className="flex items-center gap-3 group"
                                                >
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border group-hover:border-[#B79A63] transition-colors">
                                                        {article.image_url ? (
                                                            <img src={article.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <FileText size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-secondary truncate group-hover:text-[#B79A63] transition-colors" title={article.title}>
                                                            {article.title}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                                                            {article.slug}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="capitalize">
                                                    {article.category}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {article.status === 'published' ? (
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                                                            <CheckCircle2 size={12} />
                                                            Publié
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                                            <Circle size={12} className="fill-current" />
                                                            Brouillon
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                <div className="flex flex-col">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {article.published_at ? format(new Date(article.published_at), 'dd MMM yyyy', { locale: fr }) : 'Non publié'}
                                                    </span>
                                                    <span className="flex items-center gap-1 opacity-60">
                                                        <Clock size={12} />
                                                        {article.read_time}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => window.open(`/inspiration/${article.slug}`, '_blank')}
                                                        title="Voir sur le site"
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/admin/blog/edit/${article.id}`)}
                                                        className="text-blue-600"
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setArticleToDelete(article.id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setDeleteDialogOpen(false);
                            setArticleToDelete(null);
                        }}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
