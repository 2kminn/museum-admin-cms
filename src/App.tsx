import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EventProvider } from "./context/EventContext";
import { AppShell } from "./components/AppShell";
import { EventManagementPage } from "./pages/EventManagementPage";
import { LocationsArtworksPage } from "./pages/LocationsArtworksPage";
import { ArtworkEditorPage } from "./pages/ArtworkEditorPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AuthProvider } from "./auth/AuthContext";
import { RequireApprovedMuseum } from "./auth/RequireApprovedMuseum";
import { RequireSuperAdmin } from "./auth/RequireSuperAdmin";
import { LoginPage } from "./pages/LoginPage";
import { WaitingForApprovalPage } from "./pages/WaitingForApprovalPage";
import { SuperAdminPage } from "./pages/SuperAdminPage";
import { AuthLandingRedirect } from "./auth/AuthLandingRedirect";
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
              <Route path="places" element={<EventManagementPage />} />
              <Route path="events" element={<Navigate to="/cms/places" replace />} />
              <Route path="locations" element={<LocationsArtworksPage />} />
              <Route path="artworks/new" element={<ArtworkEditorPage mode="create" />} />
              <Route path="artworks/:artworkId/edit" element={<ArtworkEditorPage mode="edit" />} />
              <Route path="*" element={<Navigate to="/cms" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </EventProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
