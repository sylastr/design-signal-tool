# Saffron Icon Reference

Comprehensive guide for using icons in the Thomson Reuters Saffron Design System.

## Icon Component Usage

Saffron provides the `SafIcon` component for displaying icons throughout your application.

### Basic Usage

```tsx
import { SafIcon } from '@thomsonreuters/saffron-core-components-prototyping-only/react''

// Basic icon
<SafIcon name="home" />

// Icon with size
<SafIcon name="settings" size="20" />
<SafIcon name="user" size="24" />
<SafIcon name="search" size="32" />

// Icon with color (using CSS)
<SafIcon name="check" style={{ color: 'green' }} />
<SafIcon name="x" className="text-red-500" />
```

### Icons in Components

Icons can be used with slots in many Saffron components:

```tsx
// In buttons
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

// In text fields
<SafTextField label="Search">
  <SafIcon slot="prefix" name="search" />
</SafTextField>

// In menu items
<SafMenuItem>
  <SafIcon slot="start" name="pencil" />
  Edit
</SafMenuItem>
```

## Available Icons

### Navigation & Arrows

- `arrow-up` - Up arrow
- `arrow-down` - Down arrow
- `arrow-left` - Left arrow
- `arrow-right` - Right arrow
- `chevron-up` - Chevron up
- `chevron-down` - Chevron down
- `chevron-left` - Chevron left
- `chevron-right` - Chevron right
- `home` - Home icon
- `menu` - Hamburger menu
- `more-horizontal` - Horizontal dots
- `more-vertical` - Vertical dots

### Actions

- `plus` - Add/create
- `minus` - Remove/subtract
- `check` - Confirm/success
- `x` - Close/cancel
- `edit` / `pencil` - Edit
- `trash` / `delete` - Delete
- `copy` - Copy/duplicate
- `download` - Download
- `upload` - Upload
- `refresh` - Refresh/reload
- `save` - Save
- `print` - Print
- `share` - Share
- `external-link` - External link

### Files & Folders

- `file` - Generic file
- `file-text` - Text document
- `folder` - Folder
- `folder-open` - Open folder
- `document` - Document

### Communication

- `mail` / `email` - Email
- `message` - Message/chat
- `bell` - Notification
- `phone` - Phone
- `video` - Video

### User & People

- `user` - Single user
- `users` - Multiple users
- `user-plus` - Add user
- `user-minus` - Remove user
- `user-check` - Verified user

### Settings & Tools

- `settings` / `gear` - Settings
- `wrench` / `tool` - Tools
- `filter` - Filter
- `sort` - Sort
- `search` - Search
- `zoom-in` - Zoom in
- `zoom-out` - Zoom out

### Status & Indicators

- `check-circle` - Success
- `alert-circle` - Alert/warning
- `info` / `info-circle` - Information
- `error` / `x-circle` - Error
- `help` / `help-circle` - Help
- `star` - Star/favorite
- `star-filled` - Filled star
- `flag` - Flag

### Media

- `play` - Play
- `pause` - Pause
- `stop` - Stop
- `skip-forward` - Skip forward
- `skip-back` - Skip back
- `volume` - Volume
- `volume-off` - Mute
- `camera` - Camera
- `image` / `photo` - Image

### Time

- `calendar` - Calendar
- `clock` - Clock/time

### UI Elements

- `eye` - Show/visible
- `eye-off` - Hide/invisible
- `lock` - Locked
- `unlock` - Unlocked
- `link` - Link
- `unlink` - Unlink
- `pin` - Pin
- `unpin` - Unpin

### Layout

- `grid` - Grid view
- `list` - List view
- `columns` - Columns
- `sidebar` - Sidebar
- `maximize` - Maximize
- `minimize` - Minimize

### Code & Development

- `code` - Code
- `terminal` - Terminal
- `git-branch` - Git branch
- `git-commit` - Git commit
- `git-merge` - Git merge
- `git-pull-request` - Pull request

### Charts & Data

- `bar-chart` - Bar chart
- `line-chart` - Line chart
- `pie-chart` - Pie chart
- `trending-up` - Trending up
- `trending-down` - Trending down

### Misc

- `heart` - Heart/like
- `bookmark` - Bookmark
- `tag` - Tag
- `globe` - Globe/world
- `location` / `map-pin` - Location
- `compass` - Compass
- `shield` - Security/protection

## Icon Naming Convention

Saffron icons follow these naming patterns:

- **Descriptive**: Icons use clear, descriptive names (e.g., `search`, `settings`, `user`)
- **Kebab-case**: All icon names use kebab-case (e.g., `arrow-right`, `check-circle`)
- **Variants**: Variants use suffixes (e.g., `star` vs `star-filled`, `eye` vs `eye-off`)

## Size Guidelines

Recommended icon sizes:

- **16px**: Small, inline with text
- **20px**: Default size for most UI elements
- **24px**: Larger UI elements, buttons
- **32px**: Prominent actions, headers
- **48px+**: Large display icons

```tsx
<SafIcon name="user" size="16" /> // Small
<SafIcon name="user" size="20" /> // Default
<SafIcon name="user" size="24" /> // Medium
<SafIcon name="user" size="32" /> // Large
```

## Accessibility

### Icon-Only Buttons

Always provide `aria-label` for icon-only interactive elements:

