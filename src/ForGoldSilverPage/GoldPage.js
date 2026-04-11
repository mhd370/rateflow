// src/GoldPage.js
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { ArrowUpward, ArrowDownward, TrendingUp } from "@mui/icons-material";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// 🔹 استيراد الأعلام
import Flags from "../ForHomePage/Flags";

// أسعار تقريبية تجريبية (أونصة بالـ USD)
const GOLD_OUNCE_USD = 2345.8;
const SILVER_OUNCE_USD = 28.15;

// 🔹 بيانات تجريبية للمخطط – ذهب
const GOLD_HISTORY = {
  "1D": [
    { label: "09:00", price: 2338 },
    { label: "11:00", price: 2342 },
    { label: "13:00", price: 2348 },
    { label: "15:00", price: 2341 },
    { label: "17:00", price: 2345 },
    { label: "19:00", price: 2347 },
  ],
  "1W": [
    { label: "Mon", price: 2320 },
    { label: "Tue", price: 2335 },
    { label: "Wed", price: 2340 },
    { label: "Thu", price: 2352 },
    { label: "Fri", price: 2346 },
  ],
  "1M": [
    { label: "Week 1", price: 2290 },
    { label: "Week 2", price: 2315 },
    { label: "Week 3", price: 2330 },
    { label: "Week 4", price: 2345 },
  ],
  "1Y": [
    { label: "Feb", price: 1970 },
    { label: "Apr", price: 2050 },
    { label: "Jun", price: 2140 },
    { label: "Aug", price: 2210 },
    { label: "Oct", price: 2280 },
    { label: "Dec", price: 2345 },
  ],
};

//  بيانات تجريبية للمخطط – فضة
const SILVER_HISTORY = {
  "1D": [
    { label: "09:00", price: 27.8 },
    { label: "11:00", price: 28.0 },
    { label: "13:00", price: 28.3 },
    { label: "15:00", price: 28.1 },
    { label: "17:00", price: 28.2 },
    { label: "19:00", price: 28.15 },
  ],
  "1W": [
    { label: "Mon", price: 27.3 },
    { label: "Tue", price: 27.6 },
    { label: "Wed", price: 27.9 },
    { label: "Thu", price: 28.4 },
    { label: "Fri", price: 28.15 },
  ],
  "1M": [
    { label: "Week 1", price: 26.5 },
    { label: "Week 2", price: 27.1 },
    { label: "Week 3", price: 27.8 },
    { label: "Week 4", price: 28.15 },
  ],
  "1Y": [
    { label: "Feb", price: 23.2 },
    { label: "Apr", price: 24.8 },
    { label: "Jun", price: 25.6 },
    { label: "Aug", price: 26.9 },
    { label: "Oct", price: 27.5 },
    { label: "Dec", price: 28.1 },
  ],
};

const CURRENCIES = [
  { code: "USD", name: "US Dollar", flag: "us" },
  { code: "EUR", name: "Euro", flag: "eu" },
  { code: "GBP", name: "British Pound", flag: "gb" },
  { code: "JPY", name: "Japanese Yen", flag: "jp" },
  { code: "CHF", name: "Swiss Franc", flag: "ch" },
  { code: "CAD", name: "Canadian Dollar", flag: "ca" },
  { code: "AUD", name: "Australian Dollar", flag: "au" },
  { code: "TRY", name: "Turkish Lira", flag: "tr" },
  { code: "SYP", name: "Syrian Pound", flag: "sy" },
];

// مشان ال API
const FX_API_URL = "https://api.currencyapi.com/v3/latest?base_currency=USD";
const FX_API_KEY = String(process.env.REACT_APP_CURRENCY_API_KEY || "").trim();

