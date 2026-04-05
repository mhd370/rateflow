import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "./AuthContext";

function formatCreatedAt(value) {
  if (!value) return "--";
  const raw = String(value);

  const isoLike = raw.includes(" ") && !raw.includes("T") ? raw.replace(" ", "T") : raw;
  const d = new Date(isoLike);
  if (!Number.isNaN(d.getTime())) {
    try {
      return d.toLocaleString();
    } catch {
      return raw;
    }
  }

  return raw;
}

function InfoItem({ label, value }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        px: { xs: 1.8, md: 2 },
        py: { xs: 1.6, md: 1.8 },
      }}
    >
      <Typography sx={{ fontSize: 12, opacity: 0.72, fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.65,
          fontSize: { xs: 15, md: 16 },
          fontWeight: 900,
          color: "rgba(255,255,255,0.92)",
          wordBreak: "break-word",
        }}
      >
        {value || "--"}
      </Typography>
    </Box>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const createdAt = formatCreatedAt(user?.created_at);

  return (
    <Box
      sx={{
        width: "100%",
        py: { xs: 3, md: 6 },
        background:
          "radial-gradient(1200px 650px at 18% 12%, rgba(77,196,255,0.18) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 82% 22%, rgba(123,92,255,0.16) 0%, rgba(0,0,0,0) 55%), linear-gradient(180deg, rgba(6,16,38,0.45) 0%, rgba(8,18,38,0.90) 55%, rgba(6,12,28,0.98) 100%)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: "80%" },
          maxWidth: 720,
          mx: "auto",
          px: { xs: 2, md: 0 },
        }}
      >
        <Card
          sx={{
            borderRadius: 5,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              "linear-gradient(145deg, rgba(18,33,67,0.78) 0%, rgba(10,20,45,0.75) 55%, rgba(6,10,22,0.82) 100%)",
            boxShadow: "0 22px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CardContent sx={{ px: { xs: 2.2, md: 3 }, py: { xs: 2.6, md: 3.2 } }}>
            <Stack spacing={2.2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountCircleOutlinedIcon sx={{ color: "#39c6ff" }} />
                  <Typography sx={{ fontWeight: 1000, fontSize: { xs: 22, md: 26 } }}>
                    {t("auth.accountTitle", "Account")}
                  </Typography>
                </Stack>
                <Typography sx={{ mt: 0.8, opacity: 0.72, fontSize: 13, lineHeight: 1.6 }}>
                  {t(
                    "auth.accountSubtitle",
                    "Read-only profile details for demoing end-to-end authentication.",
                  )}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1.6,
                }}
              >
                <InfoItem label={t("auth.name", "Name")} value={user?.name} />
                <InfoItem label={t("auth.email", "Email")} value={user?.email} />
                <InfoItem label={t("auth.createdAt", "Created")} value={createdAt} />
                <InfoItem
                  label={t("auth.userId", "User ID")}
                  value={user?.id != null ? String(user.id) : "--"}
                />
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/", { replace: false })}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  {t("common.backToHome", "Back to Home")}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    logout();
                    navigate("/", { replace: true });
                  }}
                  startIcon={<LogoutOutlinedIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  {t("auth.logout", "Logout")}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
