# Saffron Component Reference

Comprehensive reference of Saffron Design System components with React examples and common usage patterns.

## Core Components

### SafButton

Trigger actions or events like submitting forms or displaying dialogs.

```tsx
import { SafButton } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Appearances
<SafButton appearance="primary">Primary Action</SafButton>
<SafButton appearance="secondary">Secondary Action</SafButton>
<SafButton appearance="outline">Outlined Button</SafButton>
<SafButton appearance="ghost">Ghost Button</SafButton>

// Densities
<SafButton density="compact">Compact</SafButton>
<SafButton density="normal">Normal</SafButton>
<SafButton density="spacious">Spacious</SafButton>

// States
<SafButton disabled>Disabled</SafButton>
<SafButton loading>Loading...</SafButton>

// With icons (using SafIcon)
<SafButton>
  <SafIcon slot="start" name="plus" />
  Add Item
</SafButton>
<SafButton>
  Continue
  <SafIcon slot="end" name="arrow-right" />
</SafButton>

// Icon-only button (requires aria-label)
<SafButton aria-label="Close" appearance="ghost">
  <SafIcon name="x" />
</SafButton>
```

### SafTextField

Text input fields with various configurations.

```tsx
import { SafTextField } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Basic usage
<SafTextField label="Email" type="email" placeholder="Enter your email" />
<SafTextField label="Password" type="password" />

// With helper text and validation
<SafTextField 
  label="Username"
  helperText="Choose a unique username"
  required
/>

// Error state
<SafTextField 
  label="Email"
  error="This field is required"
  value={email}
/>

// Disabled state
<SafTextField label="Read-only" disabled value="Cannot edit" />

// With change handler
<SafTextField 
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

### SafTextArea

Multi-line text input component.

```tsx
import { SafTextArea } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafTextArea 
  label="Comments"
  placeholder="Enter your comments"
  rows={4}
/>

<SafTextArea 
  label="Description"
  helperText="Maximum 500 characters"
  maxLength={500}
  resize="vertical"
/>
```

### SafSelect

Dropdown selection component.

```tsx
import { SafSelect, SafOption } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafSelect label="Country" required>
  <SafOption value="us">United States</SafOption>
  <SafOption value="uk">United Kingdom</SafOption>
  <SafOption value="ca">Canada</SafOption>
  <SafOption value="au">Australia</SafOption>
</SafSelect>

// With onChange handler
<SafSelect 
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
>
  <SafOption value="active">Active</SafOption>
  <SafOption value="pending">Pending</SafOption>
  <SafOption value="inactive">Inactive</SafOption>
</SafSelect>
```

## Form Components

### SafCheckbox

Binary choice input component.

```tsx
import { SafCheckbox } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafCheckbox>Accept terms and conditions</SafCheckbox>

<SafCheckbox 
  checked={isSubscribed}
  onChange={(e) => setIsSubscribed(e.target.checked)}
>
  Subscribe to newsletter
</SafCheckbox>

<SafCheckbox disabled>Disabled option</SafCheckbox>

<SafCheckbox indeterminate>Partially selected</SafCheckbox>
```

### SafCheckboxGroup

Group of related checkboxes.

```tsx
import { SafCheckboxGroup, SafCheckbox } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafCheckboxGroup label="Select features">
  <SafCheckbox value="feature1">Feature 1</SafCheckbox>
  <SafCheckbox value="feature2">Feature 2</SafCheckbox>
  <SafCheckbox value="feature3">Feature 3</SafCheckbox>
</SafCheckboxGroup>
```

### SafRadio & SafRadioGroup

Single selection from multiple options.

```tsx
import { SafRadioGroup, SafRadio } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafRadioGroup 
  label="Choose an option"
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
>
  <SafRadio value="option1">Option 1</SafRadio>
  <SafRadio value="option2">Option 2</SafRadio>
  <SafRadio value="option3">Option 3</SafRadio>
</SafRadioGroup>
```

### SafSwitch

Toggle between two states.

```tsx
import { SafSwitch } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafSwitch>Enable notifications</SafSwitch>

<SafSwitch 
  checked={isDarkMode}
  onChange={(e) => setIsDarkMode(e.target.checked)}
>
  Dark mode
</SafSwitch>
```

### SafNumberField

Numeric input with increment/decrement controls.

```tsx
import { SafNumberField } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafNumberField 
  label="Quantity"
  min={1}
  max={100}
  step={1}
  value={quantity}
  onChange={(e) => setQuantity(Number(e.target.value))}
/>
```

### SafDatePicker

Date selection component.

```tsx
import { SafDatePicker } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafDatePicker 
  label="Start Date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
/>

<SafDatePicker 
  label="Birth Date"
  min="1900-01-01"
  max="2024-12-31"
  required
