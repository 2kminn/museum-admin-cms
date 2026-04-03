import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EventProvider } from "./context/EventContext";
import { AppShell } from "./components/AppShell";
import { EventManagementPage } from "./pages/EventManagementPage";
import { LocationsArtworksPage } from "./pages/LocationsArtworksPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ThemeEditorPage } from "./pages/ThemeEditorPage";
import { ArtworkEditorPage } from "./pages/ArtworkEditorPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AuthProvider } from "./auth/AuthContext";
import { RequireApprovedMuseum } from "./auth/RequireApprovedMuseum";
import { RequireSuperAdmin } from "./auth/RequireSuperAdmin";
import { LoginPage } from "./pages/LoginPage";
import { WaitingForApprovalPage } from "./pages/WaitingForApprovalPage";
import { SuperAdminPage } from "./pages/SuperAdminPage";
import { AuthLandingRedirect } from "./auth/AuthLandingRedirect";
import { LegacyArtworkEditRedirect } from "./pages/LegacyArtworkEditRedirect";
import { RejectedApplicationPage } from "./pages/RejectedApplicationPage";
import { ThemeProvider, ThemeScope } from "./context/ThemeContext";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EventProvider>
          <Routes>
            <Route path="/" element={<AuthLandingRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/waiting" element={<WaitingForApprovalPage />} />
            <Route path="/rejected" element={<RejectedApplicationPage />} />
            <Route
              path="/super-admin"
              element={
                <ThemeProvider storageKey="artar_admin:theme_mode:super_admin">
                  <ThemeScope>
                    <RequireSuperAdmin>
                      <SuperAdminPage />
                    </RequireSuperAdmin>
                  </ThemeScope>
                </ThemeProvider>
              }
            />

            <Route
              path="/cms"
              element={
                <ThemeProvider storageKey="artar_admin:theme_mode">
                  <ThemeScope>
                    <RequireApprovedMuseum>
                      <AppShell />
                    </RequireApprovedMuseum>
                  </ThemeScope>
                </ThemeProvider>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="events" element={<EventManagementPage />} />
              <Route path="locations" element={<LocationsArtworksPage />} />
              <Route path="artworks/new" element={<ArtworkEditorPage mode="create" />} />
              <Route path="artworks/:artworkId/edit" element={<ArtworkEditorPage mode="edit" />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="theme" element={<ThemeEditorPage />} />
              <Route path="*" element={<Navigate to="/cms" replace />} />
            </Route>

            <Route path="/dashboard" element={<Navigate to="/cms" replace />} />
            <Route path="/events" element={<Navigate to="/cms/events" replace />} />
            <Route path="/locations" element={<Navigate to="/cms/locations" replace />} />
            <Route path="/artworks/new" element={<Navigate to="/cms/artworks/new" replace />} />
            <Route path="/artworks/:artworkId/edit" element={<LegacyArtworkEditRedirect />} />
            <Route path="/analytics" element={<Navigate to="/cms/analytics" replace />} />
            <Route path="/theme" element={<Navigate to="/cms/theme" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </EventProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
