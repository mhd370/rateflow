// MATERIAL UI LIBR
import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useTranslation } from "react-i18next";

// your components
import ConverterCont from "./ConverterCont";
import TopExchangeRates from "./TopExchangeRates";
import GoldSilverCard from "./GoldSilverCard";
import MarketTrendsChart from "../MarketTrendsChart";
import CryptoHomeCard from "./CryptoHomeCard";
import NewsCard from "./NewsCard";
import NewsCardTow from "./NewsCardTow";

function GlassCard({ title, subtitle, action, children, contentSx }) {
  return (
    <Card
      sx={{
        borderRadius: 4,

        overflow: "visible",

        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(145deg, rgba(18,33,67,0.78) 0%, rgba(10,20,45,0.75) 55%, rgba(6,10,22,0.82) 100%)",
        boxShadow:
          "0 22px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
      }}
    >
      {(title || subtitle || action) && (
        <Box
          sx={{
            px: { xs: 2.2, md: 2.8 },
            pt: { xs: 2.0, md: 2.4 },
            pb: 1.6,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            {title && (
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                sx={{ mt: 0.4, color: "rgba(255,255,255,0.65)", fontSize: 13 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {action ? <Box sx={{ pt: 0.2 }}>{action}</Box> : null}
        </Box>
      )}

      <CardContent
        sx={{
          px: { xs: 2.2, md: 2.8 },
          pb: { xs: 2.4, md: 2.8 },
          pt: 0,

          height: "auto",
          overflow: "visible",

          ...contentSx,
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, hint }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        px: 2,
        py: 1.6,
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Typography sx={{ color: "rgba(255,255,255,0.70)", fontSize: 12 }}>
        {label}
      </Typography>
      <Typography
        sx={{ color: "#fff", fontWeight: 900, fontSize: 18, mt: 0.4 }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography
          sx={{ color: "rgba(255,255,255,0.60)", fontSize: 12, mt: 0.2 }}
        >
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

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
      {/* ✅ Wrapper 80% بالمنتصف */}
      <Box
        sx={{
          width: { xs: "100%", md: "80%" },
          maxWidth: 1320,
          mx: "auto",
          px: { xs: 2, md: 0 },
        }}
      >
        {/* HERO */}
        <Box
          sx={{
            mb: { xs: 2.5, md: 4 },
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "rgba(0,0,0,0.20)",
            backdropFilter: "blur(12px)",
            px: { xs: 2.2, md: 3.2 },
            py: { xs: 2.4, md: 3.2 },
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: -80,
              background:
                "radial-gradient(500px 220px at 18% 30%, rgba(77,196,255,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(520px 240px at 70% 10%, rgba(123,92,255,0.18) 0%, rgba(0,0,0,0) 60%)",
              pointerEvents: "none",
            }}
          />

          <Box sx={{ position: "relative" }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "center", md: "flex-end" }}
              justifyContent="space-between"
            >
              <Box
                sx={{
                  textAlign: { xs: "center", md: isAr ? "right" : "left" },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 1000,
                    letterSpacing: 0.4,
                    fontSize: { xs: 26, sm: 32, md: 44 },
                    lineHeight: 1.08,
                    color: "#fff",
                  }}
                >
                  {t("home.heroTitle", "RateFlow — Live Money Intelligence")}
                </Typography>

                <Typography
                  sx={{
                    mt: 1.2,
                    color: "rgba(255,255,255,0.74)",
                    fontSize: { xs: 13.5, md: 16 },
                    maxWidth: 860,
                    mx: { xs: "auto", md: 0 },
                    lineHeight: 1.75,
                  }}
                >
                  {t(
                    "home.heroSubtitle",
                    "Convert currencies, monitor crypto & metals, and track market momentum — all in one premium dashboard built for fast decisions.",
                  )}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    mt: 1.6,
                    justifyContent: { xs: "center", md: "flex-start" },
                    flexWrap: "wrap",
                    rowGap: 1,
                  }}
                >
                  <Chip
                    label={t("home.heroChips.realtimeRates", "Real-time rates")}
                    sx={{
                      color: "rgba(255,255,255,0.92)",
                      bgcolor: "rgba(58,198,255,0.14)",
                      border: "1px solid rgba(58,198,255,0.25)",
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    label={t("home.heroChips.cryptoMetals", "Crypto & metals")}
                    sx={{
                      color: "rgba(255,255,255,0.92)",
                      bgcolor: "rgba(123,92,255,0.14)",
                      border: "1px solid rgba(123,92,255,0.22)",
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    label={t("home.heroChips.marketInsights", "Market insights")}
                    sx={{
                      color: "rgba(255,255,255,0.92)",
                      bgcolor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      fontWeight: 700,
                    }}
                  />
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 999,
                    px: 2.2,
                    py: 1,
                    background:
                      "linear-gradient(135deg, #23A6E8 0%, #4DC4FF 45%, #82D8FF 100%)",
                    boxShadow:
                      "0 14px 34px rgba(0,0,0,0.55), 0 0 18px rgba(77,196,255,0.35)",
                  }}
                >
                  {t("home.heroActions.startConverting", "Start Converting")}
                </Button>

                <Button
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 999,
                    px: 2.2,
                    py: 1,
                    borderColor: "rgba(255,255,255,0.22)",
                    color: "rgba(255,255,255,0.9)",
                    backgroundColor: "rgba(0,0,0,0.12)",
                    "&:hover": {
                      borderColor: "rgba(58,198,255,0.55)",
                      color: "#39c6ff",
                      backgroundColor: "rgba(58,198,255,0.08)",
                    },
                  }}
                >
                  {t("home.heroActions.viewMarkets", "View Markets")}
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                mt: { xs: 2.2, md: 2.8 },
                display: "grid",
                gap: 1.6,
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              }}
            >
              <Metric
                label={t("home.metrics.trackedAssets.label", "Tracked Assets")}
                value="150+"
                hint={t("home.metrics.trackedAssets.hint", "FX · Crypto · Metals")}
              />
              <Metric
                label={t("home.metrics.updateSpeed.label", "Update Speed")}
                value={t("common.live", "Live")}
                hint={t("home.metrics.updateSpeed.hint", "Near real-time")}
              />
              <Metric
                label={t("home.metrics.insights.label", "Insights")}
                value={t("home.metrics.insights.value", "Trends")}
                hint={t("home.metrics.insights.hint", "Momentum & moves")}
              />
              <Metric
                label={t("home.metrics.experience.label", "Experience")}
                value={t("home.metrics.experience.value", "Premium")}
                hint={t("home.metrics.experience.hint", "Fast & clean UI")}
              />
            </Box>
          </Box>
        </Box>

        {/* ✅ MAIN GRID */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 2.5 },
            gridTemplateColumns: { xs: "1fr", lg: "420px 1fr" },
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <Box
            sx={{
              position: { lg: "sticky" },
              top: { lg: 92 },
              alignSelf: "start",
            }}
          >
            <GlassCard
              title={t("home.sections.converter.title", "Smart Universal Converter")}
              subtitle={t("home.sections.converter.subtitle", "Fiat · Crypto · Gold · Silver")}
              action={
                <Chip
                  label={t("home.sections.converter.chip", "Live-ready")}
                  size="small"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    bgcolor: "rgba(58,198,255,0.12)",
                    border: "1px solid rgba(58,198,255,0.25)",
                    fontWeight: 800,
                  }}
                />
              }
              // ✅ مهم: خلي المحتوى يتمدّد
              contentSx={{ overflow: "visible" }}
            >
              <ConverterCont />

              <Divider
                sx={{ my: 2.2, borderColor: "rgba(255,255,255,0.10)" }}
              />

              <Box
                sx={{
                  display: "grid",
                  gap: 1.2,
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 2.5,
                    borderColor: "rgba(255,255,255,0.18)",
                    color: "rgba(255,255,255,0.9)",
                    backgroundColor: "rgba(0,0,0,0.14)",
                    "&:hover": {
                      borderColor: "rgba(58,198,255,0.55)",
                      color: "#39c6ff",
                      backgroundColor: "rgba(58,198,255,0.08)",
                    },
                  }}
                >
                  {t("home.sections.converter.savePair", "Save Pair")}
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    fontWeight: 1000,
                    borderRadius: 2.5,
                    background:
                      "linear-gradient(135deg, rgba(35,166,232,0.85) 0%, rgba(77,196,255,0.75) 45%, rgba(130,216,255,0.75) 100%)",
                    boxShadow: "0 12px 26px rgba(0,0,0,0.45)",
                  }}
                >
                  {t("home.sections.converter.createAlert", "Create Alert")}
                </Button>
              </Box>
            </GlassCard>
          </Box>

          {/* RIGHT */}
          <Stack spacing={{ xs: 2, md: 2.5 }}>
            <Box
              sx={{
                display: "grid",
                gap: { xs: 2, md: 2.5 },

                gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },

                alignItems: "stretch",
              }}
            >
              <GlassCard
                title={t("home.sections.topRates.title", "Top Exchange Rates")}
                subtitle={t("home.sections.topRates.subtitle", "Most watched pairs")}
              >
                <TopExchangeRates />
              </GlassCard>

              {/* ✅ أهم شي: منع القص + ضمان ارتفاع منطقي */}
              <GlassCard
                title={t("home.sections.metals.title", "Metals Snapshot")}
                subtitle={t("home.sections.metals.subtitle", "Gold & Silver today")}
                contentSx={{
                  overflow: "visible",
                  height: "auto",
                }}
              >
                <Box
                  sx={{
                    // ✅ خليه يطلب ارتفاعه الطبيعي وما ينقص
                    height: "auto",
                    minHeight: 260,
                    overflow: "visible",
                  }}
                >
                  <GoldSilverCard />
                </Box>
              </GlassCard>
            </Box>

            <GlassCard
              title={t("home.sections.crypto.title", "Crypto Highlights")}
              subtitle={t("home.sections.crypto.subtitle", "Top coins & moves")}
            >
              <CryptoHomeCard />
            </GlassCard>

            <GlassCard
              title={t("home.sections.trends.title", "Live Market Trends")}
              subtitle={t("home.sections.trends.subtitle", "Track momentum across the market")}
              action={
                <Chip
                  label={t("home.sections.trends.chip", "Pulse")}
                  size="small"
                  sx={{
                    color: "rgba(255,255,255,0.92)",
                    bgcolor: "rgba(123,92,255,0.12)",
                    border: "1px solid rgba(123,92,255,0.22)",
                    fontWeight: 900,
                  }}
                />
              }
            >
              <MarketTrendsChart />
            </GlassCard>

            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                mt: 0.5,
              }}
            >
              <Box>
                <Typography
                  sx={{ color: "#fff", fontWeight: 1000, fontSize: 18 }}
                >
                  {t("home.sections.news.title", "Latest News")}
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 13,
                    mt: 0.3,
                  }}
                >
                  {t("home.sections.news.subtitle", "Curated updates to keep you ahead.")}
                </Typography>
              </Box>

              <Button
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#39c6ff",
                  "&:hover": { backgroundColor: "rgba(58,198,255,0.08)" },
                }}
              >
                {t("home.sections.news.viewAll", "View all")}
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: { xs: 2, md: 2.5 },
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              }}
            >
              <GlassCard contentSx={{ p: 0 }}>
                <NewsCard />
              </GlassCard>

              <GlassCard contentSx={{ p: 0 }}>
                <NewsCardTow />
              </GlassCard>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ height: { xs: 26, md: 40 } }} />
      </Box>
    </Box>
  );
}