export default function GoldPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [timeframe, setTimeframe] = useState("1M");
  const [metal, setMetal] = useState("gold"); // gold or silver
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [fxRates, setFxRates] = useState(null);
  const [fxError, setFxError] = useState("");
  const [fxLoading, setFxLoading] = useState(false);

  // تغيّر 24 ساعة – أرقام تجريبية
  const goldChangePct = +0.65;
  const silverChangePct = -0.32;

  useEffect(() => {
    const fetchFxRates = async () => {
      try {
        setFxLoading(true);
        setFxError("");
        const res = await fetch(FX_API_URL, {
          headers: {
            apikey: FX_API_KEY,
          },
        });
        if (!res.ok) {
          throw new Error("FX network error");
        }
        const data = await res.json();
        setFxRates(data.data);
      } catch (err) {
        console.error(err);
        setFxError(t("gold.fxError", "Error loading FX rates. Showing USD only."));
      } finally {
        setFxLoading(false);
      }
    };

    fetchFxRates();
  }, [t]);

  // دالة مساعدة لتحويل الذهب/الفضة لأي عملة
  const getFxRate = (code) => {
    if (code === "USD") return 1;
    if (!fxRates) return null;
    return fxRates[code]?.value || null;
  };

  const currentOunceUSD = metal === "gold" ? GOLD_OUNCE_USD : SILVER_OUNCE_USD;
  const currentChangePct = metal === "gold" ? goldChangePct : silverChangePct;
  const currentHistory =
    metal === "gold" ? GOLD_HISTORY[timeframe] : SILVER_HISTORY[timeframe];

  const currentColor = metal === "gold" ? "#ffeb3b" : "#b3e5fc";
  const gradientId = metal === "gold" ? "goldArea" : "silverArea";
  const instrumentCode = metal === "gold" ? "XAU" : "XAG";
  const metalName =
    metal === "gold" ? t("gold.metals.gold", "Gold") : t("gold.metals.silver", "Silver");

  const priceInSelectedCurrency = (() => {
    const rate = getFxRate(baseCurrency);
    if (!rate) return null;
    return currentOunceUSD * rate;
  })();

  const renderChangeChip = (pct, label) => {
    const isUp = pct > 0;
    const Icon = isUp ? ArrowUpward : ArrowDownward;
    const bg = isUp ? "rgba(76,175,80,0.1)" : "rgba(244,67,54,0.12)";

    return (
      <Chip
        icon={<Icon sx={{ fontSize: 14 }} />}
        label={`${label} ${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`}
        size="small"
        sx={{
          fontSize: 11,
          height: 24,
          borderRadius: "999px",
          bgcolor: bg,
          color: "white",
        }}
      />
    );
  };

  // 🔹 عرض العملة المختارة مع العلم
  const renderSelectedCurrency = (selected) => {
    const curr = CURRENCIES.find((c) => c.code === selected);
    if (!curr) return selected;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Flags countryCode={curr.flag} size={18} />
        <span>{curr.code}</span>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "80vh",
        paddingTop: "120px",
        paddingX: { xs: 2.5, md: 8 },
        pb: 6,
        color: "white",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
      {/* العنوان الرئيسي */}
      <Box sx={{ mb: 4, maxWidth: 830 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <TrendingUp sx={{ fontSize: 24, color: "#ffc857" }} />
          <Typography
            sx={{
              fontSize: 30,
              fontWeight: 700,
              color: "white",
            }}
          >
            {t("gold.title", "Gold & Silver Spot Dashboard")}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 14, opacity: 0.78 }}>
          {t(
            "gold.subtitle",
            "Live reference prices for gold (XAU) and silver (XAG), compared against your selected currency, with daily performance and trend overview.",
          )}
        </Typography>
      </Box>

      {/* الصف الرئيسي: المخطط + معلومات الأسعار */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.6fr 1fr" },
          gap: 3.5,
          mb: 4,
        }}
      >
        {/* المخطط البياني */}
        <Card
          sx={{
            borderRadius: 3,
            background:
              "linear-gradient(145deg, rgba(10,15,30,0.96), rgba(24,37,70,0.92))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
            overflow: "hidden",
            color: "white",
          }}
        >
          <CardContent sx={{ p: 2.5, pb: 2 }}>
            {/* Header */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              mb={2}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {t("gold.chartHeaderTitle", {
                    defaultValue: "{{metal}} ({{code}}) – Spot Price",
                    metal: metalName,
                    code: instrumentCode,
                  })}
                </Typography>
                <Typography sx={{ fontSize: 13, opacity: 0.75 }}>
                  {t("gold.chartHeaderSubtitle", {
                    defaultValue: "Ounce price trend in {{currency}}.",
                    currency: baseCurrency,
                  })}
                </Typography>
              </Box>

              {/* اختيار المعدن + العملة + التايم فريم */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                {/* تبديل بين ذهب / فضة */}
                <Stack direction="row" spacing={0.7}>
                  {[
                    { key: "gold", label: t("gold.metals.gold", "Gold") },
                    { key: "silver", label: t("gold.metals.silver", "Silver") },
                  ].map((m) => (
                    <Button
                      key={m.key}
                      size="small"
                      onClick={() => setMetal(m.key)}
                      sx={{
                        textTransform: "none",
                        fontSize: 12,
                        px: 1.4,
                        py: 0.3,
                        borderRadius: "999px",
                        border:
                          metal === m.key
                            ? "1px solid #ffc857"
                            : "1px solid rgba(255,255,255,0.22)",
                        bgcolor:
                          metal === m.key
                            ? "rgba(255,215,64,0.18)"
                            : "rgba(5,10,25,0.75)",
                        color:
                          metal === m.key
                            ? "#ffec8b"
                            : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {m.label}
                    </Button>
                  ))}
                </Stack>

                {/* اختيار العملة */}
                <Select
                  size="small"
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  renderValue={renderSelectedCurrency}
                  sx={{
                    minWidth: 150,
                    fontSize: 13,
                    bgcolor: "rgba(5,10,25,0.85)",
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#39c6ff",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#39c6ff",
                    },
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Flags countryCode={c.flag} size={18} />
                        <span>
                          {c.code} – {c.name}
                        </span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>

                {/* أزرار التايم فريم */}
                <Stack direction="row" spacing={0.7}>
                  {["1D", "1W", "1M", "1Y"].map((tf) => (
                    <Button
                      key={tf}
                      size="small"
                      onClick={() => setTimeframe(tf)}
                      sx={{
                        textTransform: "none",
                        fontSize: 12,
                        px: 1.4,
                        py: 0.3,
                        borderRadius: "999px",
                        border:
                          timeframe === tf
                            ? "1px solid #39c6ff"
                            : "1px solid rgba(255,255,255,0.22)",
                        bgcolor:
                          timeframe === tf
                            ? "rgba(57,198,255,0.18)"
                            : "rgba(5,10,25,0.75)",
                        color:
                          timeframe === tf
                            ? "#39c6ff"
                            : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {tf}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Stack>

            <Divider
              sx={{
                mb: 2,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            />

            {/* قيمة المعدن الحالية */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              mb={2}
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    opacity: 0.8,
                  }}
                >
                  {t("gold.currentPriceLabel", {
                    defaultValue: "Current {{metal}} price (per ounce)",
                    metal: metalName,
                  })}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: metal === "gold" ? "#ffec8b" : "#b3e5fc",
                  }}
                >
                  {priceInSelectedCurrency
                    ? `${priceInSelectedCurrency.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} ${baseCurrency}`
                    : `${currentOunceUSD.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} USD`}
                </Typography>
              </Box>

              <Stack spacing={1} alignItems="flex-end">
                {renderChangeChip(currentChangePct, "24h")}
                <Typography
                  sx={{
                    fontSize: 11,
                    opacity: 0.7,
                  }}
                >
                  {t("gold.referenceOnly", "Reference only – may differ from execution price.")}
                </Typography>
              </Stack>
            </Stack>

            {/* المخطط */}
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={currentColor}
                        stopOpacity={0.85}
                      />
                      <stop
                        offset="95%"
                        stopColor={currentColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(5,10,25,0.95)",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                    formatter={(value) => [
                      `${value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} ${baseCurrency}`,
                      metalName,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={currentColor}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>

            {fxLoading && (
              <Typography
                sx={{
                  mt: 1.5,
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                {t("gold.fxLoading", "Loading FX rates…")}
              </Typography>
            )}
            {fxError && (
              <Typography
                sx={{
                  mt: 1.5,
                  fontSize: 11,
                  color: "#ff8585",
                }}
              >
                {fxError}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* الكروت الجانبية: الذهب والفضة */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {/* كارد الذهب */}
          <Card
            sx={{
              borderRadius: 3,
              background:
                "linear-gradient(145deg, rgba(24,37,70,0.96), rgba(36,53,98,0.96))",
              border: "1px solid rgba(255,235,59,0.3)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.7)",
              color: "white",
            }}
          >
            <CardContent sx={{ p: 2.4 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={1.5}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 14,
                      textTransform: "uppercase",
                      opacity: 0.9,
                    }}
                  >
                    {t("gold.metals.gold", "Gold")} • XAU
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#ffec8b",
                    }}
                  >
                    {GOLD_OUNCE_USD.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD
                  </Typography>
                </Box>
                {renderChangeChip(goldChangePct, "24h")}
              </Stack>

              <Typography
                sx={{
                  fontSize: 12,
                  opacity: 0.78,
                  mb: 1,
                }}
              >
                {t(
                  "gold.cards.gold.description",
                  "Benchmark ounce price in USD. Use the selector in the main chart to view gold in your preferred base currency.",
                )}
              </Typography>

              <Divider
                sx={{
                  my: 1.5,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              />

              <Stack spacing={0.7} sx={{ fontSize: 12 }}>
                <Typography sx={{ opacity: 0.8 }}>
                  {t("gold.cards.gold.bullets.instrument", "• Instrument: XAU/USD (spot)")}
                </Typography>
                <Typography sx={{ opacity: 0.8 }}>
                  {t("gold.cards.gold.bullets.unit", "• Unit: 1 fine troy ounce")}
                </Typography>
                <Typography sx={{ opacity: 0.8 }}>
                  {t(
                    "gold.cards.gold.bullets.role",
                    "• Role: hedge asset, inflation protection, long-term store of value.",
                  )}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* كارد الفضة */}
          <Card
            sx={{
              borderRadius: 3,
              background:
                "linear-gradient(145deg, rgba(10,20,40,0.96), rgba(30,40,70,0.96))",
              border: "1px solid rgba(179,229,252,0.4)",
              boxShadow: "0 16px 36px rgba(0,0,0,0.65)",
              color: "white",
            }}
          >
            <CardContent sx={{ p: 2.4 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={1.5}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 14,
                      textTransform: "uppercase",
                      opacity: 0.9,
                    }}
                  >
                    {t("gold.metals.silver", "Silver")} • XAG
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#b3e5fc",
                    }}
                  >
                    {SILVER_OUNCE_USD.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD
                  </Typography>
                </Box>
                {renderChangeChip(silverChangePct, "24h")}
              </Stack>

              <Typography
                sx={{
                  fontSize: 12,
                  opacity: 0.78,
                  mb: 1,
                }}
              >
                {t(
                  "gold.cards.silver.description",
                  "Silver spot price in USD per ounce. Often trades with higher volatility than gold and is heavily driven by industrial demand.",
                )}
              </Typography>

              <Divider
                sx={{
                  my: 1.5,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              />

              <Stack spacing={0.7} sx={{ fontSize: 12 }}>
                <Typography sx={{ opacity: 0.8 }}>
                  {t("gold.cards.silver.bullets.instrument", "• Instrument: XAG/USD (spot)")}
                </Typography>
                <Typography sx={{ opacity: 0.8 }}>
                  {t(
                    "gold.cards.silver.bullets.uses",
                    "• Used in industry, solar, electronics, jewelry.",
                  )}
                </Typography>
                <Typography sx={{ opacity: 0.8 }}>
                  {t(
                    "gold.cards.silver.bullets.volatility",
                    "• Typically more volatile and tactical than gold.",
                  )}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Typography
        sx={{
          mt: 1,
          fontSize: 11,
          opacity: 0.65,
        }}
      >
        {t(
          "gold.disclaimer",
          "Prices shown are indicative and for informational purposes only. They do not represent a firm bid/ask from Rate Flow or any liquidity provider.",
        )}
      </Typography>
    </Box>
  );
}
