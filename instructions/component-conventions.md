# Saffron Component Conventions

Guidelines and conventions for using and developing Saffron Design System components effectively in React applications.

## Use a Saffron component instead of hand-rolling

If you are reaching for raw HTML/CSS, use the Saffron component instead. Every
`Saf*` name below is confirmed present and exported through the `/react` subpath.

| If you would hand-roll… | Use this Saffron component |
|---|---|
| `<table>` | `SafTable` |
| `<nav>` sidebar | `SafSideNav` + `SafMenuItem` children |
| breadcrumb `<nav>` | `SafBreadcrumb` + `SafBreadcrumbItem` |
| app `<header>` | `SafProductHeader` + `SafLogo` + `SafProductHeaderItem` |
| app `<footer>` | `SafFooter` |
| tab strip / `role="tab"` | `SafTabs` + `SafTab` + `SafTabPanel` |
| `<div>` card | `SafCard` |
| clickable card | `SafActionCard` |
| key/value summary list | `SafDescriptionList` |
| `<hr>` / divider | `SafDivider` |
| centered max-width wrapper | `SafContainer` |
| `<ul>`/`<ol>` content list | `SafList` + `SafListItem` |
| dropdown menu | `SafMenu` + `SafMenuItem` |
| expandable panel | `SafAccordion` + `SafAccordionItem` |
| `<button>` | `SafButton` |
| `<input>` / `<textarea>` | `SafTextField` (+ field variants) |
| styled `<a>` | `SafAnchor` |
| avatar `<img>` | `SafAvatar` |
| status pill `<span>` | `SafBadge` |

> **No layout primitives exist.** `SafGrid`, `SafStack`, `SafFlex`, `SafBox`,
> and `SafSplitLayout` are NOT in the package. Page-level grid/flex layout is
> hand-rolled CSS using `--saf-*` tokens — that is expected and allowed. The only
> shipped structural primitives are `SafContainer` (max-width wrapper) and
> `SafDivider`; use those rather than hand-rolling their equivalents.

## Prop Conventions

### Enum Props (Preferred)

Use enum props instead of boolean props for better scalability and clarity:

```tsx
// ✅ Good: Enum props (use the REAL ButtonAppearance values)
interface ButtonProps {
  appearance?: 'primary' | 'secondary' | 'tertiary' | 'inline';
  density?: 'compact' | 'normal' | 'spacious';
}

<SafButton appearance="primary" density="compact">Submit</SafButton>
```

> `outline` and `ghost` are NOT Saffron button appearances. The complete
> `ButtonAppearance` set is `primary | secondary | tertiary | inline`.

```tsx
// ❌ Avoid: Boolean props
interface ButtonProps {
  primary?: boolean;
  secondary?: boolean;
  compact?: boolean;
}

<SafButton primary compact>Submit</SafButton> // Unclear, not scalable
```

### Verbose Naming

Use descriptive, full words instead of abbreviations:

```tsx
// ✅ Good: Verbose naming
density?: 'compact' | 'normal' | 'spacious'
appearance?: 'primary' | 'secondary' | 'outline'

// ❌ Avoid: Abbreviated naming  
density?: 'sm' | 'md' | 'lg'
appearance?: 'pri' | 'sec' | 'out'
```

## Common Component Patterns

### Densities

Most Saffron components follow consistent density patterns:

```tsx
// Standard density options
density?: 'compact' | 'normal' | 'spacious'

// Usage
<SafButton density="compact">Compact Button</SafButton>
<SafTextField density="normal" label="Normal Input" />
<SafCard density="spacious">Spacious Card</SafCard>
```

### Appearances

Components typically have semantic appearance names:

```tsx
// Button appearances
appearance?: 'primary' | 'secondary' | 'outline' | 'ghost'

<SafButton appearance="primary">Primary Action</SafButton>
<SafButton appearance="secondary">Secondary Action</SafButton>
<SafButton appearance="outline">Outline Button</SafButton>
<SafButton appearance="ghost">Ghost Button</SafButton>

// Badge appearances
appearance?: 'success' | 'warning' | 'error' | 'info' | 'neutral'

<SafBadge appearance="success">Active</SafBadge>
<SafBadge appearance="warning">Pending</SafBadge>
<SafBadge appearance="error">Failed</SafBadge>
```

