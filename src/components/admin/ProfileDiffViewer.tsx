import React from "react";
import { ArrowRight, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileDiffViewerProps {
    oldData: any;
    newData: any;
    category?: string;
}

export function ProfileDiffViewer({ oldData, newData, category }: ProfileDiffViewerProps) {
    if (!newData) return null;

    const modifiedFields = Object.keys(newData).filter(key => {
        const oldVal = oldData[key];
        const newVal = newData[key];
        if (oldVal === newVal) return false;
        if (!oldVal && !newVal) return false;
        return true;
    });

    if (modifiedFields.length === 0) return (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 text-slate-500 italic text-sm">
            <Info className="w-4 h-4" /> Aucun changement détecté dans les données brutes.
        </div>
    );

    const getFieldLabel = (key: string) => {
        const labels: Record<string, string> = {
            commercial_name: "Nom Commercial",
            bio: "Description / Bio",
            phone_number: "Numéro de Téléphone",
            social_link: "Lien Réseaux Sociaux",
            wilaya_id: "Wilaya",
            profile_picture_url: "Photo de Profil",
            is_whatsapp_active: "WhatsApp",
            is_viber_active: "Viber",
            provider_type: "Type de Prestataire",
            base_price: "Prix de Base",
            address: "Adresse"
        };
        return labels[key] || key.replace(/_/g, ' ');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Comparatif des modifications</h4>
            </div>
            
            <div className="grid gap-3">
                {modifiedFields.map(key => (
                    <div key={key} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getFieldLabel(key)}</span>
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">MODIFIÉ</span>
                        </div>
                        <div className="p-4 grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-300 uppercase">Ancien</p>
                                <p className="text-sm text-slate-500 line-through truncate max-w-[150px]" title={String(oldData[key] || '—')}>
                                    {String(oldData[key] || '—')}
                                </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-blue-400" />
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-bold text-blue-300 uppercase">Nouveau</p>
                                <p className="text-sm text-blue-700 font-bold truncate max-w-[150px]" title={String(newData[key] || '—')}>
                                    {String(newData[key] || '—')}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
