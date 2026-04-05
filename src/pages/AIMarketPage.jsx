import * as React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { useTranslation } from "react-i18next";

import TradingChartPanel from "./ai-insights/TradingChartPanel";

export default function AIMarketPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: { xs: 11, md: 12 },
        pb: { xs: 5, md: 7 },
        px: { xs: 2, md: 0 },
        color: "#fff",
        background:
          "radial-gradient(1200px 650px at 18% 12%, rgba(77,196,255,0.16) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 82% 22%, rgba(123,92,255,0.14) 0%, rgba(0,0,0,0) 55%), linear-gradient(180deg, rgba(6,16,38,0.45) 0%, rgba(8,18,38,0.92) 55%, rgba(6,12,28,0.98) 100%)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <Box sx={{ width: { xs: "100%", md: "80%" }, maxWidth: 1320, mx: "auto" }}>
        {/* Hero */}
        <Box
          sx={{
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "rgba(0,0,0,0.18)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
            px: { xs: 2.2, md: 2.8 },
            py: { xs: 2.4, md: 2.8 },
            mb: { xs: 2.2, md: 2.8 },
            direction: isAr ? "rtl" : "ltr",
            textAlign: isAr ? "right" : "left",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.4}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeOutlinedIcon sx={{ color: "#39c6ff" }} />
                <Typography
                  sx={{
                    fontWeight: 1000,
                    fontSize: { xs: 24, md: 34 },
                    letterSpacing: "-0.02em",
                    lineHeight: 1.08,
                  }}
                >
                  {t("aiInsights.heroTitle", "AI Market Intelligence")}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 760,
                  color: "rgba(255,255,255,0.74)",
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {t(
                  "aiInsights.heroSubtitle",
                  "Live charting, transparent signals, and a context-aware market assistant - designed for clarity, not certainty.",
                )}
              </Typography>
            </Box>

            <Chip
              label={t("common.live", "Live")}
              size="small"
              sx={{
                height: 24,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(58,198,255,0.30)",
                bgcolor: "rgba(58,198,255,0.12)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            />
          </Stack>
        </Box>

        <TradingChartPanel />
      </Box>
    </Box>
  );
}
