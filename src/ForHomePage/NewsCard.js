import * as React from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export default function NewsCard() {
  const navigate = useNavigate();

  const [news, setNews] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // تجهيز لل API
  const fetchNews = async () => {
    try {
      setLoading(true);

      // هاد لل api (بعدين)
      // const res = await fetch("YOUR_NEWS_API_URL");
      // const data = await res.json();
      // setNews(data.articles[0]);

      //  (حالياً)
      const dummy = {
        title: "USD steadies as markets digest inflation outlook",
        source: "RateFlow News",
        date: "Today • 14:30",
        summary:
          "The dollar held near weekly highs as traders reassessed the pace of potential rate cuts amid sticky inflation signals.",
        image:
          "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=60",
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

  if (loading) {
    return <Card sx={{ height: 320, bgcolor: "rgba(10,15,35,0.9)" }} />;
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
      }}
    >
      <CardMedia
        component="img"
        height="180"
        image={news.image}
        alt={news.title}
      />

      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Typography sx={{ fontSize: 15.5, fontWeight: 600 }}>
          {news.title}
        </Typography>

        <Typography sx={{ fontSize: 12.5, opacity: 0.75, mb: 1 }}>
          {news.source} • {news.date}
        </Typography>

        <Typography sx={{ fontSize: 13, opacity: 0.9, mb: 1.2 }}>
          {news.summary}
        </Typography>

        <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end" }}>
          <Button sx={{ color: "#39c6ff" }}>See more →</Button>
        </Box>
      </CardContent>
    </Card>
  );
}
