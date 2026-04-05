import * as React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Divider,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";

import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";
import AssetIcon from "../components/AssetIcon";
import {
  CONVERTER_UNIT_TYPES,
  getConverterUnit,
  getConverterUnits,
  getCryptoCoinId,
} from "../assets/assetCatalog";

const FIAT_UNITS = getConverterUnits(CONVERTER_UNIT_TYPES.FIAT);
const CRYPTO_UNITS = getConverterUnits(CONVERTER_UNIT_TYPES.CRYPTO);
const METAL_UNITS = getConverterUnits(CONVERTER_UNIT_TYPES.METAL);

const FIAT = FIAT_UNITS.map((u) => u.code);
const CRYPTO = CRYPTO_UNITS.map((u) => u.code);

const GRAMS_PER_TROY_OUNCE = 31.1034768;

const CURRENCY_API_BASE_URL = "https://api.currencyapi.com/v3/latest";
const COINGECKO_BASES = [
  "https://api.coingecko.com/api/v3",
  "https://www.coingecko.com/api/v3",
];

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatTime(value) {
  if (!value) return "--";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  try {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return d.toLocaleTimeString();
  }
}

function createTimeoutSignal(externalSignal, timeoutMs) {
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
    },
  };
}

async function fetchJson(url, { signal, timeoutMs = 12000, headers } = {}) {
  const { signal: combinedSignal, cleanup } = createTimeoutSignal(signal, timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: combinedSignal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    return await res.json();
  } finally {
    cleanup();
  }
}

async function fetchCurrencyApiRates({ apiKey, baseCurrency = "USD", currencies, signal } = {}) {
  if (!apiKey) {
    const err = new Error("Missing CurrencyAPI key.");
    err.code = "MISSING_API_KEY";
    throw err;
  }

  const url = new URL(CURRENCY_API_BASE_URL);
  url.searchParams.set("base_currency", baseCurrency);
  if (Array.isArray(currencies) && currencies.length) {
    url.searchParams.set("currencies", currencies.join(","));
  }

  const data = await fetchJson(url.toString(), {
    signal,
    timeoutMs: 14000,
    headers: {
      apikey: apiKey,
      accept: "application/json",
    },
  });

  if (data?.error) {
    const err = new Error(data.error?.message || "CurrencyAPI error.");
    err.code = "API_ERROR";
    throw err;
  }

  const out = {};
  const obj = data?.data || {};
  for (const [code, meta] of Object.entries(obj)) {
    const v = Number(meta?.value);
    if (Number.isFinite(v) && v > 0) out[code] = v;
  }
  return out;
}

