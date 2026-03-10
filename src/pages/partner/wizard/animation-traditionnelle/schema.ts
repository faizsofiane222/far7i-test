import * as z from "zod";

export const animationTraditionnelleSchema = z.object({
    nom: z.string().min(2, "Le nom est requis (minimum 2 caractères)"),
    category_slug: z.string().default("animation_musicale_traditionnelle"),
    wilaya_id: z.string().min(1, "La wilaya est requise"),
    adresse: z.string(), // Maps pin typically returns an address or coords
    evenementsAccepte: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    description: z.string().optional(),

    hasZorna: z.boolean(),
    hasKarkabou: z.boolean(),
    hasBendir: z.boolean(),
    hasAutre: z.boolean(),
    autreAnimationSpecifiez: z.string().optional(),

    deplacementPossible: z.boolean(),
    wilayasDeplacement: z.array(z.string()),

    prixAPartirDeDA: z.coerce.number().min(0, "Le prix ne peut pas être négatif").default(0),
    acompteMontantDA: z.coerce.number().min(0).optional(),
    politiqueAnnulation: z.string().optional(),

    galeriePhotos: z.array(z.string()).min(1, "La photo principale est requise").max(5, "Maximum 5 photos"),
    utiliserFormulaireFar7i: z.boolean().default(true),
    telephone: z.string().optional(),
}).superRefine((data, ctx) => {
    // 1. At least one animation type
    const hasAnimation = data.hasZorna || data.hasKarkabou || data.hasBendir || data.hasAutre;
    if (!hasAnimation) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins un type d'animation (Zorna, Karkabou, Bendir...)",
            path: ["hasZorna"],
        });
    }

    // 2. IF `hasAutre` is true, `autreAnimationSpecifiez` MUST NOT be empty
    if (data.hasAutre && (!data.autreAnimationSpecifiez || data.autreAnimationSpecifiez.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez préciser votre style d'animation",
            path: ["autreAnimationSpecifiez"],
        });
    }

    // 3. IF `deplacementPossible` is true, `wilayasDeplacement` MUST have at least 1 item
    if (data.deplacementPossible && data.wilayasDeplacement.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une wilaya de déplacement",
            path: ["wilayasDeplacement"],
        });
    }
});

export type AnimationTraditionnelleFormValues = z.infer<typeof animationTraditionnelleSchema>;
