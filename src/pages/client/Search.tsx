import { ShieldAlert } from "lucide-react";

export default function Search() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
            <div className="text-center p-8 max-w-lg">
                <ShieldAlert className="w-16 h-16 text-[#B79A63] mx-auto mb-4" />
                <h1 className="text-3xl font-serif text-[#1E1E1E] font-bold mb-4">
                    Espace Client en Construction
                </h1>
                <p className="text-slate-600">
                    La recherche et l'espace client ne sont pas encore disponibles. L'équipe Far7i travaille dur pour vous offrir une expérience de recherche de prestataires exceptionnelle.
                </p>
            </div>
        </div>
    );
}
