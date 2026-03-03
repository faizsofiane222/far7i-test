import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Eye, Layout, FileText, Image as ImageIcon, User, Tags, Clock, Globe, Trash2, Bold, Italic, List, ListOrdered, Link as LinkIcon, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import DOMPurify from 'dompurify';
import { compressAndUpload } from "@/lib/image-utils";
import { useAuth } from "@/contexts/AuthContext";

export default function BlogEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isNew = !id || id === 'new';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("edit");

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "tendances",
        read_time: "5 min",
        image_url: "",
        excerpt: "",
        content: "",
        author_name: "Far7i Team",
        author_avatar: "",
        author_bio: "",
        tags: [] as string[],
        featured: false,
        status: "draft",
        published_at: null as string | null,
    });

    const [tagInput, setTagInput] = useState("");

    useEffect(() => {
        if (!isNew) {
            fetchArticle();
        }
    }, [id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('blog_articles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    ...data,
                    tags: data.tags || [],
                });
            }
        } catch (error: any) {
            toast.error("Erreur lors de la récupération de l'article");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Ensure slug is not empty
            const slugToUse = formData.slug.trim() || formData.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

            if (!slugToUse) {
                toast.error("Le titre est requis pour générer une URL");
                setSaving(false);
                return;
            }

            const submissionData = {
                ...formData,
                slug: slugToUse,
                updated_at: new Date().toISOString(),
                published_at: formData.status === 'published' && !formData.published_at ? new Date().toISOString() : formData.published_at
            };

            if (isNew) {
                const { error } = await supabase.from('blog_articles').insert([submissionData]);
                if (error) throw error;
                toast.success("Article créé avec succès");
            } else {
                const { error } = await supabase.from('blog_articles').update(submissionData).eq('id', id);
                if (error) throw error;
                toast.success("Article mis à jour");
            }
            navigate("/admin/blog");
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) {
            console.log("Upload aborted: No file or user", { file, user });
            return;
        }

        console.log("Starting image upload for cover:", file.name);
        const toastId = toast.loading("Compression de l'image...");

        // Add a safety timeout
        const timeoutId = setTimeout(() => {
            setUploading(prev => {
                if (prev) {
                    toast.error("L'upload semble bloqué. Veuillez rafraîchir la page ou réessayer.", { id: toastId });
                    return false;
                }
                return prev;
            });
        }, 45000); // 45 seconds

        try {
            setUploading(true);
            const { publicUrl, error: uploadError } = await compressAndUpload(
                file,
                user.id,
                {
                    bucket: "blog-images",
                    folder: `${user.id}/blog`,
                    maxWidthOrHeight: 1600
                }
            );

            if (uploadError) {
                // Fallback (legacy logic)
                if (uploadError.message?.includes("not found")) {
                    const backup = await compressAndUpload(file, user.id, { bucket: "avatars", folder: `${user.id}/blog`, maxWidthOrHeight: 1600 });
                    if (backup.error) throw backup.error;
                    setFormData(prev => ({ ...prev, image_url: backup.publicUrl }));
                } else {
                    throw uploadError;
                }
            } else {
                setFormData(prev => ({ ...prev, image_url: publicUrl }));
            }
            toast.success("Image uploadée avec succès", { id: toastId });
        } catch (error: any) {
            console.error("Crucial upload error:", error);
            toast.error("Erreur d'upload: " + (error.message || "Erreur inconnue"), { id: toastId });
        } finally {
            clearTimeout(timeoutId);
            setUploading(false);
            // Ensure cleaning the input
            e.target.value = '';
        }
    };

    const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        console.log("Starting content image upload:", file.name);
        const toastId = toast.loading("Compression de l'image...");

        const timeoutId = setTimeout(() => {
            setUploading(prev => {
                if (prev) {
                    toast.error("L'upload semble bloqué. Réessayez avec un fichier plus petit.", { id: toastId });
                    return false;
                }
                return prev;
            });
        }, 45000);

        try {
            setUploading(true);
            const { publicUrl, error: uploadError } = await compressAndUpload(
                file,
                user.id,
                {
                    bucket: "blog-images",
                    folder: `${user.id}/blog`,
                    maxWidthOrHeight: 1200
                }
            );

            let finalUrl = publicUrl;
            if (uploadError) {
                // Fallback
                if (uploadError.message?.includes("not found")) {
                    const backup = await compressAndUpload(file, user.id, { bucket: "avatars", folder: `${user.id}/blog`, maxWidthOrHeight: 1200 });
                    if (backup.error) throw backup.error;
                    finalUrl = backup.publicUrl;
                } else {
                    throw uploadError;
                }
            }

            console.log("Content Image Uploaded. Inserting into HTML...");
            const imgTag = `\n<img src="${finalUrl}" alt="Description" class="w-full rounded-lg mt-6 shadow-lg" />\n`;

            const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                setFormData(prev => ({
                    ...prev,
                    content: prev.content.substring(0, start) + imgTag + prev.content.substring(end)
                }));
            }

            toast.success("Image insérée", { id: toastId });
        } catch (error: any) {
            console.error("Content upload error:", error);
            toast.error("Erreur: " + (error.message || "Erreur inconnue"), { id: toastId });
        } finally {
            clearTimeout(timeoutId);
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: isNew ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') : prev.slug
        }));
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    // Toolbar actions for the simple HTML editor
    const insertTag = (tag: string, classes = "") => {
        let snippet = "";
        if (tag === 'p') snippet = `<p class="leading-relaxed mb-4">Texte ici...</p>`;
        else if (tag === 'h2') snippet = `<h2 class="text-3xl font-serif font-bold mb-4 mt-8">Titre de section</h2>`;
        else if (tag === 'img') snippet = `<img src="/images/placeholder.jpg" alt="Description" class="w-full rounded-lg mt-6 shadow-lg" />`;
        else if (tag === 'ul') snippet = `<ul class="space-y-4 list-none">\n    <li class="flex items-start">\n        <span class="text-primary font-bold text-xl mr-3">✦</span>\n        <div><strong>Titre</strong> : Description</div>\n    </li>\n</ul>`;
        else if (tag === 'div-alert') snippet = `<div class="mt-12 bg-muted/30 p-8 rounded-xl">\n    <h2 class="text-3xl font-serif font-bold mb-6">Titre encadré</h2>\n    <p class="leading-relaxed">Contenu ici...</p>\n</div>`;

        const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const content = formData.content;
            const newContent = content.substring(0, start) + snippet + content.substring(end);
            setFormData(prev => ({ ...prev, content: newContent }));
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B79A63]"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blog")}>
                            <ChevronLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-secondary">
                                {isNew ? "Nouvel Article" : "Modifier l'article"}
                            </h1>
                            <p className="text-xs text-muted-foreground">{formData.slug || "Générez un slug automatiquement"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mr-4 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                            <Switch
                                checked={formData.status === 'published'}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'published' : 'draft' }))}
                            />
                            <Label className="text-sm cursor-pointer">{formData.status === 'published' ? 'Publié' : 'Brouillon'}</Label>
                        </div>
                        <Button variant="outline" onClick={() => navigate("/admin/blog")}>Annuler</Button>
                        <Button
                            className="bg-[#B79A63] hover:bg-[#A68952] text-white gap-2"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save size={18} />
                            {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="edit" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Layout size={16} /> Édition
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Eye size={16} /> Prévisualisation
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Editor */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Titre de l'article</Label>
                                        <Input
                                            placeholder="Ex: Organiser son Mariage en Algérie..."
                                            value={formData.title}
                                            onChange={handleTitleChange}
                                            className="text-lg font-bold h-12"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Slug (URL)</Label>
                                            <Input
                                                placeholder="ex: mariage-algerie-2024"
                                                value={formData.slug}
                                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Catégorie</Label>
                                            <select
                                                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#B79A63]"
                                                value={formData.category}
                                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            >
                                                <option value="tendances">Tendances</option>
                                                <option value="conseils">Conseils</option>
                                                <option value="inspiration">Inspiration</option>
                                                <option value="gâteaux">Gâteaux</option>
                                                <option value="budget">Budget</option>
                                                <option value="organisation">Organisation</option>
                                                <option value="temoignages">Témoignages</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Extrait (Excerpt)</Label>
                                        <Textarea
                                            placeholder="Bref résumé de l'article pour les cartes..."
                                            value={formData.excerpt}
                                            onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                            className="h-20"
                                        />
                                    </div>
                                </Card>

                                <Card className="p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b pb-3">
                                        <Label className="text-base font-bold">Contenu HTML</Label>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => insertTag('p')} title="Paragraphe"><FileText size={16} /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => insertTag('h2')} title="Titre H2"><Bold size={16} /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => insertTag('ul')} title="Liste"><List size={16} /></Button>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="content-image-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleContentImageUpload}
                                                    disabled={uploading}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={uploading}
                                                    onClick={() => document.getElementById('content-image-upload')?.click()}
                                                    title="Uploader & Insérer Image"
                                                >
                                                    <ImageIcon size={16} className={uploading ? "animate-pulse" : ""} />
                                                </Button>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => insertTag('div-alert')} title="Bloc encadré"><Layout size={16} /></Button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Conseil : Utilisez les classes Tailwind comme dans l'exemple (space-y-8, list-none, text-primary, bg-muted/30).
                                    </p>
                                    <Textarea
                                        id="content-textarea"
                                        placeholder="Ecrivez votre HTML ici..."
                                        value={formData.content}
                                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                        className="h-[600px] font-mono text-sm leading-relaxed bg-slate-50 border-dashed"
                                    />
                                </Card>
                            </div>

                            {/* Sidebar Settings */}
                            <div className="space-y-6">
                                <Card className="p-6 space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 border-b pb-2">
                                        <ImageIcon size={18} className="text-[#B79A63]" /> Média & Promo
                                    </h3>
                                    <div className="space-y-2">
                                        <Label>Image Principale</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="URL de l'image..."
                                                value={formData.image_url}
                                                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                                                className="flex-1"
                                            />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="cover-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={uploading}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    disabled={uploading}
                                                    onClick={() => document.getElementById('cover-upload')?.click()}
                                                    title="Uploader une image"
                                                >
                                                    <ImageIcon size={18} className={uploading ? "animate-pulse" : ""} />
                                                </Button>
                                            </div>
                                        </div>
                                        {formData.image_url && (
                                            <div className="relative mt-2 aspect-video rounded-lg overflow-hidden border group">
                                                <img src={formData.image_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Mettre en avant</Label>
                                        <Switch
                                            checked={formData.featured}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Temps de lecture</Label>
                                        <Input
                                            placeholder="9 min"
                                            value={formData.read_time}
                                            onChange={(e) => setFormData(prev => ({ ...prev, read_time: e.target.value }))}
                                        />
                                    </div>
                                </Card>

                                <Card className="p-6 space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 border-b pb-2">
                                        <User size={18} className="text-[#B79A63]" /> Auteur
                                    </h3>
                                    <div className="space-y-2">
                                        <Label>Nom</Label>
                                        <Input
                                            value={formData.author_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Avatar (URL)</Label>
                                        <Input
                                            value={formData.author_avatar}
                                            onChange={(e) => setFormData(prev => ({ ...prev, author_avatar: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bio courte</Label>
                                        <Textarea
                                            className="h-16"
                                            value={formData.author_bio}
                                            onChange={(e) => setFormData(prev => ({ ...prev, author_bio: e.target.value }))}
                                        />
                                    </div>
                                </Card>

                                <Card className="p-6 space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 border-b pb-2">
                                        <Tags size={18} className="text-[#B79A63]" /> Tags
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.tags.map(tag => (
                                            <Badge key={tag} className="gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ajouter un tag..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        />
                                        <Button variant="outline" size="sm" onClick={addTag}>+</Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-6 border rounded-xl overflow-hidden bg-white shadow-2xl">
                        {/* Realistic Preview */}
                        <div className="max-h-[800px] overflow-y-auto w-full bg-[#F8F5F0]">
                            {/* Hero Mockup */}
                            <div className="relative h-[400px] w-full bg-slate-200">
                                {formData.image_url ? (
                                    <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        Image de couverture non définie
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8 text-center">
                                    <div className="text-white space-y-4 max-w-4xl">
                                        <Badge className="bg-[#B79A63] text-white border-0">{formData.category.toUpperCase()}</Badge>
                                        <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
                                            {formData.title || "Titre de l'article"}
                                        </h1>
                                        <div className="flex items-center justify-center gap-4 text-sm opacity-90">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {formData.read_time}</span>
                                            <span>•</span>
                                            <span>{new Date().toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="container mx-auto px-4 py-12 max-w-3xl">
                                {formData.excerpt && (
                                    <p className="text-xl font-serif italic text-muted-foreground mb-10 leading-relaxed border-l-4 border-[#B79A63] pl-6 py-2">
                                        {formData.excerpt}
                                    </p>
                                )}

                                <div
                                    className="article-content"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(formData.content, {
                                            ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'img', 'blockquote', 'code', 'pre', 'div', 'span'],
                                            ALLOWED_ATTR: ['href', 'src', 'alt', 'id', 'class', 'target', 'rel']
                                        })
                                    }}
                                />

                                <div className="mt-16 pt-8 border-t flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                                        {formData.author_avatar && <img src={formData.author_avatar} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-secondary">{formData.author_name}</div>
                                        <div className="text-sm text-muted-foreground italic">{formData.author_bio}</div>
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
