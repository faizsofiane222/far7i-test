import * as z from "zod";

export const beauteSchema = z.object({
    nom: z.string().min(2, "Le nom est requis (minimum 2 caractères)"),
    category_slug: z.string().default("coiffure_beaute"),
    wilaya_id: z.string().min(1, "La wilaya est requise"),
    adresse: z.string(),
    evenementsAccepte: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    description: z.string().optional(),

    specialites: z.object({
        hasCoiffure: z.boolean(),
        hasMaquillage: z.boolean(),
    }),
    retouchesPendantEvenement: z.boolean(),

    organisation: z.object({
        prestationSalon: z.boolean(),
        prestationSurLieu: z.boolean(),
    }),
    deplacementPossible: z.boolean(),
    wilayasDeplacement: z.array(z.string()),

    prixAPartirDeDA: z.coerce.number().min(0, "Le prix ne peut pas être négatif").default(0),
    acompteMontantDA: z.coerce.number().min(0).optional(),
    politiqueAnnulation: z.string().optional(),

    galeriePhotos: z.array(z.string()).min(1, "La photo principale est requise").max(5, "Maximum 5 photos"),
    utiliserFormulaireFar7i: z.boolean().default(true),
    telephone: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.specialites.hasCoiffure && !data.specialites.hasMaquillage) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une prestation",
            path: ["specialites"],
        });
    }

    if (!data.organisation.prestationSalon && !data.organisation.prestationSurLieu) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins un mode d'intervention",
            path: ["organisation"],
        });
    }

    if (data.organisation.prestationSurLieu && data.deplacementPossible && data.wilayasDeplacement.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une wilaya de déplacement",
            path: ["wilayasDeplacement"],
        });
    }
});

export type BeauteFormValues = z.infer<typeof beauteSchema>;
