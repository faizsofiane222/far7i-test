import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GildedButton } from "./components/GildedButton";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SplitScreenLayout } from "./components/SplitScreenLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function UpdatePassword() {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (newPassword.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            toast.success("Mot de passe mis à jour avec succès !");
            navigate("/partner/dashboard");
        } catch (error: any) {
            console.error("Update password error:", error);
            setError(error.message || "Erreur lors de la mise à jour du mot de passe");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SplitScreenLayout>
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-[#1E1E1E] mb-2">
                        Nouveau mot de passe
                    </h1>
                    <p className="text-slate-600 font-sans">
                        Définissez un mot de passe sécurisé pour votre compte
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <PasswordInput
                            id="newPassword"
                            placeholder="Minimum 6 caractères"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            error={!!error && error.includes("6 caractères")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <PasswordInput
                            id="confirmPassword"
                            placeholder="Retapez votre mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            error={!!error && error.includes("correspondent pas")}
                        />
                    </div>

                    <GildedButton
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Mise à jour..." : "Mettre à jour"}
                    </GildedButton>
                </form>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs text-slate-600 font-sans">
                        <strong>Conseil de sécurité :</strong> Utilisez un mot de passe unique contenant des lettres, chiffres et caractères spéciaux.
                    </p>
                </div>
            </div>
        </SplitScreenLayout>
    );
}
