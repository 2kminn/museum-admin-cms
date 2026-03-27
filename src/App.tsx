import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EventProvider } from "./context/EventContext";
import { AppShell } from "./components/AppShell";
import { EventManagementPage } from "./pages/EventManagementPage";
import { LocationsArtworksPage } from "./pages/LocationsArtworksPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ThemeEditorPage } from "./pages/ThemeEditorPage";
import { ArtworkEditorPage } from "./pages/ArtworkEditorPage";
import { DashboardPage } from "./pages/DashboardPage";

export function App() {
  return (
    <BrowserRouter>
      <EventProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/events" element={<EventManagementPage />} />
            <Route path="/locations" element={<LocationsArtworksPage />} />
            <Route path="/artworks/new" element={<ArtworkEditorPage mode="create" />} />
            <Route path="/artworks/:artworkId/edit" element={<ArtworkEditorPage mode="edit" />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/theme" element={<ThemeEditorPage />} />
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Route>
        </Routes>
      </EventProvider>
    </BrowserRouter>
  );
}
