import * as React from "react";
import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  LinearProgress,
  Skeleton,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useTranslation } from "react-i18next";

const PER_PAGE = 25;

//
const API_URL_1 =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=1&sparkline=false&price_change_percentage=24h";
const API_URL_2 =
  "https://www.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=1&sparkline=false&price_change_percentage=24h";

function fetchWithTimeout(url, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

function formatCompact(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

function formatMoney(n, currency = "USD") {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);
}

function ChangePill({ value }) {
  const v = typeof value === "number" ? value : 0;
  const isUp = v > 0;
  const isDown = v < 0;

  const bg = isUp
    ? "rgba(76,175,80,0.14)"
    : isDown
      ? "rgba(244,67,54,0.14)"
      : "rgba(255,255,255,0.08)";

  const border = isUp
    ? "rgba(76,175,80,0.35)"
    : isDown
      ? "rgba(244,67,54,0.35)"
      : "rgba(255,255,255,0.14)";

  const color = isUp
    ? "#7CFF9B"
    : isDown
      ? "#FF8A8A"
      : "rgba(255,255,255,0.75)";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.7,
        px: 1.2,
        py: 0.55,
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 0.2,
        minWidth: 88,
        justifyContent: "flex-end",
      }}
    >
      {isUp ? (
        <NorthEastIcon sx={{ fontSize: 16, opacity: 0.9 }} />
      ) : isDown ? (
        <SouthEastIcon sx={{ fontSize: 16, opacity: 0.9 }} />
      ) : null}
      {typeof value === "number" ? `${value.toFixed(2)}%` : "—"}
    </Box>
  );
}

function MetricCard({ label, value, hint, accent = "blue" }) {
  const accentBg =
    accent === "purple"
      ? "radial-gradient(420px 140px at 15% 20%, rgba(123,92,255,0.20) 0%, rgba(0,0,0,0) 60%)"
      : accent === "green"
        ? "radial-gradient(420px 140px at 15% 20%, rgba(76,175,80,0.18) 0%, rgba(0,0,0,0) 60%)"
        : accent === "red"
          ? "radial-gradient(420px 140px at 15% 20%, rgba(244,67,54,0.18) 0%, rgba(0,0,0,0) 60%)"
          : "radial-gradient(420px 140px at 15% 20%, rgba(77,196,255,0.20) 0%, rgba(0,0,0,0) 60%)";

  return (
    <Box
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.22)",
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden",
        px: 2,
        py: 1.7,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: -40,
          background: accentBg,
          pointerEvents: "none",
        }}
      />
      <Box sx={{ position: "relative" }}>
        <Typography sx={{ color: "rgba(255,255,255,0.70)", fontSize: 12 }}>
          {label}
        </Typography>
        <Typography
          sx={{ color: "#fff", fontWeight: 1000, fontSize: 20, mt: 0.4 }}
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
    </Box>
  );
}

