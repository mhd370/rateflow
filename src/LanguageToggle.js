// src/LanguageToggle.js
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLang = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);

    // ✅ لا تقلب الصفحة كلها
    // document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <Button
      onClick={toggleLang}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 12,
        borderRadius: 999,
        px: 1.8,
        color: "white",
        border: "1px solid rgba(255,255,255,0.25)",
        textTransform: "none",
        "&:hover": {
          borderColor: "#39c6ff",
          color: "#39c6ff",
        },
      }}
    >
      {i18n.language === "en" ? "AR" : "EN"}
    </Button>
  );
}
