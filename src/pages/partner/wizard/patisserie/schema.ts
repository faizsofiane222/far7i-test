import * as z from "zod";

export const patisserieSchema = z.object({
    commercial_name: z.string().min(2, "Le nom est requis (minimum 2 caractères)"),
    category_slug: z.string().default("piece_montee_tartes"),
    wilaya_id: z.string().min(1, "La wilaya est requise"),
    address: z.any().optional(),
    events_accepted: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    bio: z.string().optional(),

    produitsProposes: z.array(z.string()).min(1, "Veuillez sélectionner au moins un produit proposé"),

    personnalisationPossible: z.boolean(),
    optionsPersonnalisation: z.array(z.string()),

    installationSurLieu: z.boolean(),
    livraisonPossible: z.boolean(),
    wilayasLivraison: z.array(z.string()),

    prixAPartirDeDAParPiece: z.coerce.number().min(0, "Le prix ne peut pas être négatif").default(0),
    acompteMontantDA: z.coerce.number().min(0).optional(),
    politiqueAnnulation: z.string().optional(),

    media: z.array(z.string()).min(1, "La photo principale est requise").max(5, "Maximum 5 photos"),
    formulaire_far7i: z.boolean().default(true),
    phone: z.string().optional(),
}).superRefine((data, ctx) => {
    // 1. IF `livraisonPossible` is true, `wilayasLivraison` MUST have at least 1 item
    if (data.livraisonPossible && data.wilayasLivraison.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une wilaya de livraison",
            path: ["wilayasLivraison"],
        });
    }
});

export type PatisserieFormValues = z.infer<typeof patisserieSchema>;
