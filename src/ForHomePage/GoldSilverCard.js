import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Box, Typography, Stack, Chip } from "@mui/material";

export default function GoldSilverCard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  // تجهيز مشان ال API ارقام تجريبية فقط
  const goldPrice = "2,345.80";
  const silverPrice = "28.15";

  return (
    <Card
      onClick={() => navigate("/gold")}
      sx={{
        width: "100%",
        mx: "auto",
        mt: 4,
        borderRadius: 3,
        background:
          "linear-gradient(145deg, rgba(16,26,51,0.95), rgba(36,53,98,0.92))",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
        color: "white",
        cursor: "pointer",
        overflow: "hidden",
        height: "330px",
        marginBottom: "20px",
        transition:
          "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 26px 60px rgba(0,0,0,0.8)",
          borderColor: "rgba(58,198,255,0.6)",
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          background:
            "linear-gradient(90deg, #ffc857 0%, #ffb74d 40%, #ffd54f 100%)",
        }}
      />

      <Box
        sx={{
          p: 2.4,
          direction: isAr ? "rtl" : "ltr",
          textAlign: isAr ? "right" : "left",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
            {t("metals.title")}
          </Typography>

          <Chip
            label={t("metals.chip")}
            size="small"
            sx={{
              direction: "ltr",
              fontSize: 11,
              height: 22,
              borderRadius: "999px",
              bgcolor: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.9)",
            }}
          />
        </Stack>

        <Typography sx={{ fontSize: 13, opacity: 0.75, mb: 2.2 }}>
          {t("metals.desc")}
        </Typography>

        <Stack direction="row" spacing={2.5}>
          {/* الذهب */}
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255,215,64,0.06)",
              border: "1px solid rgba(255,215,64,0.35)",
            }}
          >
            {/* ✅ عنوان Gold يترجم */}
            <Typography
              sx={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                opacity: 0.8,
                mb: 0.5,
              }}
            >
              {t("metals.goldLabel")}
            </Typography>

            {/* ✅ السعر LTR */}
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                mb: 0.5,
                color: "#ffeb3b",
                direction: "ltr",
              }}
            >
              ${goldPrice}
            </Typography>

            <Typography sx={{ fontSize: 11, opacity: 0.7 }}>
              {t("metals.perOunce")}
            </Typography>
          </Box>

          {/* الفضة */}
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(179,229,252,0.06)",
              border: "1px solid rgba(179,229,252,0.4)",
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                opacity: 0.8,
                mb: 0.5,
              }}
            >
              {t("metals.silverLabel")}
            </Typography>

            {/* ✅ السعر LTR */}
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                mb: 0.5,
                color: "#b3e5fc",
                direction: "ltr",
              }}
            >
              ${silverPrice}
            </Typography>

            <Typography sx={{ fontSize: 11, opacity: 0.7 }}>
              {t("metals.perOunce")}
            </Typography>
          </Box>
        </Stack>

        <Typography
          sx={{
            fontSize: 11,
            opacity: 0.7,
            mt: 2,

            textAlign: isAr ? "left" : "right",
          }}
        >
          {t("metals.cta")} →
        </Typography>
      </Box>
    </Card>
  );
}
