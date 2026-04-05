import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (authLoading) {
    return (
      <Box sx={{ py: { xs: 6, md: 10 }, px: 2 }}>
        <Stack spacing={1.2} alignItems="center">
          <CircularProgress size={26} />
          <Typography sx={{ opacity: 0.75, fontWeight: 800, fontSize: 13 }}>
            {t("auth.checkingSession", "Checking session…")}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return children;
}
