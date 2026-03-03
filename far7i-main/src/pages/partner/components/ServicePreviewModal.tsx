import { X, Star, ChevronLeft, ChevronRight, Check, Plus, Minus, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Inclusion {
    item_text: string;
    inclusion_type: 'included' | 'optional' | 'excluded';
}

interface Option {
    title: string;
    description: string;
    price: number;
}

interface FAQ {
    question: string;
    answer: string;
}

interface ServicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: {
        title: string;
        description: string;
        base_price: number;
        price_unit: string;
        short_pitch: string;
        service_category_id: string;
    };
    media: string[];
    inclusions: Inclusion[];
    options: Option[];
    faqs: FAQ[];
    commercialName: string;
    categoryLabel?: string;
}

function stripHtml(html: string): string {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

function formatPriceUnit(unit: string) {
    switch (unit) {
        case 'per_event': return 'évènement';
        case 'per_hour': return 'heure';
        case 'per_day': return 'jour';
        case 'per_person': return 'personne';
        case 'fixed': return 'forfait';
        default: return unit;
    }
}

export function ServicePreviewModal({
    isOpen, onClose,
    formData, media, inclusions, options, faqs,
    commercialName, categoryLabel
}: ServicePreviewModalProps) {
    const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
    const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

    if (!isOpen) return null;

    const included = inclusions.filter(i => i.inclusion_type === 'included');
    const optional = inclusions.filter(i => i.inclusion_type === 'optional');
    const excluded = inclusions.filter(i => i.inclusion_type === 'excluded');

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6">
            <div className="relative w-full max-w-4xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE8] bg-[#1E1E1E]">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#B79A63] animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#B79A63]">Prévisualisation client</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Media Gallery */}
                {media.length > 0 && (
                    <div className="relative bg-[#1E1E1E] aspect-[16/7] overflow-hidden">
                        <img
                            src={media[currentMediaIdx]}
                            alt={`Photo ${currentMediaIdx + 1}`}
                            className="w-full h-full object-cover opacity-90"
                        />

                        {/* Nav arrows */}
                        {media.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentMediaIdx(i => (i - 1 + media.length) % media.length)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentMediaIdx(i => (i + 1) % media.length)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {/* Dots */}
                        {media.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {media.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentMediaIdx(i)}
                                        className={cn("w-2 h-2 rounded-full transition-all", i === currentMediaIdx ? "bg-[#B79A63] w-4" : "bg-white/50")}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Thumbnail strip */}
                        {media.length > 1 && (
                            <div className="absolute bottom-12 right-4 flex gap-1.5">
                                {media.map((url, i) => (
                                    <button key={i} onClick={() => setCurrentMediaIdx(i)} className={cn("w-12 h-9 rounded-lg overflow-hidden border-2 transition-all", i === currentMediaIdx ? "border-[#B79A63]" : "border-white/20")}>
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* No media placeholder */}
                {media.length === 0 && (
                    <div className="aspect-[16/5] bg-gradient-to-br from-[#1E1E1E] to-[#3a3a3a] flex items-center justify-center">
                        <p className="text-white/30 text-sm font-medium italic">Aucune photo — ajoutez des photos pour améliorer l'attractivité</p>
                    </div>
                )}

                <div className="p-6 md:p-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div className="space-y-2 flex-1">
                            <span className="text-[11px] font-bold text-[#B79A63] uppercase tracking-[0.2em]">
                                {categoryLabel || 'Service'} • {commercialName || 'Votre enseigne'}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1E1E1E] leading-tight">
                                {formData.title || <span className="text-[#D4D2CF]">Nom de la prestation...</span>}
                            </h2>
                            {formData.short_pitch && (
                                <p className="text-base text-[#1E1E1E]/70 font-medium italic">{formData.short_pitch}</p>
                            )}

                            {/* Mock rating */}
                            <div className="flex items-center gap-2 pt-1">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={cn("w-4 h-4", s <= 4 ? "text-[#B79A63] fill-[#B79A63]" : "text-[#D4D2CF]")} />
                                    ))}
                                </div>
                                <span className="text-sm text-[#1E1E1E]/50 font-medium">Aucun avis pour le moment</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="bg-[#F8F5F0] rounded-2xl p-5 text-center md:text-right shrink-0 border border-[#D4D2CF]/60">
                            <p className="text-[10px] font-bold text-[#1E1E1E]/40 uppercase tracking-widest mb-1">À partir de</p>
                            <p className="text-3xl font-serif font-bold text-[#1E1E1E]">
                                {formData.base_price > 0 ? `${formData.base_price.toLocaleString()} DZD` : <span className="text-[#D4D2CF] text-2xl">—</span>}
                            </p>
                            <p className="text-xs text-[#1E1E1E]/40 font-bold uppercase tracking-wider">/ {formatPriceUnit(formData.price_unit)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            {/* Description */}
                            {formData.description && (
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-[#1E1E1E] mb-3">Description</h3>
                                    <div
                                        className="prose prose-sm max-w-none text-[#1E1E1E]/70 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: formData.description }}
                                    />
                                </div>
                            )}

                            {/* Inclusions */}
                            {inclusions.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4">Ce qui est inclus</h3>
                                    <div className="space-y-2">
                                        {included.map((inc, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-sm text-[#1E1E1E] font-medium">{inc.item_text}</span>
                                            </div>
                                        ))}
                                        {optional.map((inc, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center shrink-0">
                                                    <Plus className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-sm text-[#1E1E1E] font-medium">{inc.item_text}<span className="text-blue-500 text-xs ml-1">(en option)</span></span>
                                            </div>
                                        ))}
                                        {excluded.map((inc, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                                <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center shrink-0">
                                                    <Minus className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-sm text-[#1E1E1E]/60 font-medium line-through">{inc.item_text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Options */}
                            {options.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4">Options supplémentaires</h3>
                                    <div className="space-y-3">
                                        {options.map((opt, i) => (
                                            <div key={i} className="flex justify-between items-start p-4 bg-[#F8F5F0] rounded-xl border border-[#D4D2CF]/60">
                                                <div>
                                                    <p className="font-bold text-[#1E1E1E] text-sm">{opt.title}</p>
                                                    {opt.description && <p className="text-xs text-[#1E1E1E]/50 mt-0.5">{opt.description}</p>}
                                                </div>
                                                <span className="text-sm font-bold text-[#B79A63] shrink-0 ml-4">+{opt.price.toLocaleString()} DZD</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* FAQ */}
                            {faqs.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-[#1E1E1E] mb-4">Questions fréquentes</h3>
                                    <div className="space-y-2">
                                        {faqs.map((faq, i) => (
                                            <div key={i} className="border border-[#D4D2CF] rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8F5F0] transition-colors"
                                                >
                                                    <span className="text-sm font-bold text-[#1E1E1E]">{faq.question}</span>
                                                    <span className={cn("text-[#B79A63] transition-transform", openFaqIdx === i ? "rotate-45" : "")}>
                                                        <Plus className="w-4 h-4" />
                                                    </span>
                                                </button>
                                                {openFaqIdx === i && (
                                                    <div className="px-4 pb-4 text-sm text-[#1E1E1E]/70 leading-relaxed border-t border-[#F8F5F0]">
                                                        {faq.answer}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar: Contact CTA */}
                        <div className="space-y-4">
                            <div className="bg-[#1E1E1E] rounded-2xl p-6 text-center sticky top-4">
                                <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Intéressé ?</p>
                                <p className="text-white font-serif text-lg mb-4">Contactez ce prestataire</p>

                                <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#B79A63] text-white rounded-xl text-sm font-bold uppercase tracking-wider mb-3 hover:bg-[#A68952] transition-colors">
                                    <Phone className="w-4 h-4" />
                                    Appeler
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider mb-3 hover:bg-green-700 transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                    WhatsApp
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 py-3 border border-white/20 text-white/60 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                    Voir le profil
                                </button>

                                <p className="text-white/20 text-[10px] mt-4 italic">Simulation — Les boutons sont désactivés en prévisualisation</p>
                            </div>

                            {/* Score indicator */}
                            <div className="bg-[#F8F5F0] rounded-2xl p-4 text-center border border-[#D4D2CF]/50">
                                <p className="text-[10px] font-bold text-[#B79A63] uppercase tracking-widest mb-2">Ce que les mariés voient</p>
                                <p className="text-xs text-[#1E1E1E]/60">Complétez votre prestation pour maximiser votre visibilité sur Far7i.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
