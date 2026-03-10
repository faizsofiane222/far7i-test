import * as z from "zod";

export const traiteurSchema = z.object({
    // Step 1: Identité
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    category_slug: z.string().default("traiteur"),
    wilaya_id: z.string().min(1, "Veuillez sélectionner une wilaya"),
    adresse: z.any().optional(), // Can be string or LocationData object from GoogleMapsLocator
    evenementsAccepte: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    description: z.string().optional(),

    // Step 2: Capacités & Spécialités
    couvertsMinimum: z.number().min(1, "Le minimum de couverts est requis"),
    couvertsMaximum: z.number().optional(),
    typeCuisine: z.array(z.string()).default([]),
    restaurationSalee: z.array(z.string()).default([]),
    restaurationSucree: z.array(z.string()).default([]),
    menusTypes: z.string().optional(),
    formulesPersonnalisables: z.string().optional(),

    // Step 3: Logistique & Équipements
    livraisonPossible: z.boolean().default(false),
    serviceSurPlace: z.boolean().default(false),

    // Personnel (conditional if serviceSurPlace is true)
    personnelDeService: z.boolean().default(false),
    maitreDHotel: z.boolean().default(false),

    // Mise en place (conditional)
    dressageTables: z.boolean().default(false),
    decorationSimple: z.boolean().default(false),

    // Après événement (conditional)
    nettoyage: z.boolean().default(false),

    // Unconditional matériels
    locationVaisselle: z.boolean().default(false),
    locationCouverts: z.boolean().default(false),
    locationNappes: z.boolean().default(false),

    gestionAllergies: z.boolean().default(false),

    // Step 4: Tarification
    prixAPartirDeParPersonneDA: z.number().min(0, "Le prix ne peut être négatif"),
    acompteMontantDA: z.number().optional(),
    politiqueAnnulation: z.string().optional(),

    // Step 5: Médias & Contact
    galeriePhotos: z.array(z.string()).min(1, "Au moins une photo est requise").max(5, "Maximum 5 photos autorisées"),
    utiliserFormulaireFar7i: z.boolean().default(true),
    telephone: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.couvertsMaximum && data.couvertsMaximum > 0 && data.couvertsMinimum > data.couvertsMaximum) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le minimum ne peut pas dépasser le maximum",
            path: ["couvertsMinimum"]
        });
    }
});

export type TraiteurFormValues = z.infer<typeof traiteurSchema>;
