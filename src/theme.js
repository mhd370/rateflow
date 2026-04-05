import { createTheme, alpha } from "@mui/material/styles";

import backgroundImage from "./img/freepik__expand__80486.png";

const baseBg = "#132145";
const surfaceBg = "rgba(16, 26, 51, 0.78)";

const textPrimary = "rgba(255,255,255,0.92)";
const textSecondary = "rgba(255,255,255,0.72)";

const primaryMain = "#39c6ff";
const secondaryMain = "#7b5cff";

const divider = "rgba(255,255,255,0.10)";

export function createAppTheme(direction = "ltr") {
  return createTheme({
  direction,
  typography: {
    fontSize: 16,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  palette: {
    mode: "dark",
    primary: { main: primaryMain },
    secondary: { main: secondaryMain },
    background: {
      default: baseBg,
      paper: surfaceBg,
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
    },
    divider,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          colorScheme: "dark",
        },
        body: {
          margin: 0,
          padding: 0,
          fontSize: 16,
          minHeight: "100vh",
          color: textPrimary,
          backgroundColor: baseBg,
          backgroundImage: `url(${backgroundImage})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        },
        "@media (max-width: 768px)": {
          body: {
            backgroundImage: "none",
            background:
              "radial-gradient(circle at top, #1f2e4b 0%, #132145 50%, #0a1326 100%)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: divider,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundColor: "rgba(2,8,20,0.35)",
          color: t.palette.text.primary,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#fff", 0.16),
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#fff", 0.28),
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(primaryMain, 0.75),
          },
          "&.Mui-disabled": {
            opacity: 0.7,
          },
        }),
        input: ({ theme: t }) => ({
          color: t.palette.text.primary,
          "&::placeholder": {
            color: alpha("#fff", 0.55),
            opacity: 1,
          },
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: textSecondary,
          "&.Mui-focused": {
            color: alpha(primaryMain, 0.9),
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: alpha("#fff", 0.75),
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          backgroundColor: "rgba(10,16,32,0.96)",
          backdropFilter: "blur(16px)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(57,198,255,0.12)",
          },
          "&.Mui-selected:hover": {
            backgroundColor: "rgba(57,198,255,0.16)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        outlined: {
          borderColor: alpha("#fff", 0.22),
          color: textPrimary,
          "&:hover": {
            borderColor: alpha(primaryMain, 0.55),
            backgroundColor: alpha("#fff", 0.06),
          },
        },
        text: {
          color: textPrimary,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#fff", 0.06),
          color: textPrimary,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: alpha(primaryMain, 0.95),
        },
      },
    },
  },
  });
}

const theme = createAppTheme("ltr");

export default theme;
