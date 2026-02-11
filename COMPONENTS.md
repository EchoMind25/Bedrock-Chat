# UI Component Library Documentation

Comprehensive UI component library for Bedrock Chat with 2026 design aesthetics.

## Table of Contents

- [Glass Components](#glass-components)
- [Button](#button)
- [Input](#input)
- [Avatar](#avatar)
- [Badge](#badge)
- [Card](#card)
- [Modal](#modal)
- [Toast](#toast)
- [Toggle](#toggle)
- [Tooltip](#tooltip)
- [Dropdown](#dropdown)

## Quick Start

```tsx
import {
  Button,
  Input,
  Card,
  Modal,
  toast,
} from "@/components/ui";

function MyComponent() {
  return (
    <Card>
      <Button onClick={() => toast.success("Hello!")}>
        Click me
      </Button>
    </Card>
  );
}
```

## Glass Components

Foundational glass morphism components with blur effects.

### Glass

```tsx
import { Glass, GlassCard, GlassPanel } from "@/components/ui";

<Glass variant="medium" border="light">
  Content
</Glass>

<GlassCard variant="strong">
  Card with padding
</GlassCard>

<GlassPanel border="medium">
  Panel with more padding
</GlassPanel>
```

**Props:**
- `variant`: "light" | "medium" | "strong" (default: "medium")
- `border`: "none" | "light" | "medium" | "strong" (default: "light")

## Button

Button with variants, loading state, and hover animations.

```tsx
<Button variant="primary" loading={false}>
  Click me
</Button>
```

**Props:**
- `variant`: "primary" | "secondary" | "danger" | "ghost" (default: "primary")
- `size`: "sm" | "md" | "lg" (default: "md")
- `loading`: boolean (default: false)

## Input

Input and Textarea with animated focus border.

```tsx
<Input
  label="Email"
  type="email"
  error="Invalid email"
  helperText="We'll never share your email"
/>

<Textarea
  label="Message"
  rows={4}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

## Avatar

Avatar with image fallback and animated status indicator.

```tsx
<Avatar
  src="/path/to/image.jpg"
  fallback="JD"
  status="online"
  size="md"
/>

<AvatarGroup max={3}>
  <Avatar fallback="A" />
  <Avatar fallback="B" />
  <Avatar fallback="C" />
  <Avatar fallback="D" />
</AvatarGroup>
```

**Props:**
- `src`: string
- `fallback`: string (initials)
- `status`: "online" | "offline" | "busy" | "away"
- `size`: "xs" | "sm" | "md" | "lg" | "xl" (default: "md")

## Badge

Badge with variants and optional pulse animation.

```tsx
<Badge variant="success" pulse>
  Online
</Badge>

<NotificationBadge count={5} max={99} />
```

**Props:**
- `variant`: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "outline"
- `pulse`: boolean (default: false)

## Card

Card with Glass container and 3D tilt hover effect.

```tsx
<Card tilt hoverable>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Footer
  </CardFooter>
</Card>
```

**Props:**
- `variant`: GlassVariant (default: "medium")
- `border`: GlassBorder (default: "light")
- `tilt`: boolean (default: true)
- `hoverable`: boolean (default: false)

## Modal

Modal with focus trap, AnimatePresence, and keyboard navigation.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  description="Modal description"
  footer={<Button>Save</Button>}
>
  Modal content
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `description`: string
- `footer`: ReactNode
- `size`: "sm" | "md" | "lg" | "xl" | "full" (default: "md")
- `closeOnOverlay`: boolean (default: true)
- `closeOnEscape`: boolean (default: true)

## Toast

Zustand-managed toast system with swipe dismiss and progress bar.

```tsx
import { toast, ToastContainer } from "@/components/ui";

// In your layout/app component
<ToastContainer />

// Show toasts
toast.success("Success!", "Operation completed");
toast.error("Error!", "Something went wrong");
toast.warning("Warning!", "Be careful");
toast.info("Info", "Did you know?");

// Custom toast
toast.show({
  title: "Custom",
  description: "Custom toast",
  variant: "default",
  duration: 5000,
});
```

**Methods:**
- `toast.success(title, description?)`
- `toast.error(title, description?)`
- `toast.warning(title, description?)`
- `toast.info(title, description?)`
- `toast.show({ title, description, variant, duration })`

## Toggle

Toggle with liquid fill animation.

```tsx
<Toggle
  label="Enable notifications"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
  size="md"
/>

<ToggleGroup
  items={[
    { id: "1", label: "Option 1", checked: true },
    { id: "2", label: "Option 2", checked: false },
  ]}
  onChange={(id, checked) => console.log(id, checked)}
/>
```

**Props:**
- `label`: string
- `checked`: boolean
- `size`: "sm" | "md" | "lg" (default: "md")

## Tooltip

Tooltip with positions and 500ms delay.

```tsx
<Tooltip content="Helpful text" position="top" delay={500}>
  <Button>Hover me</Button>
</Tooltip>

<TooltipIcon content="More information" />
```

**Props:**
- `content`: ReactNode
- `position`: "top" | "bottom" | "left" | "right" (default: "top")
- `delay`: number (default: 500ms)

## Dropdown

Dropdown with keyboard navigation and search filter.

```tsx
const items = [
  { id: "1", label: "Option 1", value: "opt1" },
  { id: "2", label: "Option 2", value: "opt2" },
];

<Dropdown
  items={items}
  value={value}
  onSelect={setValue}
  searchable
  placeholder="Select option"
/>
```

**Props:**
- `items`: DropdownItem[]
- `value`: string
- `onSelect`: (value: string) => void
- `searchable`: boolean (default: false)
- `placeholder`: string

**Keyboard Navigation:**
- `↓` / `↑`: Navigate items
- `Enter`: Select item
- `Escape`: Close dropdown
- `Home` / `End`: Jump to first/last item

## Design Patterns

### React 19 Patterns

All components follow 2026 React best practices:

- ✅ Refs as props (no forwardRef)
- ✅ No unnecessary useMemo/useCallback
- ✅ React Compiler handles optimizations

### Animations

All animations use motion/react (Motion 12.x) at 60fps:

```tsx
import { motion } from "motion/react";
import { fadeIn, slideUp, scaleIn } from "@/lib/utils/animations";

<motion.div variants={fadeIn} initial="initial" animate="animate">
  Animated content
</motion.div>
```

### Accessibility

All components include:

- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support

## Customization

### Tailwind CSS 4

All styles use CSS-first configuration with @theme directive:

```css
@theme {
  --color-primary: oklch(0.65 0.25 265);
  --radius-md: 0.5rem;
}
```

### Class Names

Use the `cn` utility for merging classes:

```tsx
import { cn } from "@/lib/utils/cn";

<div className={cn("base-classes", className)} />
```

## Demo

Visit [/demo](http://localhost:3000/demo) to see all components in action.
