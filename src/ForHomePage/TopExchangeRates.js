import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Flags from "./Flags";
import {
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
  HorizontalRule as HorizontalRuleIcon,
} from "@mui/icons-material";

const API_KEY = "cur_live_ho3QuAempT4lyyiQNx3VckPMznMU1SghwPj7vETr";

const QUOTES = ["EUR", "TRY", "SYP", "GBP"];

// ربط الأعلام
const FLAG_MAP = {
  EUR: "eu",
  TRY: "tr",
  SYP: "sy",
  GBP: "gb",
};

function getRate(rates, quote) {
  if (!rates) return null;
  return rates[quote]?.value || null;
}

export default function TopExchangeRates() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [rates, setRates] = useState(null);
  const [changes, setChanges] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError("");

      const url = `https://api.currencyapi.com/v3/latest?apikey=${API_KEY}&base_currency=USD&currencies=${QUOTES.join(
        ",",
      )}`;

      const res = await fetch(url);

      if (!res.ok) {
        const text = await res.text();
        console.error("HTTP error:", res.status, text);
        throw new Error(`${t("rates.httpError")} ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        console.error("API logical error:", data.error);
        throw new Error(data.error.message || t("rates.apiError"));
      }

      const newRates = data.data;

      if (rates) {
        const newChanges = {};
        QUOTES.forEach((quote) => {
          const oldRate = getRate(rates, quote);
          const newRate = getRate(newRates, quote);
          if (oldRate && newRate) {
            const pct = ((newRate - oldRate) / oldRate) * 100;
            newChanges[quote] = pct;
          }
        });
        setChanges(newChanges);
      }

      setRates(newRates);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch failed:", err);
      setError(err.message || t("rates.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = () => {
    if (!lastUpdated) return t("rates.starting");
    return `${t("rates.live")} | ${lastUpdated.toLocaleTimeString()}`;
  };

  const renderChange = (change) => {
    if (change === undefined) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", color: "#ffb74d" }}>
          <HorizontalRuleIcon fontSize="small" />
          <Typography variant="caption">{t("rates.na")}</Typography>
        </Box>
      );
    }

    if (change > 0) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", color: "#4caf50" }}>
          <ArrowDropUpIcon fontSize="small" />
          <Typography variant="caption">{change.toFixed(3)}%</Typography>
        </Box>
      );
    }

    if (change < 0) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", color: "#f44336" }}>
          <ArrowDropDownIcon fontSize="small" />
          <Typography variant="caption">{change.toFixed(3)}%</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", alignItems: "center", color: "#ffb74d" }}>
        <HorizontalRuleIcon fontSize="small" />
        <Typography variant="caption">{t("rates.stable")}</Typography>
      </Box>
    );
  };

  return (
    <Card
      sx={{
        width: "100%",
        height: "200px",
        background: "rgba(16, 26, 51, 0.55)",
        backdropFilter: "blur(1px)",
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        color: "white",
        overflow: "hidden",
        p: 1.6,

        direction: isAr ? "rtl" : "ltr",
        textAlign: isAr ? "right" : "left",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t("rates.title")}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {formatTime()}
          </Typography>

          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: "rgba(255,255,255,0.4)",
              color: "white",
              textTransform: "none",
              fontSize: "0.7rem",
              px: 1.5,
              py: 0.25,
              direction: "ltr",
            }}
            onClick={fetchRates}
            disabled={loading}
          >
            {loading ? t("rates.updating") : t("rates.update")}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1 }} />

      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      {!error &&
        QUOTES.map((quote, index) => {
          const rate = getRate(rates, quote);
          const change = changes[quote];

          return (
            <Box
              key={quote}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 1,
                px: 1,
                borderRadius: "8px",
                background:
                  index % 2 === 0
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(255,255,255,0.04)",
                mb: index === QUOTES.length - 1 ? 0 : 1,
                width: "100%",
              }}
            >
              {/* العملة + العلم */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <Flags countryCode={FLAG_MAP[quote]} size={22} />

                <Typography variant="body2" sx={{ direction: "ltr" }}>
                  1 USD → {quote}
                </Typography>
              </Box>

              {/* السعر + التغيّر */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    minWidth: 80,
                    textAlign: "right",
                    direction: "ltr",
                  }}
                >
                  {rate ? rate.toFixed(4) : t("rates.notAvailable")}
                </Typography>

                <Box sx={{ direction: "ltr" }}>{renderChange(change)}</Box>
              </Box>
            </Box>
          );
        })}
    </Card>
  );
}
