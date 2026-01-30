import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import { TrendingUp, Coins, ChevronRight } from "lucide-react";

export default function CryptoHomeCard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <Card
      onClick={() => navigate("/crypto")}
      sx={{
        width: "100%",
        height: { xs: "auto", md: 360 },
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at top, rgba(57,198,255,0.14), rgba(10,15,35,0.92) 55%, rgba(6,10,25,0.96))",
        boxShadow: "0 14px 36px rgba(0,0,0,0.55)",
        color: "white",
        cursor: "pointer",
        overflow: "hidden",
        transition: "0.25s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 20px 48px rgba(0,0,0,0.65)",
          borderColor: "rgba(57,198,255,0.35)",
        },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2.2,
          py: 1.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgba(32,47,84,0.55)",
          backdropFilter: "blur(10px)",

          direction: isAr ? "rtl" : "ltr",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Coins size={18} />
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
            {t("crypto.title")}
          </Typography>
        </Box>

        <Chip
          label={t("crypto.live")}
          size="small"
          sx={{
            height: 22,
            borderRadius: 999,
            fontSize: 11,
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.18)",
            backgroundColor: "rgba(14,28,60,0.7)",
          }}
        />
      </Box>

      <Box
        sx={{
          p: 2.2,
          display: "flex",
          flexDirection: "column",
          gap: 1.4,
          flexGrow: 1,

          direction: isAr ? "rtl" : "ltr",
          textAlign: isAr ? "right" : "left",
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          {t("crypto.description")}
        </Typography>

        {/* Highlights */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1.2,
            mt: 0.5,
          }}
        >
          <Box
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              {t("crypto.topCoins")}
            </Typography>

            <Typography
              sx={{ fontSize: 20, fontWeight: 800, direction: "ltr" }}
            >
              BTC / ETH
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              {t("crypto.marketTrend")}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <TrendingUp size={18} />
              <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
                {t("crypto.signals")}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 0.6 }} />

        {/* Features list */}
        <Box sx={{ display: "grid", gap: 0.8 }}>
          {[
            t("crypto.features.prices"),
            t("crypto.features.movers"),
            t("crypto.features.converter"),
            t("crypto.features.favorites"),
          ].map((text) => (
            <Typography
              key={text}
              sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)" }}
            >
              • {text}
            </Typography>
          ))}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/crypto");
            }}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: "#39c6ff",
              borderRadius: 999,
              px: 1.5,
              "&:hover": { color: "#66d1ff" },
            }}
            endIcon={<ChevronRight size={16} />}
          >
            {t("crypto.open")}
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
