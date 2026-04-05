import * as React from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";

import {
  getCryptoBrandColor,
  getFiatFlag,
  getMetalShort,
} from "../assets/assetCatalog";

const CRYPTO_GLYPH = {
  BTC: "₿",
  ETH: "Ξ",
  SOL: "S",
  BNB: "B",
  XRP: "X",
  ADA: "A",
  DOGE: "D",
  AVAX: "AV",
  MATIC: "M",
  DOT: "●",
  USDT: "T",
  BUSD: "B",
};

function FallbackBadge({ text, size, sx }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 1000,
        fontSize: Math.max(10, Math.round(size * 0.42)),
        color: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(255,255,255,0.16)",
        backgroundColor: "rgba(0,0,0,0.22)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        ...sx,
      }}
    >
      {String(text || "?").slice(0, 2)}
    </Box>
  );
}

function FlagCircle({ flagCode, fallbackText, size }) {
  const [broken, setBroken] = React.useState(false);
  const src = flagCode ? `https://flagcdn.com/${String(flagCode).toLowerCase()}.svg` : "";

  if (!flagCode || broken) {
    return <FallbackBadge text={fallbackText} size={size} />;
  }

  return (
    <Box
      component="img"
      src={src}
      alt={flagCode}
      onError={() => setBroken(true)}
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
        border: "1px solid rgba(255,255,255,0.16)",
        backgroundColor: "rgba(0,0,0,0.16)",
      }}
    />
  );
}

function ForexPairIcon({ baseCode, quoteCode, size }) {
  const baseFlag = getFiatFlag(baseCode);
  const quoteFlag = getFiatFlag(quoteCode);
  const small = Math.max(12, Math.round(size * 0.74));

  return (
    <Box
      sx={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ position: "absolute", left: 0, top: 0 }}>
        <FlagCircle
          flagCode={baseFlag}
          fallbackText={String(baseCode || "?").slice(0, 1)}
          size={small}
        />
      </Box>
      <Box sx={{ position: "absolute", right: 0, bottom: 0 }}>
        <FlagCircle
          flagCode={quoteFlag}
          fallbackText={String(quoteCode || "?").slice(0, 1)}
          size={small}
        />
      </Box>
    </Box>
  );
}

function CryptoIcon({ code, size }) {
  const symbol = String(code || "").trim().toUpperCase();
  const glyph = CRYPTO_GLYPH[symbol] || symbol.slice(0, 1) || "?";
  const brand = getCryptoBrandColor(symbol) || "rgba(58,198,255,0.85)";

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontWeight: 1000,
        fontSize: Math.max(10, Math.round(size * 0.48)),
        color: "#0b1020",
        border: "1px solid rgba(255,255,255,0.18)",
        background: `linear-gradient(135deg, ${brand} 0%, rgba(255,255,255,0.14) 100%)`,
        boxShadow: "0 10px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      {glyph}
    </Avatar>
  );
}

function MetalIcon({ metalCode, size }) {
  const c = String(metalCode || "").trim().toUpperCase();
  const short = getMetalShort(c) || c.slice(0, 2) || "?";

  const gradient =
    c === "XAU"
      ? "linear-gradient(135deg, rgba(251,191,36,0.95) 0%, rgba(255,255,255,0.18) 100%)"
      : "linear-gradient(135deg, rgba(203,213,225,0.95) 0%, rgba(255,255,255,0.14) 100%)";

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontWeight: 1000,
        fontSize: Math.max(10, Math.round(size * 0.42)),
        color: "#0b1020",
        border: "1px solid rgba(255,255,255,0.18)",
        background: gradient,
        boxShadow: "0 10px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      {short}
    </Avatar>
  );
}

export default function AssetIcon({ asset, size = 22 }) {
  const icon = asset?.icon || null;
  const type = icon?.type || "";

  if (type === "forex") {
    return <ForexPairIcon baseCode={icon.base} quoteCode={icon.quote} size={size} />;
  }

  if (type === "fiat") {
    const code = String(icon.code || asset?.code || "").trim().toUpperCase();
    const flag = getFiatFlag(code);
    return (
      <FlagCircle
        flagCode={flag}
        fallbackText={code ? code.slice(0, 1) : "?"}
        size={size}
      />
    );
  }

  if (type === "crypto") {
    const code = String(icon.code || asset?.code || asset?.symbol || "").trim().toUpperCase();
    return <CryptoIcon code={code} size={size} />;
  }

  if (type === "metal") {
    return <MetalIcon metalCode={icon.code} size={size} />;
  }

  if (type === "metalUnit") {
    return <MetalIcon metalCode={icon.metal} size={size} />;
  }

  const fallback = String(asset?.code || asset?.symbol || asset?.id || "?")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  return <FallbackBadge text={fallback || "?"} size={size} />;
}