### States

Common state props across components:

```tsx
// Interactive states
disabled?: boolean;
loading?: boolean;

// Visual states  
active?: boolean;
selected?: boolean;

// Form states
error?: string;
required?: boolean;
```

## Icon Integration

### Using SafIcon Component

Saffron uses the SafIcon component for icons:

```tsx
import { SafButton, SafIcon } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Icon with start slot
<SafButton>
  <SafIcon slot="start" name="plus" />
  Add Item
</SafButton>

// Icon with end slot
<SafButton>
  Continue
  <SafIcon slot="end" name="arrow-right" />
</SafButton>

// Icon-only button (requires aria-label)
<SafButton aria-label="Close" appearance="ghost">
  <SafIcon name="x" />
</SafButton>
```

### Icon Slots

Many components support icon slots:

```tsx
// TextField with icons
<SafTextField label="Search">
  <SafIcon slot="prefix" name="search" />
</SafTextField>

// Menu items with icons
<SafMenuItem>
  <SafIcon slot="start" name="pencil" />
  Edit
</SafMenuItem>
```

## Accessibility Guidelines

### Required Attributes

- Always include `aria-label` for icon-only elements
- Use semantic HTML elements
- Provide descriptive labels for form inputs
- Support keyboard navigation

```tsx
// ✅ Good: Proper accessibility
<SafButton aria-label="Delete item" appearance="ghost">
  <SafIcon name="trash" />
</SafButton>

<SafTextField label="Email" type="email" required />

// ❌ Missing accessibility
<SafButton appearance="ghost">
  <SafIcon name="trash" />
</SafButton>

<SafTextField type="email" /> // Missing label
```

### Form Labels

Always provide labels for form inputs:

```tsx
// ✅ Good: Visible label
<SafTextField label="Email" type="email" />

// ✅ Good: Hidden label with aria-label
<SafTextField aria-label="Search" type="search" />

// ❌ Bad: No label
<SafTextField placeholder="Email" type="email" />
```

### Focus Management

- Components handle focus states automatically
- Use proper tab order with `tabIndex` when needed
- Ensure keyboard navigation works correctly

```tsx
// Custom tab order
<SafButton tabIndex={1}>First</SafButton>
<SafButton tabIndex={2}>Second</SafButton>

// Skip from tab order
<SafButton tabIndex={-1}>Skip</SafButton>
```

## Component Composition

### Compound Components

Saffron uses compound patterns for complex components:

```tsx
// Modal composition
<SafDialog open={isOpen} onClose={() => setIsOpen(false)}>
    Content goes here
    <SafButton appearance="secondary">Cancel</SafButton>
    <SafButton appearance="primary">Confirm</SafButton>
</SafDialog>

// Accordion composition
<SafAccordion>
  <SafAccordionItem heading="Section 1">
    Content 1
  </SafAccordionItem>
  <SafAccordionItem heading="Section 2">
    Content 2
  </SafAccordionItem>
</SafAccordion>
```

### Slots

Web components use slots for flexible composition:

```tsx
// Named slots
<SafButton>
  <SafIcon slot="start" name="plus" />
  Button Text
  <SafIcon slot="end" name="arrow-right" />
</SafButton>

// Default slot
<SafCard>
  <p>This goes in the default slot</p>
</SafCard>
```

## Styling Integration

### CSS Classes

Components accept standard `className` prop:

```tsx
<SafButton className="my-custom-class">
  Custom Styled Button
</SafButton>
```

### Design Tokens

Use Saffron design tokens for consistent theming:

```css
.custom-element {
  /* Tier 1 tokens - base values */
  color: var(--saf-color-text-primary);
  background: var(--saf-color-background-surface);
  padding: var(--saf-spacing-medium);
  border-radius: var(--saf-border-radius-small);
  
  /* Tier 2 tokens - semantic values */
  font-size: var(--saf-font-size-body);
  font-weight: var(--saf-font-weight-normal);
  line-height: var(--saf-line-height-body);
}
```