/>
```

## Display Components

### SafAvatar

Display user profile images or initials.

```tsx
import { SafAvatar } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafAvatar src="/user.jpg" alt="User avatar" />
<SafAvatar initials="JD" />
<SafAvatar size="small" initials="AB" />
<SafAvatar size="large" src="/profile.jpg" />
```

### SafBadge

Display status or category information.

```tsx
import { SafBadge } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafBadge>Default</SafBadge>
<SafBadge appearance="success">Active</SafBadge>
<SafBadge appearance="warning">Pending</SafBadge>
<SafBadge appearance="error">Failed</SafBadge>
<SafBadge appearance="info">Info</SafBadge>
<SafBadge size="small">Small</SafBadge>
```

### SafChip

Tag or chip component for labels and selections.

```tsx
import { SafChip } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafChip>Tag</SafChip>
<SafChip removable onRemove={() => handleRemove()}>
  Removable Tag
</SafChip>
<SafChip appearance="primary">Primary</SafChip>
<SafChip appearance="secondary">Secondary</SafChip>
```

### SafAlert

Highlight important information.

```tsx
import { SafAlert } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafAlert>This is important information</SafAlert>
<SafAlert appearance="success">Operation completed successfully</SafAlert>
<SafAlert appearance="warning">Please review the changes</SafAlert>
<SafAlert appearance="error">An error occurred</SafAlert>
<SafAlert dismissible onDismiss={() => handleDismiss()}>
  Dismissible alert
</SafAlert>
```

### SafText

Semantic text rendering. The prop is `appearance` (NOT `variant`), typed by
`TextAppearance`. Use `as` to set the rendered element independently of the
visual appearance. See the canonical value list in `available-components.md`.

```tsx
import { SafText } from '@thomsonreuters/saffron-core-components-prototyping-only/react'

<SafText appearance="display-sm" as="h1">Display heading</SafText>
<SafText appearance="heading-lg" as="h2">Section heading</SafText>
<SafText appearance="heading-md" as="h3">Subsection heading</SafText>
<SafText appearance="body-default-md">Body text</SafText>
<SafText appearance="body-strong-sm">Emphasized small text</SafText>
<SafText appearance="eyebrow-heavy-sm">Eyebrow label</SafText>
```

> `variant`, `heading-1`, `heading-2`, `heading-3`, `caption`, and `code` are
> NOT valid — they silently fall back to default styling. Valid appearances:
> `display-lg/sm`, `heading-4xl/3xl/2xl/xl/lg/md`, `body-default-lg/md/sm/xs`,
> `body-strong-lg/md/sm/xs`, `eyebrow-heavy-md/sm`.

### SafProgress

Show completion status.

```tsx
import { SafProgress } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafProgress value={60} max={100} />
<SafProgress value={80} appearance="success" />
<SafProgress indeterminate />
```

### SafProgressRing

Circular progress indicator.

```tsx
import { SafProgressRing } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafProgressRing value={75} />
<SafProgressRing indeterminate />
```


Loading skeleton placeholder.

```tsx

```

## Navigation Components

### SafTabs

Navigate between related content sections.

```tsx
import { SafTabs, SafTab, SafTabPanel } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafTabs activeId="tab1">
  <SafTab id="tab1">Tab 1</SafTab>
  <SafTab id="tab2">Tab 2</SafTab>
  <SafTab id="tab3">Tab 3</SafTab>
  
  <SafTabPanel id="tab1">Content for tab 1</SafTabPanel>
  <SafTabPanel id="tab2">Content for tab 2</SafTabPanel>
  <SafTabPanel id="tab3">Content for tab 3</SafTabPanel>
</SafTabs>
```

### SafBreadcrumb

Breadcrumb navigation.

```tsx
import { SafBreadcrumb, SafBreadcrumbItem } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafBreadcrumb>
  <SafBreadcrumbItem href="/">Home</SafBreadcrumbItem>
  <SafBreadcrumbItem href="/products">Products</SafBreadcrumbItem>
  <SafBreadcrumbItem current>Details</SafBreadcrumbItem>
</SafBreadcrumb>
```

### SafMenu & SafMenuItem

Contextual action menus.

```tsx
import { SafMenu, SafMenuItem } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafMenu>
  <SafButton slot="trigger">Options</SafButton>
  <SafMenuItem onClick={handleEdit}>
    <SafIcon slot="start" name="pencil" />
    Edit
  </SafMenuItem>
  <SafMenuItem onClick={handleDuplicate}>
    <SafIcon slot="start" name="copy" />
    Duplicate
  </SafMenuItem>
  <SafMenuItem onClick={handleDelete} appearance="danger">
    <SafIcon slot="start" name="trash" />
    Delete
  </SafMenuItem>
</SafMenu>
```

### SafPagination

Navigate through pages of content.

```tsx
import { SafPagination } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafPagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={(page) => setCurrentPage(page)}
/>
```

## Overlay Components

### SafDialog

Display content in modal dialogs. Dialogs use slots for structure.

```tsx
import { SafDialog, SafButton } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafDialog 
  open={isOpen} 
  dialog-title="Confirm Action"
  dialog-subtitle="This action cannot be undone"
