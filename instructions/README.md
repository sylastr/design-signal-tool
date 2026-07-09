# Saffron Design System Instructions

This directory contains comprehensive documentation for using the Thomson Reuters Saffron Design System effectively in React projects.

## Documentation Overview

### 📋 [System Prompt](./system-prompt.md)
**Essential quick reference** - Contains the most critical information about using Saffron components. Perfect for system prompts, onboarding, or quick troubleshooting.

### 🚀 [Setup Guide](./saffron-setup.md)
**Complete installation guide** - Step-by-step instructions for setting up Saffron in your React project, including package installation, configuration, and troubleshooting common issues.

### 📖 [Component Reference](./component-reference.md)
**Comprehensive component catalog** - Detailed reference of all available Saffron components with examples, props, and usage patterns.

### 📏 [Component Conventions](./component-conventions.md)
**Best practices guide** - Conventions for prop naming, accessibility, styling, and component composition. Follow these for consistent usage.

### 🎨 [Icon Reference](./icon-reference.md)
**Complete icon catalog** - All available icons with usage examples and naming conventions.

### 📦 [Available Components](./available-components.md)
**Component list** - Quick reference of all available Saffron components and their imports.

## Quick Start

1. **New to Saffron?** Start with [Setup Guide](./saffron-setup.md)
2. **Need a specific component?** Check [Component Reference](./component-reference.md)
3. **Looking for icons?** Browse [Icon Reference](./icon-reference.md)
4. **Having issues?** See [System Prompt](./system-prompt.md) troubleshooting section
5. **Want best practices?** Review [Component Conventions](./component-conventions.md)

## Common Issues & Quick Fixes

### Import Errors
```
Cannot find module '@thomsonreuters/saffron-core-components-prototyping-only/react''
```
**Solution**: Ensure package is installed and imported correctly. Check [Setup Guide](./saffron-setup.md).

### Missing Styles
**Solution**: Ensure proper CSS import order:
- Import Saffron CSS before custom styles
- Import design tokens if using custom theming

### Web Components Not Registering
**Solution**: Ensure proper React wrapper usage and component registration. See [Setup Guide](./saffron-setup.md).

## Package Information

- **NPM Package**: `@thomsonreuters/saffron-core-components-prototyping-only`
- **Styles Package**: `@thomsonreuters/saffron-core-styles-prototyping-only/index.css`
- **React Components**: Import from `@thomsonreuters/saffron-core-components-prototyping-only/react`
- **Design Tokens**: Available in `@thomsonreuters/saffron-core-styles-prototyping-only/index.css/dist/tokens`
- **Framework**: Web Components using Microsoft FAST Element
- **Technology**: Web Components with React wrappers

## Essential Configuration

```tsx
// React component imports
import { 
  SafButton, 
  SafTextField, 
  SafDialog 
} from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Styles import
import '@thomsonreuters/saffron-core-styles-prototyping-only/index.css/dist/index.css'

// Design tokens (optional)
import '@thomsonreuters/saffron-core-styles-prototyping-only/index.css/dist/tokens/_variables.scss'
```

```tsx
// Basic usage
export function MyComponent() {
  return (
    <SafButton appearance="primary">
      Click Me
    </SafButton>
  )
}
```

## Component Naming Convention

- **React Components**: PascalCase with `Saf` prefix (e.g., `SafButton`, `SafTextField`)
- **Web Components**: kebab-case with `saf-` prefix (e.g., `saf-button`, `saf-text-field`)
- **Props**: camelCase for React (e.g., `appearance`, `density`)
- **Attributes**: kebab-case for web components (e.g., `appearance`, `density`)

## Design Tokens

Saffron uses a two-tier token system:

- **Tier 1 (Base Tokens)**: Core design values (colors, spacing, typography)
- **Tier 2 (Semantic Tokens)**: Component-specific tokens that reference tier 1

```css
/* Using design tokens */
.custom-element {
  color: var(--saf-color-text-primary);
  padding: var(--saf-spacing-medium);
  border-radius: var(--saf-border-radius-small);
}
```

## Contributing

When contributing to these docs:

1. Keep examples practical and React-focused
2. Include both correct ✅ and incorrect ❌ patterns
3. Update version information when packages change
4. Cross-reference between documents when relevant
5. Test all code examples before committing
6. Follow Saffron naming conventions

## Resources

- **Saffron Documentation**: [https://saffron.thomsonreuters.com](https://saffron.thomsonreuters.com)
- **Storybook**: Internal Saffron Storybook for component examples
- **Component Source**: core-packages/core-components/src/components
- **Design Tokens**: core-packages/core-styles/dist/tokens

## Key Principles

1. **Web Components Foundation**: Saffron is built on web components using Microsoft FAST Element
2. **React Wrappers**: Use React-specific wrappers for optimal React integration
3. **Accessibility First**: All components meet WCAG 2.1 AA standards
4. **Design Tokens**: Consistent theming through two-tier token system
5. **Thomson Reuters Standards**: Enterprise-grade components for TR applications

This documentation is based on the Thomson Reuters Saffron Design System and reflects current best practices for React development.

````