### Inline Styles

```tsx
<SafButton style={{ marginTop: '16px' }}>
  Button with inline style
</SafButton>
```

## Form Integration

### Form Components

Form components follow consistent patterns:

```tsx
function RegistrationForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    country: '',
    agreed: false
  })

  return (
    <form onSubmit={handleSubmit}>
      <SafTextField 
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      
      <SafTextField 
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />
      
      <SafSelect
        label="Country"
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        required
      >
        <SafOption value="">Select...</SafOption>
        <SafOption value="us">United States</SafOption>
        <SafOption value="uk">United Kingdom</SafOption>
      </SafSelect>
      
      <SafCheckbox
        checked={formData.agreed}
        onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
      >
        I agree to the terms
      </SafCheckbox>
      
      <SafButton type="submit" appearance="primary">
        Submit
      </SafButton>
    </form>
  )
}
```

### Validation States

Components support validation feedback:

```tsx
// Error state
<SafTextField 
  label="Email"
  error="Email is required"
  value={email}
/>

// With helper text
<SafTextField 
  label="Password"
  helperText="Must be at least 8 characters"
  type="password"
/>
```

## Performance Considerations

### Import Optimization

Use named imports for tree-shaking:

```tsx
// ✅ Optimized: Named imports
import { SafButton, SafTextField } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// ❌ Avoid: Namespace imports
import * as Saffron from '@thomsonreuters/saffron-core-components-prototyping-only/react''
```

### Component Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const SafDialog = lazy(() => 
  import('@thomsonreuters/saffron-core-components-prototyping-only/react'').then(mod => ({ 
    default: mod.SafDialog 
  }))
)

function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SafDialog>...</SafDialog>
    </Suspense>
  )
}
```

### Controlled Components

Use controlled components for better React integration:

```tsx
// ✅ Controlled
const [value, setValue] = useState('')
<SafTextField value={value} onChange={(e) => setValue(e.target.value)} />

// Uncontrolled (use sparingly)
<SafTextField defaultValue="initial" />
```

## Error Handling

### Graceful Degradation

Provide fallback content and error states:

```tsx
// Avatar with fallback
<SafAvatar 
  src={user.avatar}
  initials={user.name.substring(0, 2).toUpperCase()}
  alt={`${user.name} avatar`}
/>

// Conditional rendering with fallback
{data ? (
  <SafTable>{/* table content */}</SafTable>
) : (
  <SafEmptyState>No data available</SafEmptyState>
)}
```

### Error Boundaries

Wrap components in error boundaries when needed:

```tsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <ComplexSaffronComponent />
</ErrorBoundary>
```

## Testing Patterns

### Component Testing

Test components with React Testing Library:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { SafButton } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

test('button handles click events', () => {
  const handleClick = jest.fn()
  render(<SafButton onClick={handleClick}>Click me</SafButton>)
  
  fireEvent.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})

test('button has proper aria labels', () => {
  render(<SafButton aria-label="Save document">💾</SafButton>)
  expect(screen.getByLabelText('Save document')).toBeInTheDocument()
})
```

## Naming Conventions

### Component Names

- React components: PascalCase with `Saf` prefix
- Example: `SafButton`, `SafTextField`, `SafDialog`

### Props

- Use camelCase for prop names
- Example: `appearance`, `density`, `helperText`

### CSS Custom Properties

- Use kebab-case with `--saf-` prefix
- Example: `--saf-color-primary`, `--saf-spacing-medium`

## Best Practices Summary

1. ✅ Use enum props over boolean props
2. ✅ Provide descriptive labels for all form inputs
3. ✅ Include `aria-label` for icon-only buttons
4. ✅ Use design tokens instead of hardcoded values
5. ✅ Import components with named imports
6. ✅ Use controlled components for forms
7. ✅ Follow compound component patterns for complex UIs
8. ✅ Test accessibility with keyboard navigation
9. ✅ Provide error states and validation feedback
10. ✅ Use Saffron naming conventions consistently

This comprehensive guide ensures consistent usage and development of Saffron components while maintaining accessibility, performance, and user experience standards.