```tsx
// ✅ Good: Includes aria-label
<SafButton aria-label="Delete item" appearance="ghost">
  <SafIcon name="trash" />
</SafButton>

<SafButton aria-label="Edit" appearance="outline">
  <SafIcon name="pencil" />
</SafButton>

// ❌ Bad: Missing aria-label
<SafButton appearance="ghost">
  <SafIcon name="trash" />
</SafButton>
```

### Decorative Icons

For decorative icons that don't convey meaning, use `aria-hidden`:

```tsx
<SafButton>
  <SafIcon name="plus" aria-hidden="true" />
  Add Item
</SafButton>
```

### Icon with Text

When icon accompanies text, the text provides the label:

```tsx
// Icon is decorative, text provides meaning
<SafButton>
  <SafIcon slot="start" name="download" aria-hidden="true" />
  Download File
</SafButton>
```

## Styling Icons

### Using CSS

```tsx
// Inline styles
<SafIcon name="check" style={{ color: 'green', fontSize: '24px' }} />

// CSS classes
<SafIcon name="warning" className="text-warning" />
```

### Using Design Tokens

```css
.icon-primary {
  color: var(--saf-color-brand-primary);
}

.icon-success {
  color: var(--saf-color-feedback-success);
}

.icon-error {
  color: var(--saf-color-feedback-error);
}
```

```tsx
<SafIcon name="check" className="icon-success" />
<SafIcon name="x" className="icon-error" />
```

## Common Icon Patterns

### Status Indicators

```tsx
// Success
<SafBadge appearance="success">
  <SafIcon slot="start" name="check-circle" />
  Active
</SafBadge>

// Warning
<SafBadge appearance="warning">
  <SafIcon slot="start" name="alert-circle" />
  Pending
</SafBadge>

// Error
<SafBadge appearance="error">
  <SafIcon slot="start" name="x-circle" />
  Failed
</SafBadge>
```

### Action Buttons

```tsx
// Primary actions
<SafButton appearance="primary">
  <SafIcon slot="start" name="plus" />
  Create New
</SafButton>

// Secondary actions
<SafButton appearance="secondary">
  <SafIcon slot="start" name="copy" />
  Duplicate
</SafButton>

// Destructive actions
<SafButton appearance="danger">
  <SafIcon slot="start" name="trash" />
  Delete
</SafButton>
```

### Input Fields

```tsx
// Search field
<SafTextField label="Search">
  <SafIcon slot="prefix" name="search" />
</SafTextField>

// Email field
<SafTextField label="Email" type="email">
  <SafIcon slot="prefix" name="mail" />
</SafTextField>

// Password field with toggle
<SafTextField label="Password" type={showPassword ? "text" : "password"}>
  <SafIcon 
    slot="suffix" 
    name={showPassword ? "eye-off" : "eye"}
    onClick={() => setShowPassword(!showPassword)}
    style={{ cursor: 'pointer' }}
  />
</SafTextField>
```

### Navigation

```tsx
// Menu items
<SafMenu>
  <SafMenuItem>
    <SafIcon slot="start" name="home" />
    Home
  </SafMenuItem>
  <SafMenuItem>
    <SafIcon slot="start" name="settings" />
    Settings
  </SafMenuItem>
  <SafMenuItem>
    <SafIcon slot="start" name="user" />
    Profile
  </SafMenuItem>
</SafMenu>

// Breadcrumbs
<SafBreadcrumb>
  <SafBreadcrumbItem href="/">
    <SafIcon name="home" />
  </SafBreadcrumbItem>
  <SafBreadcrumbItem href="/products">
    Products
  </SafBreadcrumbItem>
</SafBreadcrumb>
```

## Finding Icons

To find available icons:

1. Check the internal Saffron Storybook for complete icon list
2. Browse the icon component documentation
3. Use TypeScript autocomplete when setting the `name` prop
4. Reference this guide for common icon names

```tsx
// TypeScript will provide autocomplete for icon names
<SafIcon name="/* autocomplete will show available icons */" />
```

## Custom Icons

If you need a custom icon not available in Saffron, consult with the Thomson Reuters design team to:

1. Request a new icon to be added to the design system
2. Follow the icon design guidelines
3. Ensure consistency with existing Saffron icons

## Icon Performance

### Best Practices

- Icons are optimized SVGs for performance
- Use appropriate sizes to avoid scaling
- Leverage browser caching by using the same icons consistently
- Avoid using images when Saffron icons are available

## Browser Support

Saffron icons work in all modern browsers:

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

## Examples

### Complete Form with Icons

```tsx
function LoginForm() {
  return (
    <form>
      <SafTextField label="Email" type="email">
        <SafIcon slot="prefix" name="mail" />
      </SafTextField>
      
      <SafTextField label="Password" type="password">
        <SafIcon slot="prefix" name="lock" />
      </SafTextField>
      
      <SafButton type="submit" appearance="primary">
        <SafIcon slot="start" name="arrow-right" />
        Sign In
      </SafButton>
    </form>
  )
}
```

### Icon Grid Display

```tsx
function IconShowcase() {
  const icons = ['home', 'user', 'settings', 'search', 'bell', 'mail']
  
  return (
    <SafLayoutGrid columns={6} gap="medium">
      {icons.map(iconName => (
        <SafLayoutGridItem key={iconName}>
          <SafIcon name={iconName} size="32" />
          <SafText variant="caption">{iconName}</SafText>
        </SafLayoutGridItem>
      ))}
    </SafLayoutGrid>
  )
}
```

This comprehensive icon reference ensures consistent icon usage throughout your Saffron-based applications while maintaining accessibility and user experience standards.
