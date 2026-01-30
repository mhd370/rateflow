import MenuItem from "@mui/material/MenuItem";
import Flags from "./ForHomePage/Flags";

export default function CurrencyMenuItems() {
  const currencies = [
    { code: "USD", name: "US Dollar", flag: "us" },
    { code: "EUR", name: "Euro", flag: "eu" },
    { code: "GBP", name: "British Pound", flag: "gb" },
    { code: "JPY", name: "Japanese Yen", flag: "jp" },
    { code: "CHF", name: "Swiss Franc", flag: "ch" },
    { code: "CAD", name: "Canadian Dollar", flag: "ca" },
    { code: "AUD", name: "Australian Dollar", flag: "au" },
    { code: "NZD", name: "New Zealand Dollar", flag: "nz" },
    { code: "CNY", name: "Chinese Yuan", flag: "cn" },
    { code: "SYP", name: "Syrian Pound", flag: "sy" },
  ];

  return currencies.map((curr) => (
    <MenuItem
      key={curr.code}
      value={curr.code}
      sx={{ display: "flex", alignItems: "center", gap: 1 }}
    >
      <Flags countryCode={curr.flag} size={20} />
      <span>
        {curr.code} - {curr.name}
      </span>
    </MenuItem>
  ));
}
