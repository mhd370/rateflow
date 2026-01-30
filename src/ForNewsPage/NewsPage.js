// src/NewsPage.js
import * as React from "react";
import {
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Stack,
  Button,
} from "@mui/material";
//تجهيز مشان ال API
const NEWS_ITEMS = [
  {
    id: 1,
    title: "Dollar edges higher as traders reassess rate-cut expectations",
    source: "Reuters",
    time: "2 hours ago",
    category: "Forex",
    summary:
      "The US dollar recovered from early losses as markets priced in fewer rate cuts and yields moved higher across the curve.",
    image:
      "https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 2,
    title: "Bitcoin holds near key resistance as ETF inflows stay positive",
    source: "CoinDesk",
    time: "1 hour ago",
    category: "Crypto",
    summary:
      "Bitcoin traded in a tight range, consolidating near a key resistance level while spot ETF products continued to see net inflows.",
    image:
      "https://images.pexels.com/photos/6770779/pexels-photo-6770779.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 3,
    title: "Euro softens after weak PMI data across the Eurozone",
    source: "Bloomberg",
    time: "30 minutes ago",
    category: "Forex",
    summary:
      "The euro slipped against major peers after weaker-than-expected PMI readings raised concerns about the growth outlook.",
    image:
      "https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 4,
    title: "Gold retreats as risk appetite improves in global equity markets",
    source: "MarketWatch",
    time: "3 hours ago",
    category: "Macro",
    summary:
      "Safe-haven flows into gold eased as global equity indices rallied, supported by stronger tech and financial shares.",
    image:
      "https://images.pexels.com/photos/2309951/pexels-photo-2309951.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 5,
    title: "Emerging-market currencies face pressure amid stronger dollar",
    source: "FXStreet",
    time: "4 hours ago",
    category: "Forex",
    summary:
      "Several emerging-market currencies weakened as the dollar index climbed, driven by higher US yields and risk-off sentiment.",
    image:
      "https://images.pexels.com/photos/6770615/pexels-photo-6770615.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    id: 6,
    title: "Layer-2 tokens outperform as on-chain activity accelerates",
    source: "The Block",
    time: "50 minutes ago",
    category: "Crypto",
    summary:
      "Layer-2 projects saw strong gains as users and protocols shifted activity away from congested main chains.",
    image:
      "https://images.pexels.com/photos/5980861/pexels-photo-5980861.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

const CATEGORIES = ["All", "Forex", "Crypto", "Macro"];

function NewsCard({ item }) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        overflow: "hidden",
        background:
          "linear-gradient(145deg, rgba(10,15,30,0.96), rgba(24,37,70,0.9))",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition:
          "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 24px 55px rgba(0,0,0,0.75)",
          borderColor: "rgba(58,198,255,0.6)",
        },
        color: "white",
      }}
    >
      <CardMedia
        component="img"
        height="150"
        image={item.image}
        alt={item.title}
        sx={{
          objectFit: "cover",
          opacity: 0.95,
        }}
      />

      <CardContent
        sx={{
          p: 2.4,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <Chip
            label={item.category}
            size="small"
            sx={{
              fontSize: 11,
              height: 22,
              borderRadius: "999px",
              bgcolor:
                item.category === "Crypto"
                  ? "rgba(123, 92, 255, 0.16)"
                  : item.category === "Forex"
                    ? "rgba(58,198,255,0.16)"
                    : "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.9)",
            }}
          />
          <Typography sx={{ fontSize: 11, opacity: 0.7 }}>
            {item.source} • {item.time}
          </Typography>
        </Stack>

        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            mb: 1,
            lineHeight: 1.3,
          }}
        >
          {item.title}
        </Typography>

        <Typography
          sx={{
            fontSize: 13,
            opacity: 0.82,
            mb: 2,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
          }}
        >
          {item.summary}
        </Typography>

        <Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="small"
            sx={{
              textTransform: "none",
              fontSize: 13,
              fontWeight: 500,
              color: "#39c6ff",
              paddingX: 0,
              "&:hover": {
                color: "#66d0ff",
                background: "transparent",
              },
            }}
          >
            Read full story →
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = React.useState("All");

  const filteredNews =
    activeCategory === "All"
      ? NEWS_ITEMS
      : NEWS_ITEMS.filter((n) => n.category === activeCategory);

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "80vh",
        paddingTop: "120px",
        pb: 6,
        color: "white",
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2.5, md: 6 },
        }}
      >
        {/* العنوان الرئيسي */}
        <Box
          sx={{
            maxWidth: 780,
            mb: 4,
            mx: "auto",
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 30, fontWeight: 700, mb: 1 }}>
            News & Market Insights
          </Typography>
          <Typography sx={{ fontSize: 14, opacity: 0.78 }}>
            Curated updates across forex, crypto, and macroeconomics to help you
            move money smarter.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 3, flexWrap: "wrap", rowGap: 1, marginLeft: "400px" }}
        >
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setActiveCategory(cat)}
              sx={{
                cursor: "pointer",
                borderRadius: "999px",
                fontSize: 13,
                fontWeight: 500,
                px: 1.5,
                height: 30,
                bgcolor:
                  activeCategory === cat ? "#39c6ff" : "rgba(255,255,255,0.06)",
                color:
                  activeCategory === cat ? "#0b162f" : "rgba(255,255,255,0.9)",
                boxShadow:
                  activeCategory === cat
                    ? "0 0 16px rgba(58,198,255,0.6)"
                    : "none",
                "&:hover": { opacity: 0.95 },
              }}
            />
          ))}
        </Stack>

        <Grid container spacing={3} justifyContent="center">
          {filteredNews.map((item) => (
            <Grid item key={item.id} xs={12} sm={6} md={6}>
              <NewsCard item={item} />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              borderRadius: "999px",
              px: 3,
              py: 1,
              border: "1px solid rgba(255,255,255,0.3)",
              color: "rgba(255,255,255,0.9)",
              background: "rgba(5,10,25,0.7)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              "&:hover": {
                borderColor: "#39c6ff",
                color: "#39c6ff",
                background: "rgba(10,20,40,0.9)",
              },
            }}
          >
            Load more news
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