export default function CryptoPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("market_cap");
  const [sortDir, setSortDir] = useState("desc");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchCrypto = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let res = await fetchWithTimeout(API_URL_1, 12000);

      if (!res.ok) {
        res = await fetchWithTimeout(API_URL_2, 12000);
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error(t("cryptoPage.errors.unexpectedResponse", "Unexpected API response"));
      }

      setCoins(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("CoinGecko error:", err);

      const msg =
        err?.name === "AbortError"
          ? t("cryptoPage.errors.timeout", "Request timed out. Please try again.")
          : String(err?.message || "").includes("429")
            ? t(
                "cryptoPage.errors.rateLimit",
                "Too many requests (CoinGecko rate limit). Wait 30–60 seconds and refresh.",
              )
            : String(err?.message || "").includes("403")
              ? t(
                  "cryptoPage.errors.blocked",
                  "Request blocked (403). Try a different network or add a backend proxy.",
                )
              : t("cryptoPage.errors.generic", "Error loading crypto prices. Please try again.");

      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCrypto();
  }, [fetchCrypto]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q
      ? coins
      : coins.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.symbol?.toLowerCase().includes(q),
        );

    const dir = sortDir === "asc" ? 1 : -1;

    return [...base].sort((a, b) => {
      const av = a?.[sortKey];
      const bv = b?.[sortKey];

      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }, [coins, query, sortKey, sortDir]);

  const metrics = useMemo(() => {
    if (!coins.length) {
      return { totalCap: "—", topGainer: "—", topLoser: "—", btcDom: "—" };
    }

    const totalCapNum = coins.reduce((s, c) => s + (c.market_cap || 0), 0);

    const sortedByChange = [...coins].sort(
      (a, b) =>
        (b.price_change_percentage_24h || 0) -
        (a.price_change_percentage_24h || 0),
    );
    const gainer = sortedByChange[0];
    const loser = sortedByChange[sortedByChange.length - 1];

    const btc = coins.find((c) => c.symbol?.toLowerCase() === "btc");
    const btcDomNum =
      btc && totalCapNum ? ((btc.market_cap || 0) / totalCapNum) * 100 : null;

    return {
      totalCap: `$${formatCompact(totalCapNum)}`,
      topGainer: gainer
        ? `${gainer.symbol?.toUpperCase()} ${(
            gainer.price_change_percentage_24h || 0
          ).toFixed(2)}%`
        : "—",
      topLoser: loser
        ? `${loser.symbol?.toUpperCase()} ${(
            loser.price_change_percentage_24h || 0
          ).toFixed(2)}%`
        : "—",
      btcDom: btcDomNum ? `${btcDomNum.toFixed(1)}%` : "—",
    };
  }, [coins]);

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const openCoin = (coin) => {
    const url = `https://www.coingecko.com/en/coins/${coin.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: { xs: 11, md: 12 },
        pb: { xs: 5, md: 7 },
        px: { xs: 2, md: 0 },
        color: "#fff",
        background:
          "radial-gradient(1200px 650px at 18% 12%, rgba(77,196,255,0.20) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 82% 20%, rgba(123,92,255,0.16) 0%, rgba(0,0,0,0) 55%), linear-gradient(180deg, rgba(6,16,38,0.45) 0%, rgba(8,18,38,0.92) 55%, rgba(6,12,28,0.98) 100%)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
      <Box
        sx={{ width: { xs: "100%", md: "80%" }, maxWidth: 1320, mx: "auto" }}
      >
        <Box
          sx={{
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "rgba(0,0,0,0.22)",
            backdropFilter: "blur(12px)",
            px: { xs: 2.2, md: 3.2 },
            py: { xs: 2.6, md: 3.3 },
            overflow: "hidden",
            position: "relative",
            mb: { xs: 2.2, md: 3 },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: -80,
              background:
                "radial-gradient(520px 220px at 16% 25%, rgba(77,196,255,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(540px 240px at 70% 0%, rgba(123,92,255,0.18) 0%, rgba(0,0,0,0) 60%)",
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
              <Box sx={{ textAlign: { xs: "center", md: isAr ? "right" : "left" } }}>
                <Typography
                  sx={{
                    fontWeight: 1000,
                    letterSpacing: 0.4,
                    fontSize: { xs: 26, sm: 32, md: 44 },
                    lineHeight: 1.08,
                  }}
                >
                  {t("cryptoPage.heroTitle", "Digital Assets — Live Prices")}
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
                    "cryptoPage.heroSubtitle",
                    "A premium crypto terminal: track top coins by market cap, spot daily movers, and sort the market in seconds.",
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
                    label={t("cryptoPage.heroChips.topMarketCap", "Top market cap")}
                    sx={{
                      color: "rgba(255,255,255,0.92)",
                      bgcolor: "rgba(58,198,255,0.14)",
                      border: "1px solid rgba(58,198,255,0.25)",
                      fontWeight: 800,
                    }}
                  />
                  <Chip
                    label={t("cryptoPage.heroChips.movers24h", "24h movers")}
                    sx={{
                      color: "rgba(255,255,255,0.92)",
                      bgcolor: "rgba(76,175,80,0.12)",
                      border: "1px solid rgba(76,175,80,0.22)",
                      fontWeight: 800,
                    }}
                  />
                  <Chip
                    label={t("cryptoPage.heroChips.sortSearch", "Sort & search")}
                    sx={{
                      color: "rgba(255,255,255,0.92)",
                      bgcolor: "rgba(123,92,255,0.12)",
                      border: "1px solid rgba(123,92,255,0.22)",
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              </Box>

              <Button
                onClick={fetchCrypto}
                variant="contained"
                startIcon={<RefreshIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 1000,
                  borderRadius: 999,
                  px: 2.2,
                  py: 1,
                  background:
                    "linear-gradient(135deg, #23A6E8 0%, #4DC4FF 45%, #82D8FF 100%)",
                  boxShadow:
                    "0 14px 34px rgba(0,0,0,0.55), 0 0 18px rgba(77,196,255,0.35)",
                }}
              >
                {t("cryptoPage.refresh", "Refresh")}
              </Button>
            </Stack>

            <Box
              sx={{
                mt: { xs: 2.2, md: 2.8 },
                display: "grid",
                gap: 1.6,
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              }}
            >
              <MetricCard
                label={t("cryptoPage.metrics.totalMarketCap", "Total Market Cap")}
                value={metrics.totalCap}
                hint={t("cryptoPage.metrics.topCoinsHint", {
                  defaultValue: "Top {{count}} coins",
                  count: PER_PAGE,
                })}
              />
              <MetricCard
                label={t("cryptoPage.metrics.topGainer", "Top Gainer (24h)")}
                value={metrics.topGainer}
                hint={t("cryptoPage.metrics.topGainerHint", "Highest 24h % change")}
                accent="green"
              />
              <MetricCard
                label={t("cryptoPage.metrics.topLoser", "Top Loser (24h)")}
                value={metrics.topLoser}
                hint={t("cryptoPage.metrics.topLoserHint", "Lowest 24h % change")}
                accent="red"
              />
              <MetricCard
                label={t("cryptoPage.metrics.btcDominance", "BTC Dominance")}
                value={metrics.btcDom}
                hint={t("cryptoPage.metrics.btcDominanceHint", "Within this list")}
                accent="purple"
              />
            </Box>
          </Box>
        </Box>

        <Card
          sx={{
            borderRadius: 5,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              "linear-gradient(145deg, rgba(18,33,67,0.78) 0%, rgba(10,20,45,0.75) 55%, rgba(6,10,22,0.82) 100%)",
            boxShadow:
              "0 26px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(14px)",
          }}
        >
          <Box
            sx={{
              px: { xs: 2.2, md: 2.8 },
              py: 2,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 1.4,
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(90deg, rgba(19,33,69,0.70), rgba(36,53,98,0.55))",
            }}
          >
            <Box>
              <Typography
                sx={{ fontWeight: 1000, fontSize: 16, color: "#fff" }}
              >
                {t("cryptoPage.table.title", "Market Table")}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "rgba(255,255,255,0.65)",
                  mt: 0.3,
                }}
              >
                {t(
                  "cryptoPage.table.subtitle",
                  "Click a coin to open details · Sort columns · Search instantly",
                )}
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.2}
              alignItems="center"
            >
              <TextField
                size="small"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(
                  "cryptoPage.table.searchPlaceholder",
                  "Search coin… (BTC, Ethereum, SOL)",
                )}
                sx={{
                  minWidth: { xs: "100%", sm: 360 },
                  "& .MuiInputBase-root": {
                    color: "#fff",
                    borderRadius: 999,
                    backgroundColor: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(10px)",
                  },
                  "& fieldset": { border: "none" },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "rgba(255,255,255,0.65)" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Chip
                label={
                  lastUpdated
                    ? t("cryptoPage.table.updatedAt", {
                        defaultValue: "Updated: {{time}}",
                        time: lastUpdated.toLocaleTimeString(),
                      })
                    : t("cryptoPage.table.updatedEmpty", "Updated: —")
                }
                sx={{
                  color: "rgba(255,255,255,0.85)",
                  bgcolor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontWeight: 800,
                }}
              />
            </Stack>
          </Box>

          {loading && (
            <LinearProgress sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
          )}

          <CardContent sx={{ p: 0 }}>
            {error && (
              <Box sx={{ p: 2.4 }}>
                <Typography sx={{ color: "#ff8585", fontSize: 13 }}>
                  {error}
                </Typography>
                <Button
                  onClick={fetchCrypto}
                  startIcon={<RefreshIcon />}
                  sx={{
                    mt: 1.2,
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 999,
                    color: "#39c6ff",
                    "&:hover": { backgroundColor: "rgba(58,198,255,0.08)" },
                  }}
                >
                  {t("cryptoPage.tryAgain", "Try again")}
                </Button>
              </Box>
            )}

            {!error && (
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: "rgba(255,255,255,0.80)",
                          fontSize: 12,
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                          backgroundColor: "rgba(6,10,22,0.92)",
                        }}
                      >
                        #
                      </TableCell>

                      <TableCell
                        sx={{
                          color: "rgba(255,255,255,0.80)",
                          fontSize: 12,
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                          backgroundColor: "rgba(6,10,22,0.92)",
                        }}
                      >
                        {t("cryptoPage.table.columns.coin", "Coin")}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: "rgba(255,255,255,0.80)",
                          fontSize: 12,
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                          backgroundColor: "rgba(6,10,22,0.92)",
                        }}
                      >
                        <TableSortLabel
                          active={sortKey === "current_price"}
                          direction={
                            sortKey === "current_price" ? sortDir : "desc"
                          }
                          onClick={() => onSort("current_price")}
                          sx={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          {t("cryptoPage.table.columns.price", "Price")}
                        </TableSortLabel>
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: "rgba(255,255,255,0.80)",
                          fontSize: 12,
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                          backgroundColor: "rgba(6,10,22,0.92)",
                        }}
                      >
                        <TableSortLabel
                          active={sortKey === "price_change_percentage_24h"}
                          direction={
                            sortKey === "price_change_percentage_24h"
                              ? sortDir
                              : "desc"
                          }
                          onClick={() => onSort("price_change_percentage_24h")}
                          sx={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          24h %
                        </TableSortLabel>
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: "rgba(255,255,255,0.80)",
                          fontSize: 12,
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                          backgroundColor: "rgba(6,10,22,0.92)",
                        }}
                      >
                        <TableSortLabel
                          active={sortKey === "market_cap"}
                          direction={
                            sortKey === "market_cap" ? sortDir : "desc"
                          }
                          onClick={() => onSort("market_cap")}
                          sx={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          {t("cryptoPage.table.columns.marketCap", "Market Cap")}
                        </TableSortLabel>
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          color: "rgba(255,255,255,0.80)",
                          fontSize: 12,
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                          backgroundColor: "rgba(6,10,22,0.92)",
                        }}
                      >
                        {t("cryptoPage.table.columns.action", "Action")}
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loading && !coins.length
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell
                              sx={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <Skeleton
                                variant="text"
                                width={20}
                                sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1.2}
                                alignItems="center"
                              >
                                <Skeleton
                                  variant="circular"
                                  width={22}
                                  height={22}
                                  sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                                />
                                <Skeleton
                                  variant="text"
                                  width={160}
                                  sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                                />
                              </Stack>
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <Skeleton
                                variant="text"
                                width={90}
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.08)",
                                  ml: "auto",
                                }}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <Skeleton
                                variant="text"
                                width={80}
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.08)",
                                  ml: "auto",
                                }}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <Skeleton
                                variant="text"
                                width={110}
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.08)",
                                  ml: "auto",
                                }}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <Skeleton
                                variant="text"
                                width={60}
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.08)",
                                  ml: "auto",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      : filtered.map((coin, index) => (
                          <TableRow
                            key={coin.id}
                            onClick={() => openCoin(coin)}
                            sx={{
                              cursor: "pointer",
                              "&:nth-of-type(odd)": {
                                backgroundColor: "rgba(255,255,255,0.02)",
                              },
                              "&:hover": {
                                backgroundColor: "rgba(58,198,255,0.09)",
                              },
                            }}
                          >
                            <TableCell
                              sx={{
                                color: "rgba(255,255,255,0.80)",
                                fontSize: 12,
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                                width: 40,
                              }}
                            >
                              {index + 1}
                            </TableCell>

                            <TableCell
                              sx={{
                                color: "rgba(255,255,255,0.92)",
                                fontSize: 13,
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1.1}
                                alignItems="center"
                              >
                                <img
                                  src={coin.image}
                                  alt={coin.name}
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                  }}
                                />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    sx={{
                                      fontWeight: 900,
                                      lineHeight: 1.15,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: { xs: 160, sm: 260, md: 360 },
                                    }}
                                  >
                                    {coin.name}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: 11.5,
                                      opacity: 0.75,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.6,
                                    }}
                                  >
                                    {coin.symbol}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                color: "rgba(255,255,255,0.92)",
                                fontSize: 13,
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                                fontWeight: 800,
                              }}
                            >
                              {formatMoney(coin.current_price, "USD")}
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ChangePill
                                value={coin.price_change_percentage_24h}
                              />
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                color: "rgba(255,255,255,0.78)",
                                fontSize: 12,
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              {formatMoney(coin.market_cap, "USD")}
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.06)",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openCoin(coin);
                              }}
                            >
                              <Button
                                size="small"
                                endIcon={<OpenInNewIcon />}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 900,
                                  color: "#39c6ff",
                                  borderRadius: 999,
                                  "&:hover": {
                                    backgroundColor: "rgba(58,198,255,0.10)",
                                  },
                                }}
                              >
                                {t("cryptoPage.open", "Open")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: 11.5,
                opacity: 0.7,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {t(
                "cryptoPage.dataSource",
                "Data source: CoinGecko public API (demo). Prices may be delayed.",
              )}
            </Typography>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
