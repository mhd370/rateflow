import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import MarketTrends from "../MarketTrendsChart";
export default function MarketTrend() {
  return (
    <div
      style={{
        width: "80%",
        margin: "auto",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: "0px", paddingBottom: "0px" }}>
        <ShowChartOutlinedIcon />
        {"  "} Live Market Trends
      </h1>
      <p style={{ marginTop: "0px", paddingTop: "0px" }}>
        Track real-time movements across currencies, crypto, and commodities to
        stay ahead of market changes and make smarter decisions.
      </p>
      <MarketTrends />
    </div>
  );
}