>
  <p>Are you sure you want to proceed with this action?</p>
  
  <div slot="footer">
    <SafButton 
      appearance="secondary" 
      onClick={() => setIsOpen(false)}
    >
      Cancel
    </SafButton>
    <SafButton 
      appearance="primary" 
      onClick={handleConfirm}
    >
      Confirm
    </SafButton>
  </div>
</SafDialog>
```

### SafDrawer

Side panel overlays.

```tsx
import { SafDrawer } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafDrawer 
  open={isDrawerOpen} 
  onClose={() => setIsDrawerOpen(false)}
  position="right"
>
  <h2>Settings</h2>
  <p>Drawer content goes here</p>
</SafDrawer>
```

### SafTooltip

Contextual help and information.

```tsx
import { SafTooltip, SafButton } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafTooltip content="This is helpful information">
  <SafButton>Hover me</SafButton>
</SafTooltip>

<SafTooltip content="Additional context" position="top">
  <SafButton>Top tooltip</SafButton>
</SafTooltip>
```

## Layout Components

### SafCard

Content card container.

```tsx
import { SafCard } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafCard>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</SafCard>

<SafCard elevation="low">Low elevation</SafCard>
<SafCard elevation="medium">Medium elevation</SafCard>
<SafCard elevation="high">High elevation</SafCard>
```

### SafContainer

Layout container with consistent spacing.

```tsx
import { SafContainer } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafContainer>
  <h1>Page Title</h1>
  <p>Page content</p>
</SafContainer>

<SafContainer maxWidth="1200px">
  Constrained width container
</SafContainer>
```

### SafLayoutGrid

Flexible grid layout system.

```tsx
import { SafLayoutGrid, SafLayoutGridItem } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafLayoutGrid columns={3} gap="medium">
  <SafLayoutGridItem>Grid item 1</SafLayoutGridItem>
  <SafLayoutGridItem>Grid item 2</SafLayoutGridItem>
  <SafLayoutGridItem>Grid item 3</SafLayoutGridItem>
</SafLayoutGrid>

// Responsive grid
<SafLayoutGrid 
  columns={12}
  columnsTablet={6}
  columnsMobile={1}
>
  <SafLayoutGridItem span={6}>Half width</SafLayoutGridItem>
  <SafLayoutGridItem span={6}>Half width</SafLayoutGridItem>
</SafLayoutGrid>
```

### SafDivider

Visual separator.

```tsx
import { SafDivider } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafDivider />
<SafDivider orientation="vertical" />
<SafDivider role="separator" />
```

### SafAccordion

Collapsible content sections.

```tsx
import { SafAccordion, SafAccordionItem } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafAccordion>
  <SafAccordionItem heading="Section 1">
    Content for section 1
  </SafAccordionItem>
  <SafAccordionItem heading="Section 2">
    Content for section 2
  </SafAccordionItem>
  <SafAccordionItem heading="Section 3" expanded>
    Content for section 3 (initially expanded)
  </SafAccordionItem>
</SafAccordion>
```

## Data Components

### SafTable

Display tabular data.

```tsx
import { SafTable } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafTable>
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td><SafBadge appearance="success">Active</SafBadge></td>
      <td><SafButton size="small">Edit</SafButton></td>
    </tr>
    <tr>
      <td>Jane Smith</td>
      <td><SafBadge appearance="warning">Pending</SafBadge></td>
      <td><SafButton size="small">Edit</SafButton></td>
    </tr>
  </tbody>
</SafTable>
```

### SafList

List component with consistent styling.

```tsx
import { SafList, SafListItem } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

<SafList>
  <SafListItem>Item 1</SafListItem>
  <SafListItem>Item 2</SafListItem>
  <SafListItem>Item 3</SafListItem>
</SafList>
```

## Advanced Patterns

### Form Example

```tsx
import { 
  SafTextField, 
  SafSelect, 
  SafOption,
  SafCheckbox, 
  SafButton 
} from '@thomsonreuters/saffron-core-components-prototyping-only/react''

function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    agreed: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <SafTextField
        label="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <SafTextField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      
      <SafSelect
        label="Country"
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        required
      >
        <SafOption value="">Select a country</SafOption>
        <SafOption value="us">United States</SafOption>
        <SafOption value="uk">United Kingdom</SafOption>
        <SafOption value="ca">Canada</SafOption>
      </SafSelect>
      
      <SafCheckbox
        checked={formData.agreed}
        onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
        required
      >
        I agree to the terms and conditions
      </SafCheckbox>
      
      <SafButton type="submit" appearance="primary">
        Register
      </SafButton>
    </form>
  )
}
```

### Controlled vs Uncontrolled

```tsx
// Controlled component
<SafTextField 
  value={inputValue} 
  onChange={(e) => setInputValue(e.target.value)} 
/>

// Uncontrolled with ref
const inputRef = useRef<HTMLInputElement>(null)
<SafTextField ref={inputRef} defaultValue="initial" />
```

This reference covers the most commonly used Saffron components. For complete API documentation and additional components, refer to the internal Saffron Storybook and documentation.
