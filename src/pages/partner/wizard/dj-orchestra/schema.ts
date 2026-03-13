import * as z from "zod";

export const djOrchestraSchema = z.object({
    commercial_name: z.string().min(2, "Le nom est requis (minimum 2 caractères)"),
    category_slug: z.string().default("dj_orchestre"),
    wilaya_id: z.string().min(1, "La wilaya est requise"),
    address: z.any().optional(),
    events_accepted: z.array(z.string()).min(1, "Sélectionnez au moins un type d'événement"),
    bio: z.string().optional(),

    is_dj: z.boolean().default(false),
    is_orchestra: z.boolean().default(false),

    animation_options: z.array(z.string()).default([]),
    equipment_options: z.array(z.string()).default([]),

    deplacementPossible: z.boolean().default(false),
    wilayasDeplacement: z.array(z.string()).default([]),

    prixAPartirDeDA: z.coerce.number().min(0, "Le prix ne peut pas être négatif").default(0),
    acompteMontantDA: z.coerce.number().min(0).optional(),
    politiqueAnnulation: z.string().optional(),

    media: z.array(z.string()).min(1, "La photo principale est requise").max(5, "Maximum 5 photos"),
    formulaire_far7i: z.boolean().default(true),
    phone: z.string().optional(),
}).superRefine((data, ctx) => {
    // 1. At least DJ or Orchestra
    if (!data.is_dj && !data.is_orchestra) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins un type (DJ ou Orchestre)",
            path: ["is_dj"],
        });
    }

    // 2. IF `deplacementPossible` is true, `wilayasDeplacement` MUST have at least 1 item
    if (data.deplacementPossible && data.wilayasDeplacement.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner au moins une wilaya de déplacement",
            path: ["wilayasDeplacement"],
        });
    }
});

export type DJOrchestraFormValues = z.infer<typeof djOrchestraSchema>;
