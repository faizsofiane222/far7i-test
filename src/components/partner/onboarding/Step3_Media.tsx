import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, X, Star } from "lucide-react";
import { useCallback } from "react";

export const Step3_Media = () => {
    const { description, setDescription, media, addMedia, removeMedia, setMainMedia } = useOnboardingStore();

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addMedia(Array.from(e.target.files));
        }
    }, [addMedia]);

    return (
        <div className="space-y-10">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Vitrine & Médias</h2>
                <p className="text-[#1E1E1E]/60 mt-2">Présentez-vous aux futurs mariés avec une belle description et vos meilleures photos.</p>
            </div>

            <div className="space-y-4">
                <Label className="text-[#1E1E1E] text-lg font-serif">Description de vos services *</Label>
                <p className="text-sm text-[#1E1E1E]/60 mb-2">Décrivez votre expérience, votre passion, et ce qui vous rend unique.</p>
                <Textarea
                    placeholder="Ex: Passionné par l'événementiel depuis 10 ans, je propose un accompagnement sur mesure..."
                    className="min-h-[150px] bg-white border-[#D4D2CF] focus:border-[#B79A63] resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-[#1E1E1E] text-lg font-serif">Vos réalisations en photos *</Label>
                    <span className="text-sm font-medium text-[#1E1E1E]/50">{media.length} / 5</span>
                </div>
                <p className="text-sm text-[#1E1E1E]/60 mb-2">Ajoutez jusqu'à 5 photos. La première sera votre photo principale.</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {media.map((item, index) => (
                        <div key={item.url} className="relative group aspect-square rounded-xl overflow-hidden border border-[#D4D2CF]">
                            <img src={item.url} alt="Aperçu" className="w-full h-full object-cover" />

                            <button
                                onClick={() => removeMedia(index)}
                                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                title="Supprimer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => setMainMedia(index)}
                                className={`absolute bottom-2 left-2 px-2 py-1 flex items-center gap-1 text-[10px] font-bold uppercase rounded-md backdrop-blur-md transition-all ${item.isMain ? 'bg-[#B79A63] text-white' : 'bg-white/80 text-[#1E1E1E] opacity-0 group-hover:opacity-100'
                                    }`}
                            >
                                <Star className={`w-3 h-3 ${item.isMain ? 'fill-white' : ''}`} />
                                {item.isMain ? 'Principale' : 'Définir principale'}
                            </button>
                        </div>
                    ))}

                    {media.length < 5 && (
                        <label className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D4D2CF] bg-[#F8F5F0]/50 text-[#1E1E1E]/40 hover:bg-[#F8F5F0] hover:border-[#B79A63]/50 hover:text-[#B79A63] cursor-pointer transition-all">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-xs font-bold uppercase tracking-wider">Ajouter</span>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};
