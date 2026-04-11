import * as React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { KeyboardDoubleArrowDown as KeyboardDoubleArrowDownIcon } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Flags from "./Flags";

const API_URL = "https://api.currencyapi.com/v3/latest?base_currency=USD";
const API_KEY = String(process.env.REACT_APP_CURRENCY_API_KEY || "").trim();

export default function ConverterCont() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [fromCurrency, setFromCurrency] = React.useState("");
  const [toCurrency, setToCurrency] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [rates, setRates] = React.useState(null);
  const [loadingRates, setLoadingRates] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

  const currencies = [
    { code: "USD", name: "US Dollar", flag: "us" },
    { code: "EUR", name: "Euro", flag: "eu" },
    { code: "GBP", name: "British Pound", flag: "gb" },
    { code: "JPY", name: "Japanese Yen", flag: "jp" },
    { code: "CHF", name: "Swiss Franc", flag: "ch" },
    { code: "CAD", name: "Canadian Dollar", flag: "ca" },
    { code: "AUD", name: "Australian Dollar", flag: "au" },
    { code: "NZD", name: "New Zealand Dollar", flag: "nz" },
    { code: "CNY", name: "Chinese Yuan", flag: "cn" },
    { code: "SYP", name: "Syrian Pound", flag: "sy" },
  ];

  React.useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoadingRates(true);
        setError("");
        const res = await fetch(API_URL, {
          headers: { apikey: API_KEY },
        });
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setRates(data.data);
      } catch {
        setError(t("converter.loadingError"));
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [t]);

  const handleConvert = () => {
    if (!fromCurrency || !toCurrency || !amount) {
      setError(t("converter.selectCurrencies"));
      return;
    }
    if (!rates) {
      setError(t("converter.ratesNotReady"));
      return;
    }

    const fromRate = fromCurrency === "USD" ? 1 : rates[fromCurrency]?.value;
    const toRate = toCurrency === "USD" ? 1 : rates[toCurrency]?.value;

    if (!fromRate || !toRate) {
      setError(t("converter.rateUnavailable"));
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      setError(t("converter.invalidNumber"));
      return;
    }

    setError("");
    setResult((numericAmount * toRate) / fromRate);
  };

  const renderSelected = (selectedCode, placeholder) => {
    if (!selectedCode) return <em>{t(placeholder)}</em>;
    const curr = currencies.find((c) => c.code === selectedCode);
    if (!curr) return selectedCode;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Flags countryCode={curr.flag} size={20} />
        <span>{curr.code}</span>
      </div>
    );
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 480, mx: "auto" }}>
      <Card
        sx={{
          background: "rgba(16, 26, 51, 0.55)",
          backdropFilter: "blur(12px)",
          border: "1.5px solid #202F54",
          borderRadius: "15px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            height: 50,
            backgroundColor: "#202F54",
            color: "white",
            display: "flex",
            alignItems: "center",
            pl: 1.5,
            fontWeight: 600,
            direction: isAr ? "rtl" : "ltr",
          }}
        >
          {t("converter.title")}
        </Box>

        {/* Body */}
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <Select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            displayEmpty
            renderValue={(selected) =>
              renderSelected(selected, "converter.from")
            }
            sx={{ color: "white", direction: "ltr" }}
          >
            <MenuItem value="">
              <em>{t("converter.from")}</em>
            </MenuItem>
            {currencies.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.code} - {c.name}
              </MenuItem>
            ))}
          </Select>

          <TextField
            label={t("converter.amount")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ direction: "ltr" }}
          />

          <Box sx={{ textAlign: "center" }}>
            <KeyboardDoubleArrowDownIcon sx={{ color: "white" }} />
          </Box>

          <Select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            displayEmpty
            renderValue={(selected) => renderSelected(selected, "converter.to")}
            sx={{ color: "white", direction: "ltr" }}
          >
            <MenuItem value="">
              <em>{t("converter.to")}</em>
            </MenuItem>
            {currencies.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.code} - {c.name}
              </MenuItem>
            ))}
          </Select>

          <Button onClick={handleConvert} disabled={loadingRates}>
            {t("converter.convert")}
          </Button>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            minHeight: 48,
            backgroundColor: "#202F54",
            color: "white",
            display: "flex",
            alignItems: "center",
            pl: 1.5,
            fontSize: 13,
            direction: isAr ? "rtl" : "ltr",
          }}
        >
          {loadingRates && t("converter.updating")}
          {!loadingRates && error}
          {!loadingRates && !error && result !== null && (
            <span>
              {amount} {fromCurrency} = {result.toFixed(2)} {toCurrency}
            </span>
          )}
          {!loadingRates &&
            !error &&
            result === null &&
            !amount &&
            t("converter.ready")}
        </Box>
      </Card>
    </Box>
  );
}
