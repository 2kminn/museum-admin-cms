import React from "react";
import { Navigate, useParams } from "react-router-dom";

export function LegacyArtworkEditRedirect() {
  const { artworkId } = useParams();
  if (!artworkId) return <Navigate to="/cms/locations" replace />;
  return <Navigate to={`/cms/artworks/${artworkId}/edit`} replace />;
}

