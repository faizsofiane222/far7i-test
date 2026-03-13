import * as z from "zod";

export const locationTenuesSchema = z.object({
    commercial_name: z.string().min(2, "Le nom est requis (minimum 2 caractères)"),
    category_slug: z.string().default("location_tenues"),
    wilaya_id: z.string().min(1, "La wilaya est requise"),
    address: z.any().optional(),
    events_accepted: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    bio: z.string().optional(),

    cibles: z.object({
        cibleFemmes: z.boolean(),
        cibleHommes: z.boolean(),
    }),
    styles: z.object({
        styleTraditionnel: z.boolean(),
        styleModerne: z.boolean(),
    }),

    services: z.array(z.string()),

    livraisonSurPlace: z.boolean(),
    wilayasLivraison: z.array(z.string()),

    prixAPartirDeDAParTenue: z.coerce.number().min(0, "Le prix ne peut pas être négatif").default(0),
    acompteMontantDA: z.coerce.number().min(0).optional(),
    cautionMontantDA: z.coerce.number().min(0).optional(),
    politiqueAnnulation: z.string().optional(),

    media: z.array(z.string()).min(1, "La photo principale est requise").max(5, "Maximum 5 photos"),
    formulaire_far7i: z.boolean().default(true),
    phone: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.cibles.cibleFemmes && !data.cibles.cibleHommes) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une cible (Femmes ou Hommes)",
            path: ["cibles"],
        });
    }

    if (!data.styles.styleTraditionnel && !data.styles.styleModerne) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins un style (Traditionnel ou Moderne)",
            path: ["styles"],
        });
    }

    if (data.livraisonSurPlace && data.wilayasLivraison.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une wilaya de livraison",
            path: ["wilayasLivraison"],
        });
    }
});

export type LocationTenuesFormValues = z.infer<typeof locationTenuesSchema>;
