// src/ForHomePage/NewsCardTow.js
import * as React from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";

export default function NewsCardTow() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [news, setNews] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // تجهيز لل API
  const fetchNews = async () => {
    try {
      setLoading(true);

      // 🔴 API حقيقي مستقبلاً
      // const res = await fetch("YOUR_NEWS_API_URL");
      // const data = await res.json();
      // setNews(data.articles[1]);

      // 🟢 Dummy data (حالياً)
      const dummy = {
        title: "Oil slips while risk assets rebound on global growth hopes",
        source: "Global Markets",
        date: "Today • 09:20",
        summary:
          "Crude prices edged lower as investors weighed improving risk sentiment against lingering supply concerns and mixed demand signals from major economies.",
        image: "https://share.google/bCxmr0zLin269dh5Z",
      };

      setNews(dummy);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNews();
  }, []);

  // 🟡 Loading state
  if (loading) {
    return (
      <Card
        sx={{
          width: "100%",
          height: 320,
          borderRadius: 2,
          bgcolor: "rgba(10,15,35,0.9)",
        }}
      />
    );
  }

  if (error || !news) return null;

  return (
    <Card
      onClick={() => navigate("/news")}
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: 2,
        bgcolor: "rgba(10,15,35,0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.88)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "0.25s ease",
        "&:hover": {
          boxShadow: "0 14px 35px rgba(0,0,0,0.65)",
          borderColor: "rgba(78,192,255,0.4)",
        },
      }}
    >
      <CardMedia
        component="img"
        height="180"
        image={news.image}
        alt={news.title}
        sx={{ objectFit: "cover", opacity: 0.95 }}
      />

      <CardContent
        sx={{
          px: 2.2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 15.5,
            fontWeight: 600,
            mb: 0.6,
            lineHeight: 1.3,
          }}
        >
          {news.title}
        </Typography>

        <Typography sx={{ fontSize: 12.5, opacity: 0.75, mb: 1 }}>
          {news.source} • {news.date}
        </Typography>

        <Typography
          sx={{
            fontSize: 13,
            opacity: 0.9,
            mb: 1.2,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {news.summary}
        </Typography>

        <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/news");
            }}
            sx={{
              textTransform: "none",
              fontSize: 13,
              fontWeight: 500,
              color: "#39c6ff",
              "&:hover": { color: "#66d1ff" },
            }}
          >
            {t("common.seeMore", "See more")} →
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
