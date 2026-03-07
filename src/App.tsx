import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Recherche from "./pages/Recherche";
import GuideResultat from "./pages/GuideResultat";
import Categorie from "./pages/Categorie";
import Inspiration from "./pages/Inspiration";
import Article from "./pages/Article";
import QuiSommesNous from "./pages/QuiSommesNous";
import Contact from "./pages/Contact";
import NotFound from "./pages/Error404";
import PartnerAuth from "./pages/partner/Auth";
import AuthCallback from "./pages/AuthCallback";
import PartnerDashboard from "./pages/partner/Dashboard";
import PartnerProfile from "./pages/partner/Profile";
import PartnerServices from "./pages/partner/Services";
import PartnerServiceEditor from "./pages/partner/ServiceEditor";
import VenueEditor from "./pages/partner/VenueEditor";
import CateringEditor from "./pages/partner/CateringEditor";
import DJOrchestraEditor from "./pages/partner/DJOrchestraEditor";
import TraditionalMusicEditor from "./pages/partner/TraditionalMusicEditor";
import PieceMonteeEditor from "./pages/partner/PieceMonteeEditor";
import GateauTradEditor from "./pages/partner/GateauTradEditor";
import PatisserieSalesEditor from "./pages/partner/PatisserieSalesEditor";
import HabilleusEditor from "./pages/partner/HabilleusEditor";
import LocationTenuesEditor from "./pages/partner/LocationTenuesEditor";
import CoiffureBeauteEditor from "./pages/partner/CoiffureBeauteEditor";
import LocationVoitureEditor from "./pages/partner/LocationVoitureEditor";
import PhotographerEditor from "./pages/partner/PhotographerEditor";
import OnboardingWizard from "./pages/partner/OnboardingWizard";
import Messaging from "./pages/partner/Messaging";
import PartnerSettings from "./pages/partner/Settings";
import PartnerVerified from "./pages/partner/Verified";
import ForgotPassword from "./pages/partner/ForgotPassword";
import UpdatePassword from "./pages/partner/UpdatePassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import EmailConfirmed from "@/pages/auth/EmailConfirmed";
import ConfirmDeletion from "@/pages/auth/ConfirmDeletion";
import Search from "@/pages/client/Search";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProviders from "@/pages/admin/AdminProviders";
import AdminModeration from "@/pages/admin/AdminModeration";
import AdminProviderEditor from "@/pages/admin/AdminProviderEditor";
import AdminServicesManager from "@/pages/admin/AdminServicesManager";
import AdminServiceEditor from "@/pages/admin/AdminServiceEditor";
import BlogList from "@/pages/admin/BlogList";
import BlogEditor from "@/pages/admin/BlogEditor";
import AdminMessagingPanel from "@/pages/admin/AdminMessagingPanel";
import { VisitorTracker } from "@/components/analytics/VisitorTracker";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <VisitorTracker />
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/recherche" element={<Recherche />} />
                <Route path="/guide-resultat" element={<GuideResultat />} />
                <Route path="/categorie/:slug" element={<Categorie />} />
                <Route path="/inspiration" element={<Inspiration />} />
                <Route path="/inspiration/:slug" element={<Article />} />
                {/* Redirect Legacy Route */}
                <Route path="/etes-vous-prestataire" element={<Navigate to="/partner/auth" replace />} />

                <Route path="/qui-sommes-nous" element={<QuiSommesNous />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/email-confirmed" element={<EmailConfirmed />} />
                <Route path="/confirm-deletion" element={<ConfirmDeletion />} />

                {/* Client Specific Routes */}
                {/* Public Only Routes - Redirect to dashboard if authenticated */}
                <Route path="/partner/auth" element={<PublicOnlyRoute><PartnerAuth /></PublicOnlyRoute>} />
                <Route path="/partner/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

                {/* Auth Callback - No protection needed */}
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected Routes - Require authentication */}
                <Route path="/partner/update-password" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
                <Route path="/partner/verified" element={<ProtectedRoute><PartnerVerified /></ProtectedRoute>} />
                <Route path="/partner/dashboard" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
                <Route path="/partner/dashboard/stats" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
                <Route path="/partner/dashboard/profile" element={<ProtectedRoute><PartnerProfile /></ProtectedRoute>} />
                {/* Specific Editors First */}
                <Route path="/partner/dashboard/services/venues/new" element={<ProtectedRoute><VenueEditor isNewProp={true} /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/venues/:id/edit" element={<ProtectedRoute><VenueEditor isNewProp={false} /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/catering/new" element={<ProtectedRoute><CateringEditor isNewProp={true} /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/catering/:id/edit" element={<ProtectedRoute><CateringEditor isNewProp={false} /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/dj-orchestra/new" element={<ProtectedRoute><DJOrchestraEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/dj-orchestra/:id/edit" element={<ProtectedRoute><DJOrchestraEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/traditional-music/new" element={<ProtectedRoute><TraditionalMusicEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/traditional-music/:id/edit" element={<ProtectedRoute><TraditionalMusicEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/piece-montee/new" element={<ProtectedRoute><PieceMonteeEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/piece-montee/:id/edit" element={<ProtectedRoute><PieceMonteeEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/gateau-trad/new" element={<ProtectedRoute><GateauTradEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/gateau-trad/:id/edit" element={<ProtectedRoute><GateauTradEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/patisserie-sales/new" element={<ProtectedRoute><PatisserieSalesEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/patisserie-sales/:id/edit" element={<ProtectedRoute><PatisserieSalesEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/habilleuse/new" element={<ProtectedRoute><HabilleusEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/habilleuse/:id/edit" element={<ProtectedRoute><HabilleusEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/location-tenues/new" element={<ProtectedRoute><LocationTenuesEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/location-tenues/:id/edit" element={<ProtectedRoute><LocationTenuesEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/coiffure-beaute/new" element={<ProtectedRoute><CoiffureBeauteEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/coiffure-beaute/:id/edit" element={<ProtectedRoute><CoiffureBeauteEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/location-voiture/new" element={<ProtectedRoute><LocationVoitureEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/location-voiture/:id/edit" element={<ProtectedRoute><LocationVoitureEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/photographer/new" element={<ProtectedRoute><PhotographerEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/photographer/:id/edit" element={<ProtectedRoute><PhotographerEditor /></ProtectedRoute>} />

                {/* Generic Routes After */}
                <Route path="/partner/dashboard/services" element={<ProtectedRoute><PartnerServices /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/new" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
                <Route path="/partner/dashboard/services/:id/edit" element={<ProtectedRoute><PartnerServiceEditor /></ProtectedRoute>} />
                <Route path="/partner/dashboard/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
                <Route path="/partner/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
                <Route path="/partner/dashboard/messages" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
                <Route path="/partner/dashboard/settings" element={<ProtectedRoute><PartnerSettings /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/providers" element={<AdminRoute><AdminProviders /></AdminRoute>} />
                <Route path="/admin/providers/new" element={<AdminRoute><AdminProviderEditor /></AdminRoute>} />
                <Route path="/admin/providers/:id" element={<AdminRoute><AdminProviderEditor /></AdminRoute>} />
                <Route path="/admin/providers/:id/services" element={<AdminRoute><AdminServicesManager /></AdminRoute>} />
                <Route path="/admin/providers/:id/services/new" element={<AdminRoute><AdminServiceEditor /></AdminRoute>} />
                <Route path="/admin/providers/:id/services/:serviceId/edit" element={<AdminRoute><AdminServiceEditor /></AdminRoute>} />
                <Route path="/admin/moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
                <Route path="/admin/blog" element={<AdminRoute><BlogList /></AdminRoute>} />
                <Route path="/admin/blog/new" element={<AdminRoute><BlogEditor /></AdminRoute>} />
                <Route path="/admin/blog/edit/:id" element={<AdminRoute><BlogEditor /></AdminRoute>} />
                <Route path="/admin/messaging" element={<AdminRoute><AdminMessagingPanel /></AdminRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
