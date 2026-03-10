import * as z from "zod";

export const locationVoitureSchema = z.object({
    nom: z.string().min(2, "Le nom est requis (minimum 2 caractères)"),
    category_slug: z.string().default("location_voiture"),
    wilaya_id: z.string().min(1, "La wilaya est requise"),
    adresse: z.string(),
    evenementsAccepte: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    description: z.string().optional(),

    prestations: z.object({
        locationAvecChauffeur: z.boolean(),
        locationSansChauffeur: z.boolean(),
        vehiculesVintage: z.boolean(),
        vehiculesUtilitaires: z.boolean(),
    }),

    organisation: z.object({
        dispoHeure: z.boolean(),
        dispoDemiJournee: z.boolean(),
        dispoJournee: z.boolean(),
        priseEnChargeLieuChoisi: z.boolean(),
    }),
    servicesComplementaires: z.array(z.string()),

    prixAPartirDeDA: z.coerce.number().min(0, "Le prix ne peut pas être négatif").default(0),
    acompteMontantDA: z.coerce.number().min(0).optional(),
    cautionMontantDA: z.coerce.number().min(0).optional(),
    politiqueAnnulation: z.string().optional(),

    galeriePhotos: z.array(z.string()).min(1, "La photo principale est requise").max(5, "Maximum 5 photos"),
    utiliserFormulaireFar7i: z.boolean().default(true),
    telephone: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.prestations.locationAvecChauffeur && !data.prestations.locationSansChauffeur) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins un mode de location (avec ou sans chauffeur)",
            path: ["prestations"],
        });
    }

    if (!data.organisation.dispoHeure && !data.organisation.dispoDemiJournee && !data.organisation.dispoJournee) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins un format de mise à disposition",
            path: ["organisation"],
        });
    }
});

export type LocationVoitureFormValues = z.infer<typeof locationVoitureSchema>;
