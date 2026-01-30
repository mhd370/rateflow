import * as React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Divider,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";

import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const FIAT = ["USD", "EUR", "GBP", "TRY", "SYP", "AED", "SAR", "EGP"];
const CRYPTO = ["USDT", "BTC", "ETH", "BUSD", "SOL"];
const METALS = ["GOLD_GRAM", "GOLD_OUNCE", "SILVER_GRAM", "SILVER_OUNCE"];

function copyToClipboard(text) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function Converter() {
  const [fromType, setFromType] = React.useState("Fiat");
  const [toType, setToType] = React.useState("Fiat");
  const [from, setFrom] = React.useState("USD");
  const [to, setTo] = React.useState("EUR");
  const [amount, setAmount] = React.useState("100");

  const rate = 0.9214;

  const result = React.useMemo(() => {
    const n = parseFloat(amount);
    if (isNaN(n)) return "";
    return (n * rate).toFixed(2);
  }, [amount, rate]);

  const optionsForType = (type) => {
    if (type === "Fiat") return FIAT;
    if (type === "Crypto") return CRYPTO;
    return METALS;
  };

  React.useEffect(() => {
    const opts = optionsForType(fromType);
    if (!opts.includes(from)) setFrom(opts[0]);
  }, [fromType]);

  React.useEffect(() => {
    const opts = optionsForType(toType);
    if (!opts.includes(to)) setTo(opts[0]);
  }, [toType]);

  const handleSwap = () => {
    const prevType = fromType;
    const prevCode = from;
    setFromType(toType);
    setToType(prevType);
    setFrom(to);
    setTo(prevCode);
  };

  const summaryText =
    result && amount ? `${amount} ${from} = ${result} ${to}` : "—";

  return (
    <Box
      sx={{
        height: "100%",
        py: { xs: 5, md: 7 },
        px: { xs: 2, md: 0 },
        color: "#fff",
      }}
    >
      {/* Wrapper 80% بالمنتصف */}
      <Box
        sx={{
          width: { xs: "100%", md: "80%" },
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: { xs: "center", md: "left" } }}>
          <Typography
            sx={{
              fontWeight: 800,
              letterSpacing: 0.3,
              fontSize: { xs: 26, md: 34 },
              lineHeight: 1.15,
            }}
          >
            Smart Universal Converter
          </Typography>
          <Typography
            sx={{
              mt: 1,
              color: "rgba(255,255,255,0.72)",
              fontSize: { xs: 13, md: 15 },
              maxWidth: 760,
              mx: { xs: "auto", md: 0 },
            }}
          >
            Convert between fiat currencies, crypto, and precious metals in one
            clean and simple interface.
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background:
              "linear-gradient(145deg, rgba(18,33,67,0.88) 0%, rgba(10,20,45,0.86) 55%, rgba(6,10,22,0.92) 100%)",
            border: "1px solid rgba(130,216,255,0.18)",
            boxShadow:
              "0 22px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CardHeader
            title={
              <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                Quick Convert
              </Typography>
            }
            subheader="Fiat · Crypto · Gold · Silver"
            sx={{
              px: { xs: 2.2, md: 3 },
              pt: { xs: 2.2, md: 2.6 },
              "& .MuiCardHeader-subheader": {
                color: "rgba(255,255,255,0.65)",
              },
            }}
          />

          <CardContent sx={{ px: { xs: 2.2, md: 3 }, pb: { xs: 3, md: 3.2 } }}>
            <Grid container spacing={2.2} alignItems="stretch">
              {/* From */}
              <Grid item xs={12} md={5}>
                <Stack spacing={1.2}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={fromType}
                    onChange={(e, v) => v && setFromType(v)}
                    sx={{
                      backgroundColor: "rgba(3,10,25,0.65)",
                      borderRadius: 999,
                      p: 0.4,
                      border: "1px solid rgba(255,255,255,0.08)",
                      "& .MuiToggleButton-root": {
                        border: 0,
                        borderRadius: 999,
                        px: 1.6,
                        textTransform: "none",
                        color: "rgba(255,255,255,0.75)",
                        "&.Mui-selected": {
                          background:
                            "linear-gradient(135deg, rgba(35,166,232,0.28), rgba(77,196,255,0.18))",
                          color: "#fff",
                        },
                      },
                    }}
                  >
                    <ToggleButton value="Fiat">Fiat</ToggleButton>
                    <ToggleButton value="Crypto">Crypto</ToggleButton>
                    <ToggleButton value="Metal">Metals</ToggleButton>
                  </ToggleButtonGroup>

                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "rgba(255,255,255,0.75)" }}>
                      From
                    </InputLabel>
                    <Select
                      value={from}
                      label="From"
                      onChange={(e) => setFrom(e.target.value)}
                      sx={{
                        color: "#fff",
                        backgroundColor: "rgba(2,8,20,0.35)",
                        ".MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(130,216,255,0.22)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(130,216,255,0.55)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(77,196,255,0.9)",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "rgba(255,255,255,0.7)",
                        },
                      }}
                    >
                      {optionsForType(fromType).map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              {/* Swap (وسط) */}
              <Grid
                item
                xs={12}
                md={2}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: { xs: 0.5, md: 0 },
                }}
              >
                <Button
                  onClick={handleSwap}
                  startIcon={<SwapHorizIcon />}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 2.2,
                    py: 1,
                    border: "1px solid rgba(130,216,255,0.28)",
                    color: "rgba(130,216,255,0.95)",
                    backgroundColor: "rgba(2,8,20,0.25)",
                    "&:hover": {
                      borderColor: "rgba(77,196,255,0.9)",
                      backgroundColor: "rgba(77,196,255,0.08)",
                    },
                    width: { xs: "100%", md: "auto" },
                  }}
                >
                  Swap
                </Button>
              </Grid>

              {/* To */}
              <Grid item xs={12} md={5}>
                <Stack spacing={1.2}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={toType}
                    onChange={(e, v) => v && setToType(v)}
                    sx={{
                      backgroundColor: "rgba(3,10,25,0.65)",
                      borderRadius: 999,
                      p: 0.4,
                      border: "1px solid rgba(255,255,255,0.08)",
                      "& .MuiToggleButton-root": {
                        border: 0,
                        borderRadius: 999,
                        px: 1.6,
                        textTransform: "none",
                        color: "rgba(255,255,255,0.75)",
                        "&.Mui-selected": {
                          background:
                            "linear-gradient(135deg, rgba(35,166,232,0.28), rgba(77,196,255,0.18))",
                          color: "#fff",
                        },
                      },
                    }}
                  >
                    <ToggleButton value="Fiat">Fiat</ToggleButton>
                    <ToggleButton value="Crypto">Crypto</ToggleButton>
                    <ToggleButton value="Metal">Metals</ToggleButton>
                  </ToggleButtonGroup>

                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "rgba(255,255,255,0.75)" }}>
                      To
                    </InputLabel>
                    <Select
                      value={to}
                      label="To"
                      onChange={(e) => setTo(e.target.value)}
                      sx={{
                        color: "#fff",
                        backgroundColor: "rgba(2,8,20,0.35)",
                        ".MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(130,216,255,0.22)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(130,216,255,0.55)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(77,196,255,0.9)",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "rgba(255,255,255,0.7)",
                        },
                      }}
                    >
                      {optionsForType(toType).map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              {/* Amount + Convert */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  sx={{
                    "& .MuiInputBase-input": { color: "#fff" },
                    "& .MuiInputLabel-root": {
                      color: "rgba(255,255,255,0.75)",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(130,216,255,0.22)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(130,216,255,0.55)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(77,196,255,0.9)",
                    },
                    backgroundColor: "rgba(2,8,20,0.35)",
                    borderRadius: 2,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    py: 1.1,
                    borderRadius: 2,
                    background:
                      "linear-gradient(135deg, #23A6E8 0%, #4DC4FF 45%, #82D8FF 100%)",
                    boxShadow:
                      "0 14px 34px rgba(0,0,0,0.55), 0 0 18px rgba(77,196,255,0.35)",
                    "&:hover": {
                      filter: "brightness(1.05)",
                    },
                  }}
                >
                  Convert
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

            {/* Result */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5, fontSize: 13 }}
                >
                  Result
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: 18, md: 22 },
                    lineHeight: 1.25,
                  }}
                >
                  {amount ? summaryText : "Enter an amount to convert."}
                </Typography>

                <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 0.6 }}>
                  Demo rate applied. Replace with live FX/crypto/metals API.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => copyToClipboard(summaryText)}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    borderColor: "rgba(130,216,255,0.35)",
                    color: "rgba(130,216,255,0.95)",
                    backgroundColor: "rgba(2,8,20,0.25)",
                    "&:hover": {
                      borderColor: "rgba(77,196,255,0.9)",
                      backgroundColor: "rgba(77,196,255,0.08)",
                    },
                  }}
                >
                  Copy
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
