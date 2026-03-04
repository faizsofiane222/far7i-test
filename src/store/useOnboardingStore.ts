import { create } from 'zustand';

export type CategorySlug =
    | 'lieu_de_reception'
    | 'traiteur'
    | 'photographe'
    | 'dj_orchestre'
    | 'animation_musicale_traditionnelle'
    | 'piece_montee_tartes'
    | 'gateau_traditionnel'
    | 'patisserie_sales'
    | 'location_tenues'
    | 'habilleuse'
    | 'coiffure_beaute'
    | 'location_voiture'
    | 'beaute_bien_etre'
    | '';

export interface OnboardingState {
    // Navigation
    step: number;
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;

    // Step 1: Base Provider Profile
    categorySlug: CategorySlug;
    commercialName: string;
    wilayaId: string;
    address: string;
    phoneNumber: string;
    isWhatsappActive: boolean;
    isViberActive: boolean;
    travelWilayas: string[];
    eventsAccepted: string[];

    // Base Updaters
    setCategorySlug: (slug: CategorySlug) => void;
    setCommercialName: (name: string) => void;
    setWilayaId: (id: string) => void;
    setAddress: (address: string) => void;
    setPhoneNumber: (phone: string) => void;
    setIsWhatsappActive: (active: boolean) => void;
    setIsViberActive: (active: boolean) => void;
    toggleTravelWilaya: (wilayaId: string) => void;
    setEventsAccepted: (events: string[]) => void;
    toggleEventAccepted: (event: string) => void;

    // Step 2: Specifics (Dynamic based on Category)
    specifics: {
        // Venues
        capacityMin?: number;
        capacityMax?: number;
        separatedSpaces?: boolean;
        // Catering / Pastry
        productTypes?: string[];
        deliveryOptions?: string[];
        // Music / DJ
        musicStyles?: string[];
        equipmentProvided?: string[];
        // Rentals & Beauty
        withChauffeur?: boolean;
        vehicleTypes?: string[];
        cautionAmount?: number;
        servicesIncluded?: string[];
    };

    // Specifics Updaters
    updateSpecifics: (data: Partial<OnboardingState['specifics']>) => void;
    toggleSpecificArrayItem: (key: keyof OnboardingState['specifics'], item: string) => void;

    // Step 3: Showcase & Media
    description: string;
    media: { file: File | null; url: string; isMain: boolean }[];

    // Media Updaters
    setDescription: (desc: string) => void;
    addMedia: (files: File[]) => void;
    removeMedia: (index: number) => void;
    setMainMedia: (index: number) => void;

    // Step 4: Pricing & Logistics
    basePrice: number | '';
    priceFactors: string[];

    // Logistics Updaters
    setBasePrice: (price: number | '') => void;
    togglePriceFactor: (factor: string) => void;

    // Global Actions
    reset: () => void;
}

const initialState: Omit<OnboardingState, 'setStep' | 'nextStep' | 'prevStep' | 'setCategorySlug' | 'setCommercialName' | 'setWilayaId' | 'setAddress' | 'setPhoneNumber' | 'setIsWhatsappActive' | 'setIsViberActive' | 'toggleTravelWilaya' | 'setEventsAccepted' | 'toggleEventAccepted' | 'updateSpecifics' | 'toggleSpecificArrayItem' | 'setDescription' | 'addMedia' | 'removeMedia' | 'setMainMedia' | 'setBasePrice' | 'togglePriceFactor' | 'reset'> = {
    step: 1,
    categorySlug: '' as CategorySlug,
    commercialName: '',
    wilayaId: '',
    address: '',
    phoneNumber: '',
    isWhatsappActive: false,
    isViberActive: false,
    travelWilayas: [],
    eventsAccepted: [],
    specifics: {
        productTypes: [],
        deliveryOptions: [],
        musicStyles: [],
        equipmentProvided: [],
        vehicleTypes: [],
        servicesIncluded: [],
    },
    description: '',
    media: [],
    basePrice: '' as '' | number,
    priceFactors: [],
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    ...initialState,

    setStep: (step) => set({ step }),
    nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
    prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

    setCategorySlug: (categorySlug) => set({ categorySlug }),
    setCommercialName: (commercialName) => set({ commercialName }),
    setWilayaId: (wilayaId) => set({ wilayaId }),
    setAddress: (address) => set({ address }),
    setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
    setIsWhatsappActive: (isWhatsappActive) => set({ isWhatsappActive }),
    setIsViberActive: (isViberActive) => set({ isViberActive }),
    toggleTravelWilaya: (wilayaId) => set((state) => ({
        travelWilayas: state.travelWilayas.includes(wilayaId)
            ? state.travelWilayas.filter((w) => w !== wilayaId)
            : [...state.travelWilayas, wilayaId]
    })),
    setEventsAccepted: (events) => set({ eventsAccepted: events }),
    toggleEventAccepted: (event) => set((state) => ({
        eventsAccepted: state.eventsAccepted.includes(event)
            ? state.eventsAccepted.filter((e) => e !== event)
            : [...state.eventsAccepted, event]
    })),

    updateSpecifics: (data) => set((state) => ({
        specifics: { ...state.specifics, ...data }
    })),
    toggleSpecificArrayItem: (key, item) => set((state) => {
        const currentArray = (state.specifics[key] as string[]) || [];
        const isSelected = currentArray.includes(item);
        return {
            specifics: {
                ...state.specifics,
                [key]: isSelected ? currentArray.filter((i) => i !== item) : [...currentArray, item]
            }
        };
    }),

    setDescription: (description) => set({ description }),
    addMedia: (files) => set((state) => {
        // Max 5 images
        const currentCount = state.media.length;
        const allowedNew = Math.min(files.length, 5 - currentCount);
        if (allowedNew <= 0) return state;

        const newMedia = files.slice(0, allowedNew).map((f) => ({
            file: f,
            url: URL.createObjectURL(f),
            isMain: state.media.length === 0 && files.indexOf(f) === 0 // Make first image main if no main
        }));

        return { media: [...state.media, ...newMedia] };
    }),
    removeMedia: (index) => set((state) => {
        const newMedia = [...state.media];
        const removed = newMedia.splice(index, 1)[0];
        if (removed && removed.url.startsWith('blob:')) {
            URL.revokeObjectURL(removed.url);
        }
        // If we removed the main image, make the new first image main
        if (removed?.isMain && newMedia.length > 0) {
            newMedia[0].isMain = true;
        }
        return { media: newMedia };
    }),
    setMainMedia: (index) => set((state) => ({
        media: state.media.map((m, i) => ({ ...m, isMain: i === index }))
    })),

    setBasePrice: (basePrice) => set({ basePrice }),
    togglePriceFactor: (factor) => set((state) => ({
        priceFactors: state.priceFactors.includes(factor)
            ? state.priceFactors.filter((f) => f !== factor)
            : [...state.priceFactors, factor]
    })),

    reset: () => set(initialState),
}));
