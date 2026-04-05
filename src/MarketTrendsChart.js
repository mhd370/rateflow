import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Flags from "./ForHomePage/Flags";
import { useTranslation } from "react-i18next";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// بيانات تجريبية
const trendData = [
  { day: "Mon", EUR: 100, GBP: 100, JPY: 100, SYP: 100 },
  { day: "Tue", EUR: 101.2, GBP: 100.5, JPY: 99.3, SYP: 102.1 },
  { day: "Wed", EUR: 100.8, GBP: 101.4, JPY: 98.7, SYP: 104.5 },
  { day: "Thu", EUR: 102.3, GBP: 101.9, JPY: 97.8, SYP: 106.2 },
  { day: "Fri", EUR: 101.7, GBP: 102.6, JPY: 98.4, SYP: 107.5 },
  { day: "Sat", EUR: 102.9, GBP: 103.1, JPY: 99.1, SYP: 108.3 },
  { day: "Sun", EUR: 103.4, GBP: 103.8, JPY: 100.2, SYP: 109.6 },
];

//
const summaryCurrencies = [
  {
    code: "EUR",
    flag: "eu",
    name: "Euro",
    value: "1.086",
    change: "+0.42%",
  },
  {
    code: "GBP",
    flag: "gb",
    name: "British Pound",
    value: "1.271",
    change: "+0.18%",
  },
  {
    code: "JPY",
    flag: "jp",
    name: "Japanese Yen",
    value: "148.23",
    change: "-0.63%",
  },
  {
    code: "SYP",
    flag: "sy",
    name: "Syrian Pound",
    value: "14500",
    change: "+1.95%",
  },
];

const timeframeOptions = [
  { id: "1D", label: "1D", desc: "Last 24 hours" },
  { id: "1W", label: "1W", desc: "Last 7 days" },
  { id: "1M", label: "1M", desc: "Last 30 days" },
  { id: "1Y", label: "1Y", desc: "Last 12 months" },
];

export default function MarketTrendsChart() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [selectedCurrency, setSelectedCurrency] = React.useState("EUR");

  const [selectedTimeframe, setSelectedTimeframe] = React.useState("1W");

  const currentTimeframeObj =
    timeframeOptions.find((tf) => tf.id === selectedTimeframe) ||
    timeframeOptions[1];

  const selectedInfo = summaryCurrencies.find(
    (c) => c.code === selectedCurrency,
  );

  const lineColorMap = {
    EUR: "#4FC3F7",
    GBP: "#81C784",
    JPY: "#FFB74D",
    SYP: "#E57373",
  };
  const lineColor = lineColorMap[selectedCurrency] || "#4FC3F7";

  return (
    <Card
      sx={{
        width: "100%",
        height: "auto",
        backgroundColor: "rgba(4, 12, 30, 0.96)",
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.55)",
        overflow: "hidden",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
      <CardHeader
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ color: "#ffffff", fontWeight: 600 }}
            >
              {t("marketTrends.chartTitle", "Market Trends")}
            </Typography>
            <Chip
              label={t("marketTrends.chip", "FX • Metals • Index")}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                fontSize: 11,
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "rgba(14,28,60,0.8)",
              }}
            />
          </Box>
        }
        subheader={
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.7)",
              display: "block",
              mt: 0.5,
            }}
          >
            {t(`marketTrends.timeframes.${currentTimeframeObj.id}`, currentTimeframeObj.desc)} •{" "}
            {t("marketTrends.indexedNote", "Indexed vs USD (100 = start)")}
          </Typography>
        }
        sx={{
          pb: 1,
        }}
      />

      <CardContent sx={{ pt: 0, pb: 1 }}>
        <Stack
          direction={isSmall ? "column" : "row"}
          spacing={1.5}
          sx={{
            mb: 2,
            alignItems: isSmall ? "stretch" : "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ minWidth: 160 }}>
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                mb: 0.5,
              }}
            >
              {t("marketTrends.focusCurrency", "Focus currency")}
            </Typography>
            <Select
              size="small"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              sx={{
                width: "100%",
                height: 36,
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#202F54",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#39c6ff",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#39c6ff",
                },
                "& .MuiSvgIcon-root": { color: "white" },
              }}
            >
              {summaryCurrencies.map((c) => (
                <MenuItem
                  key={c.code}
                  value={c.code}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Flags countryCode={c.flag} size={18} />
                  <span>
                    {c.code} – {c.name}
                  </span>
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                mb: 0.5,
              }}
            >
              {t("marketTrends.timeframe", "Timeframe")}
            </Typography>
            <Stack direction="row" spacing={1}>
              {timeframeOptions.map((tf) => {
                const active = tf.id === selectedTimeframe;
                return (
                  <Button
                    key={tf.id}
                    size="small"
                    onClick={() => setSelectedTimeframe(tf.id)}
                    sx={{
                      minWidth: 0,
                      px: 1.5,
                      py: 0.3,
                      borderRadius: 999,
                      fontSize: 11,
                      textTransform: "none",
                      border: "1px solid",
                      borderColor: active
                        ? "rgba(129,212,250,0.9)"
                        : "rgba(255,255,255,0.25)",
                      backgroundColor: active
                        ? "rgba(63, 81, 181, 0.6)"
                        : "transparent",
                      color: active ? "#E3F2FD" : "rgba(255,255,255,0.8)",
                      "&:hover": {
                        backgroundColor: active
                          ? "rgba(63, 81, 181, 0.8)"
                          : "rgba(255,255,255,0.08)",
                      },
                    }}
                  >
                    {tf.label}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            width: "100%",
            height: isSmall ? 210 : 260,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="rgba(255,255,255,0.6)"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(9,16,35,0.95)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#ffffff", fontWeight: 500 }}
              />

              <Line
                type="monotone"
                dataKey={selectedCurrency}
                name={selectedCurrency}
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Divider
          sx={{
            my: 1.5,
            borderColor: "rgba(255,255,255,0.06)",
          }}
        />

        {selectedInfo && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              px: 0.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Flags countryCode={selectedInfo.flag} size={20} />
              <Box sx={{ textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.95)",
                    fontWeight: 600,
                  }}
                >
                  {selectedInfo.code}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {selectedInfo.name}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography
                sx={{
                  fontSize: 14,
                  color: "#ffffff",
                  fontWeight: 700,
                }}
              >
                {selectedInfo.value}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: selectedInfo.change.startsWith("+")
                    ? "#4CAF50"
                    : "#EF5350",
                }}
              >
                {selectedInfo.change}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
