import * as React from "react";
import { useTranslation } from "react-i18next";

export default function TextDir({ children, sx }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <div
      style={{
        direction: isAr ? "rtl" : "ltr",
        textAlign: isAr ? "right" : "left",
        ...(sx || {}),
      }}
    >
      {children}
    </div>
  );
}
