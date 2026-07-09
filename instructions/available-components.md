# Saffron Available Components

This document lists all available components from the Saffron Design System for React applications.

## Import Patterns

```tsx
// React components - use PascalCase with Saf prefix
import { SafButton } from '@thomsonreuters/saffron-core-components-prototyping-only/react''
import { SafTextField } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Multiple components
import { 
  SafButton, 
  SafTextField, 
  SafSelect,
  SafCheckbox 
} from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Styles - import in root layout
import '@thomsonreuters/saffron-core-styles-prototyping-only/index.css/dist/index.css'
```

## Core Components

### Layout & Structure

- `SafAccordion` - Collapsible content sections
- `SafAccordionItem` - Individual accordion items
- `SafCard` - Content card container
- `SafContainer` - Layout container
- `SafDivider` - Visual separator
- `SafLayoutGrid` - Grid layout system
- `SafLayoutGridItem` - Grid item
- `SafSplitter` - Resizable split panes

### Navigation

- `SafAnchor` - Hyperlink component
- `SafBreadcrumb` - Breadcrumb navigation
- `SafBreadcrumbItem` - Breadcrumb items
- `SafMenu` - Dropdown menu
- `SafMenuItem` - Menu items
- `SafPagination` - Page navigation
- `SafSideNav` - Side navigation panel
- `SafTabs` - Tab navigation
- `SafTab` - Individual tab
- `SafTabPanel` - Tab content panel
- `SafToolbar` - Action toolbar
- `SafSkipLink` - Accessibility skip link
- `SafSkipLinkGroup` - Skip link group

### Buttons & Actions

- `SafButton` - Primary button component
- `SafButtonEmbedded` - Embedded button variant
- `SafButtonGroup` - Button group container
- `SafActionCard` - Clickable card
- `SafActionCardAction` - Card action

### Form Controls

- `SafTextField` - Text input field
- `SafTextArea` - Multi-line text input
- `SafNumberField` - Number input
- `SafSearchField` - Search input
- `SafDatePicker` - Date selection
- `SafDateMaskedInput` - Masked date input
- `SafSelect` - Dropdown select
- `SafOption` - Select option
- `SafCombobox` - Searchable select
- `SafCheckbox` - Checkbox input
- `SafCheckboxGroup` - Checkbox group
- `SafRadio` - Radio button
- `SafRadioGroup` - Radio button group
- `SafSwitch` - Toggle switch
- `SafSlider` - Range slider
- `SafSliderLabel` - Slider label
- `SafFileUpload` - File upload input
- `SafCommentField` - Comment input

### Display Components

- `SafAvatar` - User avatar
- `SafBadge` - Status badge
- `SafChip` - Tag/chip component
- `SafIcon` - Icon component
- `SafLogo` - Logo component
- `SafText` - Text component
- `SafStatus` - Status indicator
- `SafMetadata` - Metadata display
- `SafMetadataItem` - Metadata item
- `SafEmptyState` - Empty state placeholder

### Feedback Components

- `SafAlert` - Alert messages
- `SafMessageBox` - Message box
- `SafProgress` - Progress bar
- `SafProgressRing` - Circular progress
- `SafProgressText` - Progress with text
- `SafActivity` - Activity indicator
- `SafActivityNote` - Activity note
- `SafAIPrompt` - User prompt

### Overlay Components

- `SafDialog` - Modal dialog
- `SafDrawer` - Slide-out drawer
- `SafTooltip` - Tooltip overlay
- `SafAnchoredRegion` - Anchored overlay

### List & Data Components

- `SafList` - List container
- `SafListItem` - List item
- `SafListbox` - Listbox component
- `SafTable` - Data table
- `SafDescriptionList` - Description list
- `SafDescriptionTerm` - List term
- `SafDescriptionDetails` - List details
- `SafTreeView` - Tree structure
- `SafTreeItem` - Tree item

### Advanced Components

- `SafCalendar` - Calendar component
- `SafCarousel` - Image carousel
- `SafFlipper` - Carousel navigation
- `SafChat` - Chat interface
- `SafFacetedFilter` - Faceted filtering
- `SafFacetCategory` - Facet category
- `SafFacetItem` - Facet item
- `SafStepper` - Step indicator
- `SafStep` - Individual step
- `SafWizard` - Multi-step wizard
- `SafWizardStepContent` - Wizard step content

### Window Components

- `SafWindow` - Window container
- `SafWindowPanel` - Window panel
- `SafWindows` - Multiple windows

### Utility Components

- `SafBackToTop` - Back to top button
- `SafClickAwayListener` - Click outside handler
- `SafDisclosure` - Disclosure widget
- `SafFooter` - Footer component
- `SafProductHeader` - Product header
- `SafProductHeaderItem` - Header item
- `SafSrOnly` - Screen reader only content

## Component Status

All components listed are stable and production-ready unless otherwise noted in internal documentation.

## Component Naming Convention

### React Components (PascalCase)

```tsx
SafButton
SafTextField
SafCheckbox
SafRadioGroup
```

### Web Components (kebab-case)

```tsx
saf-button
saf-text-field
saf-checkbox
saf-radio-group
```

**Note**: Always use React component names (PascalCase) in React applications.

