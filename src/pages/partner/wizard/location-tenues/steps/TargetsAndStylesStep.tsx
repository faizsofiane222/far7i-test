import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export default function TargetsAndStylesStep() {
    const { watch, setValue, formState: { errors } } = useFormContext();
    const cibles = watch("cibles");
    const styles = watch("styles");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-lato">
            <div className="mb-6">
                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">2. Cibles & Styles</h2>
                <p className="text-sm text-[#1E1E1E]/80 mb-6 font-lato">Pour qui confectionnez-vous et quel est votre univers créatif ?</p>
            </div>

            <div className="space-y-6 bg-[#EBE6DA] p-6 rounded-2xl border border-[#D4D2CF]/50">

                <div>
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">A qui s'adressent vos tenues ? (Au moins 1 cible) *</label>
                    <div className="flex flex-col gap-3">
                        <div
                            onClick={() => setValue("cibles.cibleFemmes", !cibles.cibleFemmes, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                cibles.cibleFemmes
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", cibles.cibleFemmes ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {cibles.cibleFemmes && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Femmes (Robes de mariée, tenues traditionnelles, invitées...)</span>
                        </div>
                        <div
                            onClick={() => setValue("cibles.cibleHommes", !cibles.cibleHommes, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                cibles.cibleHommes
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", cibles.cibleHommes ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {cibles.cibleHommes && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Hommes (Costumes, burnous, tenues traditionnelles...)</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#D4D2CF]/50">
                    <label className="block text-sm font-bold text-[#1E1E1E] mb-4">Quels sont les styles proposés ? (Au moins 1 style) *</label>
                    <div className="flex flex-col gap-3">
                        <div
                            onClick={() => setValue("styles.styleTraditionnel", !styles.styleTraditionnel, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                styles.styleTraditionnel
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", styles.styleTraditionnel ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {styles.styleTraditionnel && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Style Traditionnel Algérien (Karakou, Chedda, Blousa...)</span>
                        </div>
                        <div
                            onClick={() => setValue("styles.styleModerne", !styles.styleModerne, { shouldValidate: true })}
                            className={cn(
                                "min-h-[48px] px-4 py-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-sm font-bold",
                                styles.styleModerne
                                    ? "border-[#B79A63] bg-[#F8F5F0] text-[#1E1E1E]"
                                    : "border-[#D4D2CF] bg-white text-[#1E1E1E]/70 hover:border-[#B79A63]"
                            )}
                        >
                            <div className={cn("w-4 h-4 border rounded bg-white flex items-center justify-center flex-shrink-0", styles.styleModerne ? "border-[#B79A63] bg-[#B79A63]" : "border-[#D4D2CF]")}>
                                {styles.styleModerne && <div className="w-2 h-2 rounded-[1px] bg-white" />}
                            </div>
                            <span className="leading-tight">Style Moderne / Classique (Robes blanches, costumes classiques...)</span>
                        </div>
                    </div>
                </div>

                {/* Validation errors for the whole step form */}
                {(errors.cibles || errors.styles) && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 mt-4">
                        {errors.cibles && <p className="text-red-600 text-xs font-bold w-full">{errors.cibles.message as string}</p>}
                        {errors.styles && <p className="text-red-600 text-xs font-bold w-full">{errors.styles.message as string}</p>}
                    </div>
                )}

                <div className="pt-2">
                    <p className="flex items-center gap-2 text-xs text-[#1E1E1E]/80">
                        <Info className="w-4 h-4 text-[#B79A63] flex-shrink-0" />
                        Sélectionnez au moins une cible et un style pour apparaître dans les bons résultats de recherche.
                    </p>
                </div>
            </div>
        </div>
    );
}
