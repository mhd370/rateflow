import * as React from "react";
import { Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import NorthEastOutlinedIcon from "@mui/icons-material/NorthEastOutlined";
import SouthEastOutlinedIcon from "@mui/icons-material/SouthEastOutlined";
import HorizontalRuleOutlinedIcon from "@mui/icons-material/HorizontalRuleOutlined";
import { useTranslation } from "react-i18next";
import AssetIcon from "../../components/AssetIcon";

function formatTime(value) {
  if (!value) return "--";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  try {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return d.toLocaleTimeString();
  }
}

function formatMoney(value, vsCurrency) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";

  const currency = String(vsCurrency || "usd").toUpperCase();
  const maximumFractionDigits = n >= 1000 ? 0 : n >= 1 ? 2 : 6;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(n);
  } catch {
    return n.toFixed(Math.min(6, maximumFractionDigits));
  }
}

function formatPct(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function computeVisibleStats(candles) {
  const arr = Array.isArray(candles) ? candles : [];
  if (arr.length < 2) return null;

  const first = arr[0];
  const last = arr[arr.length - 1];

  const firstBase = Number(first?.open);
  const firstClose = Number(first?.close);
  const start = Number.isFinite(firstBase) ? firstBase : firstClose;
  const close = Number(last?.close);

  let high = -Infinity;
  let low = Infinity;

  for (const c of arr) {
    const h = Number(c?.high);
    const l = Number(c?.low);
    if (Number.isFinite(h) && h > high) high = h;
    if (Number.isFinite(l) && l < low) low = l;
  }

  const changePct = start > 0 && Number.isFinite(close) ? ((close - start) / start) * 100 : 0;

  return {
    close,
    high: Number.isFinite(high) ? high : null,
    low: Number.isFinite(low) ? low : null,
    changePct,
  };
}

function StatItem({ label, value, subLabel, valueSx, loading }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(0,0,0,0.16)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        px: { xs: 1.7, md: 2 },
        py: { xs: 1.4, md: 1.6 },
        minHeight: { xs: 74, md: 78 },
      }}
    >
      <Typography sx={{ fontSize: 11, opacity: 0.72, fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.65,
          fontWeight: 1000,
          fontSize: { xs: 17, md: 18 },
          letterSpacing: "-0.01em",
          ...valueSx,
        }}
      >
        {loading ? <Skeleton width={92} /> : value}
      </Typography>
      {subLabel ? (
        <Typography sx={{ mt: 0.35, fontSize: 11, opacity: 0.6 }}>
          {subLabel}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function MarketStatsBar({
  asset,
  assetLabel,
  timeframe,
  candles,
  vsCurrency = "usd",
  live = false,
  loading,
  error,
  lastUpdated,
}) {
  const { t } = useTranslation();
  const stats = React.useMemo(() => computeVisibleStats(candles), [candles]);

  const assetName = asset?.label || asset?.name || t("common.asset", "Asset");
  const assetSymbol = asset?.base?.code || (asset?.symbol ? String(asset.symbol).split("/")[0] : "");

  const change = stats?.changePct ?? null;
  const changeNum = typeof change === "number" ? change : 0;
  const isUp = changeNum > 0.05;
  const isDown = changeNum < -0.05;

  const changeMeta = isUp
    ? {
        color: "#22c55e",
        bg: "rgba(34,197,94,0.14)",
        border: "rgba(34,197,94,0.35)",
        Icon: NorthEastOutlinedIcon,
      }
    : isDown
      ? {
          color: "#ef4444",
          bg: "rgba(239,68,68,0.14)",
          border: "rgba(239,68,68,0.35)",
          Icon: SouthEastOutlinedIcon,
        }
      : {
          color: "rgba(255,255,255,0.82)",
          bg: "rgba(255,255,255,0.10)",
          border: "rgba(255,255,255,0.18)",
          Icon: HorizontalRuleOutlinedIcon,
        };

  const updatedLabel = (() => {
    if (loading && (!candles || !candles.length)) return t("common.updating", "Updating...");
    if (!lastUpdated) return t("aiInsights.stats.updatedPlaceholder", "Updated --");
    return t("aiInsights.stats.updatedAt", {
      defaultValue: "Updated {{time}}",
      time: formatTime(lastUpdated),
    });
  })();

  const showSkeleton = Boolean(loading && (!candles || !candles.length));
  const showError = Boolean(error && (!candles || !candles.length));

  const highText = stats ? formatMoney(stats.high, vsCurrency) : "--";
  const lowText = stats ? formatMoney(stats.low, vsCurrency) : "--";
  const priceText = stats ? formatMoney(stats.close, vsCurrency) : "--";
  const changeText = stats ? formatPct(stats.changePct, 2) : "--";

  const tfLabel = timeframe?.label
    ? t("aiInsights.stats.timeframeLabel", {
        defaultValue: "TF: {{tf}}",
        tf: timeframe.label,
      })
    : t("aiInsights.stats.timeframeShort", "TF");
  const ChangeIcon = changeMeta.Icon;

  return (
    <Box
      sx={{
        px: { xs: 2.2, md: 2.8 },
        py: { xs: 1.7, md: 2.0 },
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(680px 180px at 18% 0%, rgba(57,198,255,0.14) 0%, rgba(0,0,0,0) 60%), radial-gradient(520px 180px at 78% 20%, rgba(123,92,255,0.10) 0%, rgba(0,0,0,0) 60%)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "1.7fr 1fr 1fr 1fr 1fr" },
          gap: { xs: 1.2, md: 1.5 },
          alignItems: "stretch",
        }}
      >
        {/* Asset + meta */}
        <Box
          sx={{
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "rgba(0,0,0,0.16)",
            backdropFilter: "blur(12px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            px: { xs: 1.7, md: 2 },
            py: { xs: 1.4, md: 1.6 },
            minHeight: { xs: 74, md: 78 },
            gridColumn: { xs: "1 / -1", md: "auto" },
          }}
        >
          <Typography sx={{ fontSize: 11, opacity: 0.72, fontWeight: 900 }}>
            {t("aiInsights.stats.instrument", "Instrument")}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 0.75, flexWrap: "wrap" }}
          >
            <AssetIcon asset={asset} size={28} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 1000,
                  fontSize: { xs: 17, md: 18 },
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                }}
                noWrap
              >
                {assetName}
              </Typography>
              <Typography sx={{ opacity: 0.7, fontWeight: 900, fontSize: 12, lineHeight: 1.1 }} noWrap>
                {assetSymbol}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={0.8}
            alignItems="center"
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: 1.1, direction: "ltr" }}
          >
            {live ? (
              <Chip
                label={`● ${t("common.live", "Live")}`}
                size="small"
                sx={{
                  height: 22,
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(34,197,94,0.35)",
                  bgcolor: "rgba(34,197,94,0.12)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              />
            ) : null}
            <Chip
              label={assetLabel || t("aiInsights.stats.pair", "Pair")}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(58,198,255,0.30)",
                bgcolor: "rgba(58,198,255,0.12)",
              }}
            />
            <Chip
              label={tfLabel}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                fontSize: 11,
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.14)",
                bgcolor: "rgba(0,0,0,0.22)",
              }}
            />
            <Chip
              icon={<AccessTimeOutlinedIcon sx={{ fontSize: 16, opacity: 0.85 }} />}
              label={updatedLabel}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                fontSize: 11,
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.14)",
                bgcolor: "rgba(0,0,0,0.22)",
              }}
            />
            {showError ? (
              <Chip
                label={t("aiInsights.status.dataUnavailable", "Data unavailable")}
                size="small"
                sx={{
                  height: 22,
                  borderRadius: 999,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(255,120,120,0.35)",
                  bgcolor: "rgba(255,0,0,0.08)",
                }}
              />
            ) : null}
          </Stack>
        </Box>

        <StatItem
          label={t("aiInsights.stats.price", "Price")}
          value={priceText}
          loading={showSkeleton}
          subLabel={t("aiInsights.stats.lastClose", "Last close")}
        />

        <StatItem
          label={t("aiInsights.stats.change", "Change")}
          loading={showSkeleton}
          value={
            <Stack direction="row" spacing={0.6} alignItems="center">
              <ChangeIcon sx={{ fontSize: 18, color: changeMeta.color }} />
              <span>{changeText}</span>
            </Stack>
          }
          valueSx={{
            color: changeMeta.color,
          }}
          subLabel={t("aiInsights.stats.periodPerformance", "Period performance")}
        />

        <StatItem
          label={t("aiInsights.stats.high", "High")}
          value={highText}
          loading={showSkeleton}
          subLabel={t("aiInsights.stats.visibleHigh", "Visible high")}
        />
        <StatItem
          label={t("aiInsights.stats.low", "Low")}
          value={lowText}
          loading={showSkeleton}
          subLabel={t("aiInsights.stats.visibleLow", "Visible low")}
        />
      </Box>
    </Box>
  );
}
