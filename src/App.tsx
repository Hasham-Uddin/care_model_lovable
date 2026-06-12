import { Toaster } from "@/components/ui/toaster";
import DataMarketplace from "./pages/DataMarketplace";
import CommunityApproach from "./pages/CommunityApproach";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import ProjectDetail from "./pages/ProjectDetail";
import SessionDetail from "./pages/SessionDetail";
import InterrogationDashboard from "./pages/InterrogationDashboard";
import SyntheticDataGenerator from "./pages/SyntheticDataGenerator";
import OrganizationEarnings from "./pages/OrganizationEarnings";
import AdminPanel from "./pages/AdminPanel";
import MonitorDashboard from "./pages/MonitorDashboard";
import MonitorProjectView from "./pages/MonitorProjectView";
import AiPolicy from "./pages/AiPolicy";
import AiToolPolicy from "./pages/AiToolPolicy";
import FacilitatorCoach from "./pages/FacilitatorCoach";
import AcceptInvitation from "./pages/AcceptInvitation";
import SurveyResults from "./pages/SurveyResults";
import Academy from "./pages/Academy";
import AcademyLevel from "./pages/AcademyLevel";
import AcademyLesson from "./pages/AcademyLesson";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { AuthGuard } from "./components/AuthGuard";
import { RoleGuard } from "./components/RoleGuard";
import CookieConsent from "./components/CookieConsent";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { installGlobalErrorHandlers } from "./lib/errorLogger";

installGlobalErrorHandlers();

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieConsent />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/create-project"
            element={
              <AuthGuard>
                <CreateProject />
              </AuthGuard>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <AuthGuard>
                <ProjectDetail />
              </AuthGuard>
            }
          />
          <Route
            path="/session/:sessionId"
            element={
              <AuthGuard>
                <SessionDetail />
              </AuthGuard>
            }
          />
          <Route
            path="/interrogations/:projectId"
            element={
              <AuthGuard>
                <InterrogationDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/synthetic-data-generator"
            element={
              <AuthGuard>
                <SyntheticDataGenerator />
              </AuthGuard>
            }
          />
          <Route 
            path="/community-approach" 
            element={
              <AuthGuard>
                <RoleGuard allowedRoles={["admin"]}>
                  <CommunityApproach />
                </RoleGuard>
              </AuthGuard>
            } 
          />
          <Route 
            path="/data-marketplace" 
            element={
              <AuthGuard>
                <RoleGuard allowedRoles={["admin"]}>
                  <DataMarketplace />
                </RoleGuard>
              </AuthGuard>
            } 
          />
          <Route
            path="/organization-earnings"
            element={
              <AuthGuard>
                <RoleGuard allowedRoles={["admin"]}>
                  <OrganizationEarnings />
                </RoleGuard>
              </AuthGuard>
            }
          />
          <Route
            path="/monitor"
            element={
              <AuthGuard>
                <RoleGuard allowedRoles={["admin"]}>
                  <MonitorDashboard />
                </RoleGuard>
              </AuthGuard>
            }
          />
          <Route
            path="/monitor/project/:projectId"
            element={
              <AuthGuard>
                <RoleGuard allowedRoles={["admin"]}>
                  <MonitorProjectView />
                </RoleGuard>
              </AuthGuard>
            }
          />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/ai-policy" element={<AiPolicy />} />
          <Route path="/ai-tool-policy" element={<AiToolPolicy />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/survey-results"
            element={
              <AuthGuard>
                <SurveyResults />
              </AuthGuard>
            }
          />
          <Route
            path="/survey-results/:projectId"
            element={
              <AuthGuard>
                <SurveyResults />
              </AuthGuard>
            }
          />
          <Route
            path="/facilitator-coach"
            element={
              <AuthGuard>
                <FacilitatorCoach />
              </AuthGuard>
            }
          />
          <Route path="/academy" element={<AuthGuard><Academy /></AuthGuard>} />
          <Route path="/academy/level/:levelId" element={<AuthGuard><AcademyLevel /></AuthGuard>} />
          <Route path="/academy/lesson/:lessonId" element={<AuthGuard><AcademyLesson /></AuthGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
