# Retro Ranker App - Agent Guide

This document outlines the technologies, architectural decisions, and design
choices used in the Retro Ranker mobile application.

## Core Technologies

### Framework & Runtime

- **Expo SDK 54**: Cross-platform mobile development framework
- **React Native 0.81.5**: Mobile app framework
- **React 19.1.0**: UI library
- **TypeScript 5.9.2**: Type-safe JavaScript with strict mode enabled

### Routing

- **Expo Router 6.0.22**: File-based routing system
  - Uses `app/` directory structure for routes
  - Supports nested routes with `(tabs)` grouping
  - Dynamic routes using `[param]` syntax
  - Stack navigation with gesture support enabled

### UI Framework

- **NativeBase 3.4.28**: Component library
  - Provides consistent cross-platform components
  - Custom theme configuration in `theme/nativebase-theme.ts`
  - Uses Box, VStack, HStack for layout
  - Button, Text, Image, Badge, Spinner components

### Icons

- **Feather Icons** (via `@expo/vector-icons`): **Primary icon library**
  - All icons throughout the app use Feather icons
  - Consistent icon style and sizing
  - Examples: `chevron-left`, `chevron-right`, `skip-back`, `skip-forward`,
    `dollar-sign`
  - Import pattern: `import { Feather } from '@expo/vector-icons'`

### Styling & Theming

- **Custom Color System**: Defined in `theme/colors.ts`
  - Dark theme with primary orange accent (`#FF6B35`)
  - Semantic color names: `backgroundCard`, `backgroundElevated`, `textPrimary`,
    `textSecondary`
  - Status colors: `success`, `error`, `warning`, `info`
- **NativeBase Theme**: Custom theme extending NativeBase defaults
- **Linear Gradients**: `expo-linear-gradient` for smooth fade effects on device
  images

### Backend & Data

- **PocketBase 0.26.6**: Backend-as-a-Service
  - Authentication and data storage
  - Service layer in `services/pocketbase/`
- **AsyncStorage**: Local storage via
  `@react-native-async-storage/async-storage`

### State Management

- **React Context API**: For global state
  - `AuthContext`: Authentication state management
  - Located in `contexts/AuthContext.tsx`

## Architecture Patterns

### Directory Structure

```
app/                    # Routes (file-based routing)
  (tabs)/              # Tab navigation group
  auth/                # Authentication routes
  devices/             # Device detail pages
  collections/         # Collection pages
components/            # Reusable UI components
  achievements/        # Achievement-related components
  cards/              # Card components (DeviceCard, DeviceCardRow)
  comparisons/        # Device comparison components
  devices/            # Device-specific components
  forms/              # Form components
  shared/              # Shared utilities (Pagination, TagComponent)
  specifications/     # Device spec components
services/              # Business logic layer
  achievements/       # Achievement services
  auth/               # Authentication services (PKCE)
  devices/            # Device-related services
  pocketbase/         # PocketBase client
types/                 # TypeScript type definitions
theme/                 # Theme configuration
utils/                 # Utility functions
```

### Component Patterns

- **Functional Components**: All components use React functional components with
  hooks
- **TypeScript Interfaces**: Strong typing for all props and data structures
- **Service Layer**: Business logic separated into service files
- **Helper Functions**: Utility functions in `utils/` directory

### Component Design Choices

#### Device Cards

- **DeviceCard**: Full card with image, badges, and metadata
  - Uses gradient overlays for badge visibility
  - Image with lighter gray background (`backgroundElevated`) extending to edges
  - Badges positioned absolutely at top
  - Price displayed at bottom of image
  - Device name on first line, brand on second line (both truncated to 1 line)

- **DeviceCardRow**: Horizontal layout for list views
  - Image on left with lighter gray background
  - Content on right with device info

#### Pagination

- Uses Feather icons for navigation:
  - `skip-back`: First page
  - `chevron-left`: Previous page
  - `chevron-right`: Next page
  - `skip-forward`: Last page