## Props Pattern

Prop shapes are per-component and enum-typed — verify against the package types,
do not assume a generic union. The most commonly misremembered ones:

```tsx
// SafButton appearance (ButtonAppearance) — there is NO 'outline' or 'ghost'
appearance?: 'primary' | 'secondary' | 'tertiary' | 'inline'

// Density (ComponentDensity)
density?: 'compact' | 'normal' | 'spacious'

// States
disabled?: boolean
required?: boolean
```

## `SafText` appearance — canonical `TextAppearance` values

> Source of truth: `TextAppearanceEnum` in the components package. This is the
> **complete** set; any value not listed does not exist and silently falls back
> to default styling. The prop is `appearance`, never `variant`.

```
display-lg  display-sm
heading-4xl  heading-3xl  heading-2xl  heading-xl  heading-lg  heading-md
body-default-lg  body-default-md  body-default-sm  body-default-xs
body-strong-lg  body-strong-md  body-strong-sm  body-strong-xs
eyebrow-heavy-md  eyebrow-heavy-sm
```

Does NOT exist: `heading-sm/xs`, `display-md/xl`, `label-default-*`,
`body-italic-*`, `heading-1/2/3`, `caption`, `code`.

## Complete Component List (Alphabetical)

1. SafAccordion
2. SafAccordionItem
3. SafActionCard
4. SafActionCardAction
5. SafActivity
6. SafActivityNote
7. SafAlert
8. SafAnchor
9. SafAnchoredRegion
10. SafAvatar
11. SafBackToTop
12. SafBadge
13. SafBreadcrumb
14. SafBreadcrumbItem
15. SafButton
16. SafButtonEmbedded
17. SafButtonGroup
18. SafCalendar
19. SafCard
20. SafCarousel
21. SafChat
22. SafCheckbox
23. SafCheckboxGroup
24. SafChip
25. SafClickAwayListener
26. SafCombobox
27. SafCommentField
28. SafContainer
29. SafDateMaskedInput
30. SafDatePicker
31. SafDescriptionDetails
32. SafDescriptionList
33. SafDescriptionTerm
34. SafDialog
35. SafDisclosure
36. SafDivider
37. SafDrawer
38. SafEmptyState
39. SafFacetCategory
40. SafFacetItem
41. SafFacetedFilter
42. SafFileUpload
43. SafFlipper
44. SafFooter
45. SafIcon
46. SafLayoutGrid
47. SafLayoutGridItem
48. SafList
49. SafListItem
50. SafListbox
51. SafLogo
52. SafMenu
53. SafMenuItem
54. SafMessageBox
55. SafMetadata
56. SafMetadataItem
57. SafNumberField
58. SafOption
59. SafPagination
60. SafProductHeader
61. SafProductHeaderItem
62. SafProgress
63. SafProgressRing
64. SafProgressText
65. SafAIPrompt
66. SafRadio
67. SafRadioGroup
68. SafSearchField
69. SafSelect
70. SafSideNav
71. SafSkipLink
72. SafSkipLinkGroup
73. SafSlider
74. SafSliderLabel
75. SafSplitter
76. SafSrOnly
77. SafStatus
78. SafStep
79. SafStepper
80. SafSwitch
81. SafTab
82. SafTabPanel
83. SafTable
84. SafTabs
85. SafText
86. SafTextArea
87. SafTextField
88. SafToolbar
89. SafTooltip
90. SafTreeItem
91. SafTreeView
92. SafWindow
93. SafWindowPanel
94. SafWindows
95. SafWizard
96. SafWizardStepContent
97. SafWorkspacePattern

## Types & Utilities

```tsx
// Import types (if available)
import type { ButtonProps, TextFieldProps } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Design tokens
import '@thomsonreuters/saffron-core-styles-prototyping-only/index.css/dist/tokens/_variables.scss'
```

## Notes

- All component imports are named exports from `@thomsonreuters/saffron-core-components-prototyping-only/react`
- Components are tree-shakeable when using named imports
- Styles must be imported separately from `@thomsonreuters/saffron-core-styles-prototyping-only/index.css`
- Icons are separate components (see Icon Reference)
- All components support standard React props (className, style, etc.)
- Components follow WCAG 2.1 AA accessibility standards

## Quick Import Examples

```tsx
// Form components
import { 
  SafTextField, 
  SafSelect, 
  SafOption,
  SafCheckbox, 
  SafRadio,
  SafRadioGroup,
  SafButton 
} from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Layout components
import { 
  SafContainer, 
  SafCard, 
  SafDivider,
  SafLayoutGrid,
  SafLayoutGridItem 
} from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Navigation components
import { 
  SafTabs, 
  SafTab, 
  SafTabPanel,
  SafBreadcrumb,
  SafBreadcrumbItem,
  SafMenu,
  SafMenuItem 
} from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Feedback components
import { 
  SafAlert, 
  SafProgress,
  SafTooltip 
} from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Overlay components
import { 
  SafDialog,
  SafDrawer,
  SafTooltip
} from '@thomsonreuters/saffron-core-components-prototyping-only/react''
```

For detailed component APIs and usage examples, see [Component Reference](./component-reference.md).
