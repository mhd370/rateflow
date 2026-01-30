import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { NavLink } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
import { useTranslation } from "react-i18next";

// أيقونات MUI
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CurrencyBitcoinOutlinedIcon from "@mui/icons-material/CurrencyBitcoinOutlined";
import MenuIcon from "@mui/icons-material/Menu";
// lucide
import { Package2 } from "lucide-react";

const theme = createTheme({
  typography: { fontSize: 16 },
  palette: {
    primary: { main: "#132145" },
  },
});

const navItems = [
  { to: "/", label: "nav.home", Icon: HomeOutlinedIcon },
  { to: "/converter", label: "nav.converter", Icon: SyncAltOutlinedIcon },
  { to: "/market-trends", label: "nav.market", Icon: ShowChartOutlinedIcon },
  { to: "/news", label: "nav.news", Icon: ArticleOutlinedIcon },
  { to: "/crypto", label: "nav.crypto", Icon: CurrencyBitcoinOutlinedIcon },
  { to: "/gold", label: "nav.gold", Icon: Package2 },
];

function NavButton({ to, label, Icon }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <NavLink to={to} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <Button
          sx={{
            direction: isAr ? "rtl" : "ltr",
            textAlign: isAr ? "right" : "left",

            position: "relative",
            mx: { xs: 0.5, md: 1.5 },
            px: { xs: 1, md: 1.5 },
            py: 0.5,
            textTransform: "none",
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? "#39c6ff" : "rgba(255,255,255,0.86)",
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            borderRadius: 999,
            whiteSpace: "nowrap",
            transition:
              "color 0.18s ease, background-color 0.18s ease, transform 0.18s ease",
            "&:hover": {
              color: "#66d1ff",
              backgroundColor: "rgba(255,255,255,0.06)",
              transform: "translateY(-1px)",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              left: "50%",
              bottom: -2,
              transform: "translateX(-50%)",
              width: isActive ? "60%" : "0%",
              height: 2,
              borderRadius: 999,
              backgroundColor: "#39c6ff",
              transition: "width 0.22s ease-out",
            },
          }}
        >
          {Icon.muiName ? (
            <Icon
              sx={{
                fontSize: 20,
                color: isActive ? "#39c6ff" : "rgba(255,255,255,0.75)",
                transition: "color 0.18s ease",
              }}
            />
          ) : (
            <Icon
              size={18}
              color={isActive ? "#39c6ff" : "rgba(255,255,255,0.75)"}
            />
          )}
          <span>{t(label)}</span>
        </Button>
      )}
    </NavLink>
  );
}

function Logo() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <svg
        width="118"
        height="28"
        viewBox="0 0 118 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0"
          y="21"
          fill="white"
          fontFamily="Inter, sans-serif"
          fontSize="20"
          fontWeight="600"
          letterSpacing="0.5px"
        >
          Rate
        </text>
        <text
          x="52"
          y="21"
          fill="#4CAF50"
          fontFamily="Inter, sans-serif"
          fontSize="20"
          fontWeight="600"
          letterSpacing="0.5px"
        >
          Flow
        </text>
      </svg>

      <Typography
        component="span"
        sx={{
          ml: 1,
          fontSize: 13,
          color: "rgba(255,255,255,0.75)",
          display: { xs: "none", sm: "inline" },

          direction: isAr ? "rtl" : "ltr",
          textAlign: isAr ? "right" : "left",
        }}
      >
        {t("header.subtitle")}
      </Typography>
    </Box>
  );
}

export default function Head() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  // محتوى الـ Drawer للموبايل
  const drawer = (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(180deg, #141f3a 0%, #10192f 45%, #090f1f 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}
      role="presentation"
      onClick={handleDrawerToggle}
    >
      {/* Logo أعلى الـ Drawer */}
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 2 }}>
        <Logo />
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <List sx={{ mt: 1, flexGrow: 1 }}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {({ isActive }) => (
              <ListItem disablePadding>
                <ListItemButton
                  sx={{
                    px: 2.5,
                    py: 1.2,
                    gap: 1.5,
                    borderLeft: isActive
                      ? "3px solid #39c6ff"
                      : "3px solid transparent",
                    backgroundColor: isActive
                      ? "rgba(57,198,255,0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  {Icon.muiName ? (
                    <Icon
                      sx={{
                        fontSize: 20,
                        color: isActive ? "#39c6ff" : "rgba(255,255,255,0.8)",
                      }}
                    />
                  ) : (
                    <Icon
                      size={18}
                      color={isActive ? "#39c6ff" : "rgba(255,255,255,0.8)"}
                    />
                  )}

                  <ListItemText
                    primary={t(label)}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,

                      direction: isAr ? "rtl" : "ltr",
                      textAlign: isAr ? "right" : "left",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </NavLink>
        ))}
      </List>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontSize: 14,
            borderColor: "rgba(255,255,255,0.4)",
            color: "white",

            direction: isAr ? "rtl" : "ltr",
          }}
        >
          {t("auth.login")}
        </Button>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <AppBar
        position="sticky"
        sx={{
          background:
            "linear-gradient(180deg, #132145 0%, #1A294E 45%, #243562 100%)",
          color: "white",
        }}
        elevation={10}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, md: 96 },
            px: { xs: 1.5, sm: 3, md: 5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Logo */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="home"
            component={NavLink}
            to="/"
            sx={{
              p: 0,
              mr: { xs: 1, md: 2 },
              "&:hover": { backgroundColor: "transparent" },
            }}
          >
            <Logo />
          </IconButton>

          {/* Navigation للديسكتوب فقط */}
          <Box
            sx={{
              flexGrow: 1,
              maxWidth: "100%",
              display: { xs: "none", md: "block" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: { md: 1 },
                minWidth: "max-content",
              }}
            >
              {navItems.map((item) => (
                <NavButton
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  Icon={item.Icon}
                />
              ))}
            </Box>
          </Box>

          {/* Toggle language */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LanguageToggle />
          </Box>

          {/* Login + Menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              color="inherit"
              sx={{
                display: { xs: "none", md: "inline-flex" },
                textTransform: "none",
                fontSize: 14,
                px: { md: 2 },
                py: 0.5,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.25)",
                backgroundColor: "rgba(0,0,0,0.16)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },

                direction: isAr ? "rtl" : "ltr",
              }}
            >
              {t("auth.login")}
            </Button>

            <IconButton
              color="inherit"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ display: { xs: "inline-flex", md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer للموبايل */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        {drawer}
      </Drawer>
    </ThemeProvider>
  );
}
