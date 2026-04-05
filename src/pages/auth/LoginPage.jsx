import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { loginUser } from "./authClient";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const data = await loginUser({ email, password });
      setSession({ token: data?.token, user: data?.user });
      const next = location.state?.from || "/";
      navigate(next, { replace: true });
    } catch (err) {
      setError(String(err?.message || t("auth.loginFailed", "Login failed.")));
    } finally {
      setLoading(false);
    }
  }

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
          maxWidth: 560,
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
                  <LockOutlinedIcon sx={{ color: "#39c6ff" }} />
                  <Typography sx={{ fontWeight: 1000, fontSize: { xs: 22, md: 26 } }}>
                    {t("auth.login", "Login")}
                  </Typography>
                </Stack>
                <Typography sx={{ mt: 0.8, opacity: 0.72, fontSize: 13, lineHeight: 1.6 }}>
                  {t(
                    "auth.loginSubtitle",
                    "Sign in to continue. This stores a session token locally for demo purposes.",
                  )}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

              {error ? <Alert severity="error">{error}</Alert> : null}

              <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={1.6}>
                  <TextField
                    label={t("auth.email", "Email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    fullWidth
                    required
                    sx={{ direction: "ltr" }}
                  />

                  <TextField
                    label={t("auth.password", "Password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                    fullWidth
                    required
                    sx={{ direction: "ltr" }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      textTransform: "none",
                      fontWeight: 1000,
                      borderRadius: 3,
                      py: 1.2,
                      background:
                        "linear-gradient(135deg, rgba(35,166,232,0.85) 0%, rgba(77,196,255,0.75) 45%, rgba(130,216,255,0.75) 100%)",
                      boxShadow: "0 12px 26px rgba(0,0,0,0.45)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, rgba(35,166,232,0.95) 0%, rgba(77,196,255,0.82) 45%, rgba(130,216,255,0.82) 100%)",
                      },
                    }}
                  >
                    {loading ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={18} color="inherit" />
                        <span>{t("auth.loggingIn", "Logging in...")}</span>
                      </Stack>
                    ) : (
                      t("auth.login", "Login")
                    )}
                  </Button>

                  <Typography sx={{ fontSize: 13, opacity: 0.75 }}>
                    {t("auth.newHere", "New here?")}{" "}
                    <Box
                      component={NavLink}
                      to="/register"
                      sx={{
                        color: "#39c6ff",
                        fontWeight: 900,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {t("auth.createAccount", "Create an account")}
                    </Box>
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