- Icons sized at 16px
- Disabled state uses opacity 0.5

## Design Decisions

### Theme

- **Dark Mode Only**: App uses dark theme (`userInterfaceStyle: "dark"`)
- **Color Palette**:
  - Primary: Orange (`#FF6B35`) - used for accents, buttons, links
  - Backgrounds: Dark grays (`#1a1a1a`, `#2d2d2d`, `#3a3a3a`)
  - Text: White/light grays for hierarchy

### Typography

- Consistent font sizing using NativeBase size tokens (`xs`, `sm`, `md`, `lg`,
  `xl`, `2xl`)
- Device titles: `sm` size, bold, single line with truncation
- Brand names: `xs` size, secondary color, single line with truncation

### Layout

- **Safe Areas**: Uses `react-native-safe-area-context` for proper spacing
- **Gestures**: Full gesture support enabled for navigation
- **Responsive**: Components adapt to different screen sizes

### Image Handling

- Device images use `resizeMode="contain"` to preserve aspect ratio
- Images have padding within lighter gray background containers
- Gradient overlays (top and bottom) for badge/price visibility
- Lazy loading with `loading="lazy"` attribute

### Navigation

- **Stack Navigation**: Primary navigation pattern
- **Tab Navigation**: Bottom tabs for main sections
- **Modal Presentation**: Used for auth screens
- **Gesture Navigation**: Enabled for iOS-style swipe back

## Development Standards

### TypeScript

- **Strict Mode**: Enabled in `tsconfig.json`
- **Path Aliases**: `@/*` maps to root directory
- **Type Definitions**: All types in `types/` directory

### Code Organization

- **Separation of Concerns**:
  - Components handle UI
  - Services handle business logic
  - Types define data structures
- **Reusability**: Shared components in `components/shared/`
- **Consistency**: Follow established patterns for new features

### Naming Conventions

- **Components**: PascalCase (e.g., `DeviceCard.tsx`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Services**: kebab-case (e.g., `device.service.ts`)
- **Types**: kebab-case with `.contract.ts` or `.model.ts` suffix

## Key Libraries & Tools

### Expo Ecosystem

- `expo-router`: File-based routing
- `expo-linear-gradient`: Gradient effects
- `expo-linking`: Deep linking support
- `expo-crypto`: Cryptographic functions (for PKCE)
- `expo-constants`: App constants

### React Native Ecosystem

- `react-native-gesture-handler`: Gesture support
- `react-native-safe-area-context`: Safe area handling
- `react-native-screens`: Native screen components
- `react-native-svg`: SVG support

### Other

- `@react-native-picker/picker`: Picker component
- `pocketbase`: Backend client

## Platform Support

- **iOS**: Supported with tablet support
- **Android**: Supported with edge-to-edge enabled
- **Web**: Supported via Expo web

## Authentication

- **PKCE Flow**: Implemented in `services/auth/pkce.service.ts`
- **OAuth Providers**: Google, Discord (via `auth/[provider]/callback.tsx`)
- **Context-Based**: Auth state managed via `AuthContext`

## Notes for AI Assistants

When working on this codebase:

1. **Always use Feather icons** from `@expo/vector-icons` - never use other icon
   libraries
2. **Follow the color system** - use semantic color names from `theme/colors.ts`
3. **Maintain dark theme** - all UI should use dark theme colors
4. **Use NativeBase components** - prefer NativeBase components over raw React
   Native
5. **Type everything** - use TypeScript interfaces for all props and data
6. **Follow directory structure** - place files in appropriate directories
7. **Service layer pattern** - business logic goes in services, not components
8. **Consistent sizing** - use NativeBase size tokens, not arbitrary pixel
   values
9. **Truncation** - device titles and brands should truncate to 1 line
10. **Gradient overlays** - use `expo-linear-gradient` for smooth fade effects
