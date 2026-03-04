import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SplitScreenLayout } from "@/pages/partner/components/SplitScreenLayout";
import { GildedInput } from "@/pages/partner/components/GildedInput";
import { GildedButton } from "@/pages/partner/components/GildedButton";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const resetSchema = z.object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

export default function ResetPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const form = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof resetSchema>) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: values.password
            });

            if (error) throw error;

            toast.success("Mot de passe mis à jour avec succès !");
            navigate("/partner/auth");
        } catch (error: any) {
            console.error("Error resetting password:", error);
            toast.error(error.message || "Impossible de réinitialiser le mot de passe");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SplitScreenLayout>
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#F8F5F0] rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-[#B79A63]" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-[#1E1E1E] mb-2">
                        Nouveau mot de passe
                    </h1>
                    <p className="text-slate-500 font-sans">
                        Veuillez saisir votre nouveau mot de passe.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nouveau mot de passe</FormLabel>
                                    <FormControl><PasswordInput {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmer le mot de passe</FormLabel>
                                    <FormControl><PasswordInput {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <GildedButton
                            type="submit"
                            className="w-full mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Mise à jour...
                                </>
                            ) : (
                                "Réinitialiser"
                            )}
                        </GildedButton>
                    </form>
                </Form>
            </div>
        </SplitScreenLayout>
    );
}