async function tryFetchCoinGecko(path, options) {
  let lastErr;
  for (const base of COINGECKO_BASES) {
    const url = `${base}${path}`;
    try {
      return await fetchJson(url, options);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("CoinGecko request failed.");
}

async function fetchCoinGeckoCryptoUsdPrices({ symbols, signal } = {}) {
  const wanted = Array.isArray(symbols) ? symbols : [];
  const ids = wanted.map((s) => getCryptoCoinId(s)).filter(Boolean);
  if (!ids.length) return {};

  const path = `/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`;
  const data = await tryFetchCoinGecko(path, {
    signal,
    timeoutMs: 12000,
    headers: { accept: "application/json" },
  });

  const out = {};
  for (const symbol of wanted) {
    const id = getCryptoCoinId(symbol);
    const price = id ? toNumber(data?.[id]?.usd) : null;
    if (price != null && price > 0) out[symbol] = price;
  }
  return out;
}

function getUnitsPerUsd({ type, code, fxRates, cryptoUsdPrices }) {
  if (!type || !code) return null;

  if (type === "Fiat") {
    if (code === "USD") return 1;
    const v = toNumber(fxRates?.[code]);
    return v && v > 0 ? v : null;
  }

  if (type === "Crypto") {
    const priceUsd = toNumber(cryptoUsdPrices?.[code]);
    if (!priceUsd || priceUsd <= 0) return null;
    return 1 / priceUsd;
  }

  // Metals are computed via XAU/XAG from CurrencyAPI (troy ounce units).
  const xau = toNumber(fxRates?.XAU);
  const xag = toNumber(fxRates?.XAG);

  if (code === "GOLD_OUNCE") return xau && xau > 0 ? xau : null;
  if (code === "SILVER_OUNCE") return xag && xag > 0 ? xag : null;
  if (code === "GOLD_GRAM") return xau && xau > 0 ? xau * GRAMS_PER_TROY_OUNCE : null;
  if (code === "SILVER_GRAM") return xag && xag > 0 ? xag * GRAMS_PER_TROY_OUNCE : null;

  return null;
}

function formatConvertedValue(value, { type }) {
  const n = toNumber(value);
  if (n == null) return "";

  const maxDigits =
    type === "Fiat"
      ? 2
      : type === "Crypto"
        ? n >= 1
          ? 6
          : 8
        : n >= 10
          ? 3
          : 4;

  try {
    return n.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
  } catch {
    return n.toFixed(maxDigits);
  }
}

function copyToClipboard(text) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function Converter() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [fromType, setFromType] = React.useState("Fiat");
  const [toType, setToType] = React.useState("Fiat");
  const [from, setFrom] = React.useState("USD");
  const [to, setTo] = React.useState("EUR");
  const [amount, setAmount] = React.useState("100");

  const currencyApiKey = React.useMemo(() => {
    const fromEnv = String(process.env.REACT_APP_CURRENCY_API_KEY || "").trim();
    // Fallback key is already used elsewhere in the project (prefer env in real deployments).
    return fromEnv || "cur_live_ho3QuAempT4lyyiQNx3VckPMznMU1SghwPj7vETr";
  }, []);

  const needsFx =
    fromType === "Fiat" || toType === "Fiat" || fromType === "Metal" || toType === "Metal";
  const needsCrypto = fromType === "Crypto" || toType === "Crypto";

  const [fxState, setFxState] = React.useState({
    loading: false,
    error: "",
    rates: null,
    lastUpdated: null,
  });
  const [cryptoState, setCryptoState] = React.useState({
    loading: false,
    error: "",
    pricesUsd: null,
    lastUpdated: null,
  });

  React.useEffect(() => {
    if (!needsFx) return undefined;

    let active = true;
    let inFlight = false;
    const controller = new AbortController();
    const currencies = Array.from(
      new Set([...FIAT.filter((c) => c !== "USD"), "XAU", "XAG"]),
    );

    async function loadFx() {
      if (inFlight) return;
      inFlight = true;
      setFxState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const rates = await fetchCurrencyApiRates({
          apiKey: currencyApiKey,
          baseCurrency: "USD",
          currencies,
          signal: controller.signal,
        });
        if (!active) return;
        const now = new Date();
        setFxState({ loading: false, error: "", rates, lastUpdated: now });
      } catch (err) {
        if (!active) return;
        const msg =
          err?.code === "MISSING_API_KEY"
            ? t("converter.loadingError", "Failed to load rates.")
            : String(err?.message || t("converter.loadingError", "Failed to load rates."));

        // Keep last known good rates if available.
        setFxState((s) => ({
          ...s,
          loading: false,
          error: msg,
          rates: s.rates,
          lastUpdated: s.lastUpdated,
        }));
      } finally {
        inFlight = false;
      }
    }

    loadFx();
    const interval = setInterval(loadFx, 5 * 60 * 1000);

    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [needsFx, currencyApiKey, t]);

  React.useEffect(() => {
    if (!needsCrypto) return undefined;

    let active = true;
    let inFlight = false;
    const controller = new AbortController();

    async function loadCrypto() {
      if (inFlight) return;
      inFlight = true;
      setCryptoState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const pricesUsd = await fetchCoinGeckoCryptoUsdPrices({
          symbols: CRYPTO,
          signal: controller.signal,
        });
        if (!active) return;
        const now = new Date();
        setCryptoState({ loading: false, error: "", pricesUsd, lastUpdated: now });
      } catch (err) {
        if (!active) return;
        const msg = String(err?.message || "Failed to load crypto prices.");
        setCryptoState((s) => ({
          ...s,
          loading: false,
          error: msg,
          pricesUsd: s.pricesUsd,
          lastUpdated: s.lastUpdated,
        }));
      } finally {
        inFlight = false;
      }
    }

    loadCrypto();
    const interval = setInterval(loadCrypto, 60 * 1000);

    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [needsCrypto]);

  const optionsForType = (type) => {
    if (type === CONVERTER_UNIT_TYPES.FIAT) return FIAT_UNITS;
    if (type === CONVERTER_UNIT_TYPES.CRYPTO) return CRYPTO_UNITS;
    return METAL_UNITS;
  };

  React.useEffect(() => {
    const opts = optionsForType(fromType);
    const codes = opts.map((o) => o.code);
    if (!codes.includes(from)) setFrom(opts[0]?.code || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromType]);

  React.useEffect(() => {
    const opts = optionsForType(toType);
    const codes = opts.map((o) => o.code);
    if (!codes.includes(to)) setTo(opts[0]?.code || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toType]);

  const handleSwap = () => {
    const prevType = fromType;
    const prevCode = from;
    setFromType(toType);
    setToType(prevType);
    setFrom(to);
    setTo(prevCode);
  };

  const fxMissing = needsFx && !fxState.rates;
  const cryptoMissing = needsCrypto && !cryptoState.pricesUsd;

  const conversion = React.useMemo(() => {
    if (!amount) return { value: null, formatted: "", error: "" };

    const numericAmount = toNumber(amount);
    if (numericAmount == null) {
      return {
        value: null,
        formatted: "",
        error: t("converter.invalidNumber", "Please enter a valid number."),
      };
    }

    if (fxMissing || cryptoMissing) return { value: null, formatted: "", error: "" };

    const fxRates = fxState.rates || {};
    const cryptoUsdPrices = cryptoState.pricesUsd || {};

    const fromUnitsPerUsd = getUnitsPerUsd({
      type: fromType,
      code: from,
      fxRates,
      cryptoUsdPrices,
    });
    const toUnitsPerUsd = getUnitsPerUsd({
      type: toType,
      code: to,
      fxRates,
      cryptoUsdPrices,
    });

    if (!fromUnitsPerUsd || !toUnitsPerUsd) {
      return {
        value: null,
        formatted: "",
        error: t(
          "converter.rateUnavailable",
          "Rate for the selected currency is unavailable.",
        ),
      };
    }

    const value = (numericAmount * toUnitsPerUsd) / fromUnitsPerUsd;
    if (!Number.isFinite(value)) {
      return {
        value: null,
        formatted: "",
        error: t(
          "converter.rateUnavailable",
          "Rate for the selected currency is unavailable.",
        ),
      };
    }

    return {
      value,
      formatted: formatConvertedValue(value, { type: toType }),
      error: "",
    };
  }, [
    amount,
    from,
    fromType,
    fxMissing,
    fxState.rates,
    cryptoMissing,
    cryptoState.pricesUsd,
    to,
    toType,
    t,
  ]);

  const sources = React.useMemo(() => {
    const out = [];
    if (needsFx) out.push("CurrencyAPI");
    if (needsCrypto) out.push("CoinGecko");
    return out;
  }, [needsFx, needsCrypto]);

  const lastUpdated = React.useMemo(() => {
    const times = [
      needsFx ? fxState.lastUpdated : null,
      needsCrypto ? cryptoState.lastUpdated : null,
    ]
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((n) => Number.isFinite(n));
    if (!times.length) return null;
    return new Date(Math.max(...times));
  }, [needsFx, needsCrypto, fxState.lastUpdated, cryptoState.lastUpdated]);

  const blockingError =
    (needsFx && fxMissing && fxState.error) ||
    (needsCrypto && cryptoMissing && cryptoState.error) ||
    "";

  const anyFetchError =
    (!!fxState.error && !!fxState.rates) ||
    (!!cryptoState.error && !!cryptoState.pricesUsd);

  const isLoading =
    (needsFx && fxState.loading && fxMissing) ||
    (needsCrypto && cryptoState.loading && cryptoMissing);

  const statusText = conversion.error
    ? conversion.error
    : blockingError
      ? blockingError
      : isLoading
        ? t("converter.updating", "Updating rates...")
        : anyFetchError
          ? t("converter.liveStale", {
              defaultValue: "Live update failed — using cached rates ({{time}}).",
              time: formatTime(lastUpdated),
            })
          : t("converter.liveNote", {
              defaultValue: "Live rates: {{sources}} • Updated {{time}}",
              sources: sources.join(" + "),
              time: formatTime(lastUpdated),
            });

  const summaryText =
    conversion.value != null && amount
      ? `${amount} ${from} = ${conversion.formatted} ${to}`
      : "—";

  const convertDisabled =
    !!conversion.error || fxMissing || cryptoMissing || isLoading || !!blockingError;

  return (
    <Box
      sx={{
        height: "100%",
        py: { xs: 5, md: 7 },
        px: { xs: 2, md: 0 },
        color: "#fff",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
      {/* Wrapper 80% بالمنتصف */}
      <Box
        sx={{
          width: { xs: "100%", md: "80%" },
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: { xs: "center", md: "left" } }}>
          <Typography
            sx={{
              fontWeight: 800,
              letterSpacing: 0.3,
              fontSize: { xs: 26, md: 34 },
              lineHeight: 1.15,
            }}
          >
            {t("converter.pageTitle", "Smart Universal Converter")}
          </Typography>
          <Typography
            sx={{
              mt: 1,
              color: "rgba(255,255,255,0.72)",
              fontSize: { xs: 13, md: 15 },
              maxWidth: 760,
              mx: { xs: "auto", md: 0 },
            }}
          >
            {t(
              "converter.pageSubtitle",
              "Convert between fiat currencies, crypto, and precious metals in one clean and simple interface.",
            )}
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background:
              "linear-gradient(145deg, rgba(18,33,67,0.88) 0%, rgba(10,20,45,0.86) 55%, rgba(6,10,22,0.92) 100%)",
            border: "1px solid rgba(130,216,255,0.18)",
            boxShadow:
              "0 22px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CardHeader
            title={
              <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                {t("converter.quickConvertTitle", "Quick Convert")}
              </Typography>
            }
            subheader={t("converter.quickConvertSubtitle", "Fiat · Crypto · Gold · Silver")}
            sx={{
              px: { xs: 2.2, md: 3 },
              pt: { xs: 2.2, md: 2.6 },
              "& .MuiCardHeader-subheader": {
                color: "rgba(255,255,255,0.65)",
              },
            }}
          />

          <CardContent sx={{ px: { xs: 2.2, md: 3 }, pb: { xs: 3, md: 3.2 } }}>
            <Grid container spacing={2.2} alignItems="stretch">
              {/* From */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={1.2}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={fromType}
                    onChange={(e, v) => v && setFromType(v)}
                    sx={{
                      backgroundColor: "rgba(3,10,25,0.65)",
                      borderRadius: 999,
                      p: 0.4,
                      border: "1px solid rgba(255,255,255,0.08)",
                      "& .MuiToggleButton-root": {
                        border: 0,
                        borderRadius: 999,
                        px: 1.6,
                        textTransform: "none",
                        color: "rgba(255,255,255,0.75)",
                        "&.Mui-selected": {
                          background:
                            "linear-gradient(135deg, rgba(35,166,232,0.28), rgba(77,196,255,0.18))",
                          color: "#fff",
                        },
                      },
                    }}
                  >
                    <ToggleButton value="Fiat">{t("converter.types.fiat", "Fiat")}</ToggleButton>
                    <ToggleButton value="Crypto">{t("converter.types.crypto", "Crypto")}</ToggleButton>
                    <ToggleButton value="Metal">{t("converter.types.metals", "Metals")}</ToggleButton>
                  </ToggleButtonGroup>

                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "rgba(255,255,255,0.75)" }}>
                      {t("converter.from", "From")}
                    </InputLabel>
                    <Select
                      value={from}
                      label={t("converter.from", "From")}
                      onChange={(e) => setFrom(e.target.value)}
                      renderValue={(selected) => {
                        const unit = getConverterUnit(fromType, selected);
                        if (!unit) return selected;
                        return (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                            <AssetIcon asset={unit} size={20} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                component="span"
                                sx={{ fontWeight: 900, fontSize: 12, mr: 0.8 }}
                              >
                                {unit.code}
                              </Typography>
                              <Typography component="span" sx={{ opacity: 0.7, fontSize: 11 }}>
                                {unit.label}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                      sx={{
                        color: "#fff",
                        backgroundColor: "rgba(2,8,20,0.35)",
                        "& .MuiSelect-select": {
                          display: "flex",
                          alignItems: "center",
                        },
                        ".MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(130,216,255,0.22)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(130,216,255,0.55)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(77,196,255,0.9)",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "rgba(255,255,255,0.7)",
                        },
                      }}
                    >
                      {optionsForType(fromType).map((unit) => (
                        <MenuItem key={unit.code} value={unit.code}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <AssetIcon asset={unit} size={20} />
                            <Typography sx={{ fontWeight: 900, fontSize: 12 }}>
                              {unit.code}
                            </Typography>
                            <Typography sx={{ opacity: 0.72, fontSize: 12 }}>
                              {unit.label}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              {/* Swap (وسط) */}
              <Grid
                size={{ xs: 12, md: 2 }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: { xs: 0.5, md: 0 },
                }}
              >
                <Button
                  onClick={handleSwap}
                  startIcon={<SwapHorizIcon />}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 2.2,
                    py: 1,
                    border: "1px solid rgba(130,216,255,0.28)",
                    color: "rgba(130,216,255,0.95)",
                    backgroundColor: "rgba(2,8,20,0.25)",
                    "&:hover": {
                      borderColor: "rgba(77,196,255,0.9)",
                      backgroundColor: "rgba(77,196,255,0.08)",
                    },
                    width: { xs: "100%", md: "auto" },
                  }}
                >
                  {t("converter.swap", "Swap")}
                </Button>
              </Grid>

              {/* To */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={1.2}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={toType}
                    onChange={(e, v) => v && setToType(v)}
                    sx={{
                      backgroundColor: "rgba(3,10,25,0.65)",
                      borderRadius: 999,
                      p: 0.4,
                      border: "1px solid rgba(255,255,255,0.08)",
                      "& .MuiToggleButton-root": {
                        border: 0,
                        borderRadius: 999,
                        px: 1.6,
                        textTransform: "none",
                        color: "rgba(255,255,255,0.75)",
                        "&.Mui-selected": {
                          background:
                            "linear-gradient(135deg, rgba(35,166,232,0.28), rgba(77,196,255,0.18))",
                          color: "#fff",
                        },
                      },
                    }}
                  >
                    <ToggleButton value="Fiat">{t("converter.types.fiat", "Fiat")}</ToggleButton>
                    <ToggleButton value="Crypto">{t("converter.types.crypto", "Crypto")}</ToggleButton>
                    <ToggleButton value="Metal">{t("converter.types.metals", "Metals")}</ToggleButton>
                  </ToggleButtonGroup>

                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "rgba(255,255,255,0.75)" }}>
                      {t("converter.to", "To")}
                    </InputLabel>
                    <Select
                      value={to}
                      label={t("converter.to", "To")}
                      onChange={(e) => setTo(e.target.value)}
                      renderValue={(selected) => {
                        const unit = getConverterUnit(toType, selected);
                        if (!unit) return selected;
                        return (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                            <AssetIcon asset={unit} size={20} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                component="span"
                                sx={{ fontWeight: 900, fontSize: 12, mr: 0.8 }}
                              >
                                {unit.code}
                              </Typography>
                              <Typography component="span" sx={{ opacity: 0.7, fontSize: 11 }}>
                                {unit.label}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                      sx={{
                        color: "#fff",
                        backgroundColor: "rgba(2,8,20,0.35)",
                        "& .MuiSelect-select": {
                          display: "flex",
                          alignItems: "center",
                        },
                        ".MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(130,216,255,0.22)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(130,216,255,0.55)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(77,196,255,0.9)",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "rgba(255,255,255,0.7)",
                        },
                      }}
                    >
                      {optionsForType(toType).map((unit) => (
                        <MenuItem key={unit.code} value={unit.code}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <AssetIcon asset={unit} size={20} />
                            <Typography sx={{ fontWeight: 900, fontSize: 12 }}>
                              {unit.code}
                            </Typography>
                            <Typography sx={{ opacity: 0.72, fontSize: 12 }}>
                              {unit.label}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              {/* Amount + Convert */}
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t("converter.amount", "Amount")}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  sx={{
                    "& .MuiInputBase-input": { color: "#fff" },
                    "& .MuiInputLabel-root": {
                      color: "rgba(255,255,255,0.75)",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(130,216,255,0.22)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(130,216,255,0.55)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(77,196,255,0.9)",
                    },
                    backgroundColor: "rgba(2,8,20,0.35)",
                    borderRadius: 2,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={convertDisabled}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    py: 1.1,
                    borderRadius: 2,
                    background:
                      "linear-gradient(135deg, #23A6E8 0%, #4DC4FF 45%, #82D8FF 100%)",
                    boxShadow:
                      "0 14px 34px rgba(0,0,0,0.55), 0 0 18px rgba(77,196,255,0.35)",
                    "&:hover": {
                      filter: "brightness(1.05)",
                    },
                  }}
                >
                  {t("converter.convert", "Convert")}
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

            {/* Result */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5, fontSize: 13 }}
                >
                  {t("converter.resultLabel", "Result")}
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: 18, md: 22 },
                    lineHeight: 1.25,
                  }}
                >
                  {amount ? summaryText : t("converter.enterAmount", "Enter an amount to convert.")}
                </Typography>

                <Typography
                  sx={{
                    color:
                      conversion.error || blockingError
                        ? "rgba(255,110,110,0.9)"
                        : "rgba(255,255,255,0.65)",
                    mt: 0.6,
                  }}
                >
                  {statusText}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => copyToClipboard(summaryText)}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    borderColor: "rgba(130,216,255,0.35)",
                    color: "rgba(130,216,255,0.95)",
                    backgroundColor: "rgba(2,8,20,0.25)",
                    "&:hover": {
                      borderColor: "rgba(77,196,255,0.9)",
                      backgroundColor: "rgba(77,196,255,0.08)",
                    },
                  }}
                >
                  {t("converter.copy", "Copy")}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
