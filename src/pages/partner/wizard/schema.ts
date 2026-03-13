import * as z from "zod";

export const lieuReceptionSchema = z.object({
    // Step 1: Identité
    commercial_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    category_slug: z.string().default("lieu_de_reception"),
    wilaya_id: z.string().min(1, "Veuillez sélectionner une wilaya"),
    address: z.any().optional(), // Can be string or LocationData object from GoogleMapsLocator
    events_accepted: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    bio: z.string().optional(),

    // Step 2: Capacités & Espaces
    capaciteMaximale: z.coerce.number().min(1, "La capacité maximale est requise"),
    capaciteMinimale: z.coerce.number().optional(),
    separated_spaces: z.boolean().default(false),
    capaciteFemmes: z.coerce.number().optional(),
    capaciteHommes: z.coerce.number().optional(),

    salle_dinatoire: z.boolean().default(false),
    couvertsParService: z.coerce.number().optional(),
    jardin: z.boolean().default(false),
    terrasse: z.boolean().default(false),
    piscine: z.boolean().default(false),
    parking: z.boolean().default(false),
    placesParking: z.coerce.number().optional(),
    loge_maries: z.boolean().default(false),
    loge_maries_nb: z.coerce.number().optional(),
    loge_invites: z.boolean().default(false),
    loge_invites_nb: z.coerce.number().optional(),
    salle_attente: z.boolean().default(false),

    // Step 3: Services & Équipements
    serveurs: z.boolean().default(false),
    serveuses: z.boolean().default(false),
    nettoyage: z.boolean().default(false),
    securite: z.boolean().default(false),
    piste_danse: z.boolean().default(false),
    mobilier: z.boolean().default(false),
    nappes: z.boolean().default(false),
    climatisation: z.boolean().default(false),
    chauffage: z.boolean().default(false),
    ventilation: z.boolean().default(false),
    acces_pmr: z.boolean().default(false),
    sonorisation: z.boolean().default(false),
    jeux_lumiere: z.boolean().default(false),
    videoprojecteur: z.boolean().default(false),
    dj: z.boolean().default(false),
    animateur: z.boolean().default(false),
    valet: z.boolean().default(false),
    cameras: z.boolean().default(false),

    traiteur_type: z.enum(["impose", "libre", "aucun"]).default("libre"),
    cuisine_equipee: z.boolean().default(false),
    vaisselle: z.boolean().default(false),
    boissons: z.boolean().default(false),

    // Step 4: Tarification
    prixAPartirDeDA: z.coerce.number().min(0, "Le prix ne peut être négatif"),
    acompteMontantDA: z.coerce.number().min(0, "L'acompte ne peut être négatif"),
    politique_annulation: z.string().optional(),
    plages_horaires: z.array(z.string()).default([]),
    contraintes: z.string().optional(),

    // Step 5: Médias & Contact
    media: z.array(z.string()).min(1, "Au moins une photo est requise").max(5, "Maximum 5 photos autorisées"),
    formulaire_far7i: z.boolean().default(true),
    phone: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.capaciteMinimale && data.capaciteMaximale && data.capaciteMinimale > data.capaciteMaximale) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La capacité min ne peut pas dépasser la capacité max", path: ["capaciteMinimale"] });
    }
    if (data.separated_spaces) {
        const femmes = data.capaciteFemmes || 0;
        const hommes = data.capaciteHommes || 0;
        if (femmes + hommes > data.capaciteMaximale) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La somme dépasse la capacité globale", path: ["capaciteFemmes"] });
        }
    }
    if (data.salle_dinatoire && data.couvertsParService && data.couvertsParService > data.capaciteMaximale) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Les couverts dépassent la capacité maximale", path: ["couvertsParService"] });
    }
});

export type LieuReceptionFormValues = z.infer<typeof lieuReceptionSchema>;
