import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import MarketTrendsChart from "../MarketTrendsChart";
import { useTranslation } from "react-i18next";
export default function MarketTrend() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <div
      style={{
        width: "80%",
        margin: "auto",
        color: "white",
        direction: isAr ? "rtl" : "ltr",
        textAlign: isAr ? "right" : "left",
      }}
    >
      <h1 style={{ marginBottom: "0px", paddingBottom: "0px" }}>
        <ShowChartOutlinedIcon />
        {"  "}
        {t("marketTrends.title", "Live Market Trends")}
      </h1>
      <p style={{ marginTop: "0px", paddingTop: "0px" }}>
        {t(
          "marketTrends.subtitle",
          "Track real-time movements across currencies, crypto, and commodities to stay ahead of market changes and make smarter decisions.",
        )}
      </p>
      <MarketTrendsChart />
    </div>
  );
}
