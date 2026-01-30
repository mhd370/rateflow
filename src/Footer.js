import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";

import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";

import { Link as RouterLink } from "react-router-dom";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 8,
        pt: 3,
        pb: 2,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(135deg, #070d1f 0%, #101b3a 35%, #182955 100%)",
        boxShadow: "0 -18px 45px rgba(0,0,0,0.65)",
        color: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(14px)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 30% 20%, #39c5ff 0, #1358ff 40%, #0b1430 100%)",
                  boxShadow: "0 0 18px rgba(79,192,255,0.7)",
                }}
              />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: 0.6,
                }}
              >
                Rate <span style={{ color: "#3ac6ff" }}>Flow</span>
              </Typography>
            </Stack>

            <Typography sx={{ fontSize: 13.5, opacity: 0.85 }}>
              Smart currency monitoring for traders, businesses, and travelers.
              Track live rates, trends, and market signals in one dashboard.
            </Typography>

            <Stack direction="row" spacing={1} mt={2}>
              <Chip
                size="small"
                label="Live feed: HTTP 429 (demo)"
                sx={{
                  fontSize: 11,
                  height: 22,
                  bgcolor: "rgba(255,255,255,0.06)",
                  borderRadius: 999,
                }}
              />
              <Chip
                size="small"
                label="UTC • 24/7"
                sx={{
                  fontSize: 11,
                  height: 22,
                  bgcolor: "rgba(255,255,255,0.04)",
                  borderRadius: 999,
                }}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: 1,
                mb: 1,
                opacity: 0.9,
              }}
            >
              Navigation
            </Typography>
            <Stack spacing={0.5}>
              <Link
                component={RouterLink}
                to="/"
                underline="none"
                sx={{
                  color: "inherit",
                  fontSize: 13,
                  opacity: 0.9,
                  "&:hover": { color: "#3ac6ff" },
                }}
              >
                Home
              </Link>
              <Link
                component={RouterLink}
                to="/converter"
                underline="none"
                sx={{
                  color: "inherit",
                  fontSize: 13,
                  opacity: 0.9,
                  "&:hover": { color: "#3ac6ff" },
                }}
              >
                Currency Converter
              </Link>
              <Link
                component={RouterLink}
                to="/market-trends"
                underline="none"
                sx={{
                  color: "inherit",
                  fontSize: 13,
                  opacity: 0.9,
                  "&:hover": { color: "#3ac6ff" },
                }}
              >
                Market Trends
              </Link>
              <Link
                component={RouterLink}
                to="/news"
                underline="none"
                sx={{
                  color: "inherit",
                  fontSize: 13,
                  opacity: 0.9,
                  "&:hover": { color: "#3ac6ff" },
                }}
              >
                News & Insights
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: 1,
                mb: 1,
                opacity: 0.9,
              }}
            >
              Data & Contacts
            </Typography>

            <Typography sx={{ fontSize: 12.5, opacity: 0.85, mb: 1 }}>
              FX data aggregated from multiple providers. Rates are for
              informational purposes only and may differ from actual execution
              prices.
            </Typography>

            <Stack direction="row" spacing={1} mt={1} mb={1.5}>
              <Chip
                size="small"
                label="CurrencyAPI (demo)"
                sx={{
                  fontSize: 11,
                  height: 22,
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 999,
                }}
              />
              <Chip
                size="small"
                label="Delayed quotes"
                sx={{
                  fontSize: 11,
                  height: 22,
                  bgcolor: "rgba(255,0,0,0.12)",
                  color: "#ffb3b3",
                  borderRadius: 999,
                }}
              />
            </Stack>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              justifyContent="flex-start"
            >
              <IconButton size="small" sx={{ color: "rgba(255,255,255,0.8)" }}>
                <TwitterIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: "rgba(255,255,255,0.8)" }}>
                <LinkedInIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: "rgba(255,255,255,0.8)" }}>
                <LanguageIcon fontSize="small" />
              </IconButton>
              <Typography sx={{ fontSize: 12, opacity: 0.75, ml: 0.5 }}>
                contact@rateflow.app
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Divider
          sx={{
            mt: 3,
            mb: 1.5,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
            © {new Date().getFullYear()} Rate Flow. All rights reserved.
          </Typography>

          <Stack direction="row" spacing={2}>
            <Link
              href="#"
              underline="none"
              sx={{
                color: "inherit",
                fontSize: 12,
                opacity: 0.75,
                "&:hover": { color: "#3ac6ff" },
              }}
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              underline="none"
              sx={{
                color: "inherit",
                fontSize: 12,
                opacity: 0.75,
                "&:hover": { color: "#3ac6ff" },
              }}
            >
              Terms of Use
            </Link>
            <Link
              href="#"
              underline="none"
              sx={{
                color: "inherit",
                fontSize: 12,
                opacity: 0.75,
                "&:hover": { color: "#3ac6ff" },
              }}
            >
              Support
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
