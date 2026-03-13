import * as z from "zod";

export const photographeSchema = z.object({
    // Step 1: Identité
    commercial_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    category_slug: z.string().default("photographe"),
    wilaya_id: z.string().min(1, "Veuillez sélectionner une wilaya"),
    address: z.any().optional(), // Updated to match Map Locator object
    events_accepted: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    bio: z.string().optional(),

    // Step 2: Spécialités & Couverture
    isPhotographe: z.boolean().default(false),
    isVideaste: z.boolean().default(false),
    couverture: z.array(z.string()).default([]),

    // Step 3: Services & Livrables
    optionsTechniques: z.array(z.string()).default([]),

    livrables: z.object({
        hasAlbums: z.boolean().default(false),
        quantiteAlbums: z.coerce.number().optional(),

        hasAlbumsSupp: z.boolean().default(false),
        quantiteAlbumsSupp: z.coerce.number().optional(),

        hasTirages: z.boolean().default(false),
        quantiteTirages: z.coerce.number().optional(),

        hasCadres: z.boolean().default(false),
        quantiteCadres: z.coerce.number().optional(),

        hasClesUSB: z.boolean().default(false),
        quantiteClesUSB: z.coerce.number().optional(),

        livraisonExpress: z.boolean().default(false),
        filmLong: z.boolean().default(false),
        filmCourt: z.boolean().default(false),
    }),

    // Step 4: Tarification
    deplacementPossible: z.boolean().default(false),
    wilayasDeplacement: z.array(z.string()).default([]),

    prixAPartirDeDA: z.coerce.number().min(0, "Le prix ne peut être négatif"),
    acompteMontantDA: z.coerce.number().optional(),
    politiqueAnnulation: z.string().optional(),
    delaisLivraisonSemaines: z.coerce.number().min(1, "Minimum 1 semaine de délai").default(4),

    // Step 5: Médias & Contact
    media: z.array(z.string()).min(1, "Au moins une photo principale est requise").max(5, "Maximum 5 photos autorisées"),
    formulaire_far7i: z.boolean().default(true),
    phone: z.string().optional(),
}).superRefine((data, ctx) => {
    // 1. Photo OR Video must be checked
    if (!data.isPhotographe && !data.isVideaste) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Sélectionnez au moins une spécialité (Photographie et/ou Vidéo)",
            path: ["isPhotographe"]
        });
    }

    // 2. Deployment possible requires at least one wilaya
    if (data.deplacementPossible && data.wilayasDeplacement.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une wilaya de déplacement",
            path: ["wilayasDeplacement"]
        });
    }

    // 3. Deliverables quantities
    const { livrables } = data;
    if (livrables.hasAlbums && (!livrables.quantiteAlbums || livrables.quantiteAlbums < 1)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantité requise", path: ["livrables.quantiteAlbums"] });
    }
    if (livrables.hasAlbumsSupp && (!livrables.quantiteAlbumsSupp || livrables.quantiteAlbumsSupp < 1)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantité requise", path: ["livrables.quantiteAlbumsSupp"] });
    }
    if (livrables.hasTirages && (!livrables.quantiteTirages || livrables.quantiteTirages < 1)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantité requise", path: ["livrables.quantiteTirages"] });
    }
    if (livrables.hasCadres && (!livrables.quantiteCadres || livrables.quantiteCadres < 1)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantité requise", path: ["livrables.quantiteCadres"] });
    }
    if (livrables.hasClesUSB && (!livrables.quantiteClesUSB || livrables.quantiteClesUSB < 1)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantité requise", path: ["livrables.quantiteClesUSB"] });
    }
});

export type PhotographeFormValues = z.infer<typeof photographeSchema>;
