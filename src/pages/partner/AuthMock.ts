// Mock Data and Interfaces for Partner Authentication

export type PartnerType = "individual" | "agency";

export interface ProviderRegistrationData {
    email: string;
    password?: string;
    businessName: string;
    partnerType: PartnerType;
    phone: string;
    socialLink?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    sessionString?: string;
}

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthApi = {
    // Simulate checking if email already exists
    checkEmailExists: async (email: string): Promise<boolean> => {
        await delay(300);
        // Hardcode an existing user for testing purposes
        return email === "existing@partner.com";
    },

    // Simulate signing up a new provider
    registerProvider: async (data: ProviderRegistrationData): Promise<AuthResponse> => {
        await delay(1200);

        if (data.email === "existing@partner.com") {
            return {
                success: false,
                message: "Un compte existe déjà avec cet email."
            };
        }

        if (!data.businessName || !data.phone) {
            return {
                success: false,
                message: "Les champs obligatoires sont manquants."
            };
        }

        // Success simulation
        console.log("Mock API: Registration Payload received", data);
        return {
            success: true,
            message: "Veuillez vérifier vos emails pour confirmer votre inscription."
        };
    }
};
