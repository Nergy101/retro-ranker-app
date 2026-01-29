import { extendTheme } from "native-base";
import { colors } from "./colors";

/**
 * NativeBase theme configuration for Retro Ranker
 * Dark theme with primary orange accents
 */
export const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false, // Force dark mode only
  },
  // Global size overrides to prevent "large" string errors
  sizes: {
    container: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  colors: {
    primary: {
      50: "#fff5f2",
      100: "#ffe5d9",
      200: "#ffcbb3",
      300: "#ffb08d",
      400: "#ff9567",
      500: colors.primary, // #c6752f
      600: colors.primaryHover, // #b0682a
      700: "#cc4a22",
      800: "#993819",
      900: "#662611",
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "primary",
        size: "md",
      },
      sizes: {
        sm: {
          px: 3,
          py: 1.5,
          _text: {
            fontSize: "sm",
          },
        },
        md: {
          px: 4,
          py: 2,
          _text: {
            fontSize: "md",
          },
        },
        lg: {
          px: 5,
          py: 2.5,
          _text: {
            fontSize: "lg",
          },
        },
      },
      variants: {
        solid: {
          bg: colors.primary,
          _text: {
            color: colors.primaryContrast,
          },
          _pressed: {
            bg: colors.primaryHover,
          },
        },
        outline: {
          borderColor: colors.primary,
          _text: {
            color: colors.primary,
          },
          _pressed: {
            bg: colors.primaryFocus,
          },
        },
      },
    },
    Input: {
      defaultProps: {
        colorScheme: "primary",
        size: "md",
        _focus: {
          borderColor: colors.primary,
          bg: colors.backgroundCard,
        },
      },
      sizes: {
        md: {
          px: 3,
          py: 2,
          fontSize: "md",
        },
      },
      baseStyle: {
        bg: colors.backgroundCard,
        borderColor: colors.border,
        _focus: {
          borderColor: colors.primary,
          bg: colors.backgroundCard,
        },
      },
    },
    Select: {
      defaultProps: {
        size: "md",
      },
      sizes: {
        md: {
          px: 3,
          py: 2,
          fontSize: "md",
        },
      },
      baseStyle: {
        bg: colors.backgroundCard,
        borderColor: colors.border,
      },
    },
    Card: {
      baseStyle: {
        bg: colors.backgroundCard,
        borderColor: colors.border,
      },
    },
    Badge: {
      defaultProps: {
        size: "sm",
      },
      sizes: {
        xs: {
          px: 1.5,
          py: 0.5,
          _text: {
            fontSize: "xs",
          },
        },
        sm: {
          px: 2,
          py: 0.5,
          _text: {
            fontSize: "xs",
          },
        },
        md: {
          px: 2.5,
          py: 1,
          _text: {
            fontSize: "sm",
          },
        },
      },
      variants: {
        solid: {
          bg: colors.primary,
          _text: {
            color: colors.primaryContrast,
          },
        },
      },
    },
    Tabs: {
      baseStyle: {
        tabBarStyle: {
          bg: colors.backgroundCard,
          borderTopColor: colors.border,
        },
        tabStyle: {
          _selected: {
            _text: {
              color: colors.primary,
            },
            borderBottomColor: colors.primary,
          },
        },
      },
    },
  },
  // Override default dark mode colors
  _dark: {
    bg: colors.background,
    text: colors.textPrimary,
  },
});

// Type declaration for theme
type CustomThemeType = typeof theme;

declare module "native-base" {
  interface ICustomTheme extends CustomThemeType {}
}
