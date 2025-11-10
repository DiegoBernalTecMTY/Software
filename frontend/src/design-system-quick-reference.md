# Design System Quick Reference

Quick copy-paste reference for developers implementing new features.

## 🎨 Colors

```tsx
// Primary Actions
className="bg-primary text-primary-foreground"
className="border-primary text-primary"

// Secondary Actions  
className="bg-secondary text-secondary-foreground"

// Status Colors
className="text-success"    // #2FAF9B
className="text-error"      // #E45A5A
className="text-destructive" // Same as error

// Backgrounds
className="bg-background"   // Page background #F6F7FB
className="bg-card"         // Card surface #FFFFFF

// Text
className="text-foreground"       // Primary text #0B2440
className="text-muted-foreground" // Secondary text #51666A
```

## 📏 Spacing

```tsx
// Gaps
className="gap-2"   // 8px
className="gap-3"   // 12px
className="gap-4"   // 16px
className="gap-6"   // 24px

// Padding
className="p-4"     // 16px all sides
className="p-6"     // 24px all sides
className="px-4"    // 16px horizontal
className="py-4"    // 16px vertical

// Margin
className="mb-6"    // 24px bottom
className="mt-4"    // 16px top
```

## 🔤 Typography

Don't use Tailwind font size classes - they're defined in globals.css!

```tsx
// Use semantic HTML
<h1>Page Title</h1>        // 32px
<h2>Section Heading</h2>   // 24px
<h3>Card Title</h3>        // 18px
<p>Body text</p>           // 16px

// Only use text size for special cases
className="text-sm"        // 14px
className="text-xs"        // 13px
```

## 🔘 Buttons

```tsx
import { Button } from './components/ui/button';

// Primary
<Button>Primary Action</Button>
<Button variant="default">Primary Action</Button>

// Secondary
<Button variant="outline">Secondary Action</Button>

// Tertiary
<Button variant="ghost">Tertiary Action</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Create
</Button>
```

## 📇 Cards

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

## 🏷️ Badges

```tsx
import { Badge } from './components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Error</Badge>
```

## 📝 Forms

```tsx
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';

// Input
<div className="space-y-2">
  <Label htmlFor="field">Label</Label>
  <Input 
    id="field"
    type="text"
    placeholder="Placeholder"
    value={value}
    onChange={handleChange}
  />
  {error && <p className="text-xs text-destructive">{error}</p>}
</div>

// Textarea
<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    rows={3}
    value={value}
    onChange={handleChange}
  />
</div>

// Date input
<Input type="date" value={date} onChange={handleChange} />

// Time input
<Input type="time" value={time} onChange={handleChange} />
```

## 🔔 Toasts

```tsx
import { toast } from 'sonner@2.0.3';

// Success
toast.success('Operación exitosa');

// Error
toast.error('Error al procesar');

// Info
toast.info('Información importante');

// Warning
toast.warning('Advertencia');

// With details
toast.success('Cita creada', {
  description: '15 Nov, 16:00',
});
```

## 🪟 Modals

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

## 📋 Dropdown Menus

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="mr-2 h-4 w-4" />
      Editar
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 🚨 Alerts

```tsx
import { Alert, AlertDescription } from './components/ui/alert';

// Info
<Alert>
  <AlertDescription>Mensaje informativo</AlertDescription>
</Alert>

// Error
<Alert variant="destructive">
  <AlertDescription>Mensaje de error</AlertDescription>
</Alert>

// With icon
<Alert>
  <Calendar className="h-4 w-4" />
  <AlertDescription>Mensaje con icono</AlertDescription>
</Alert>
```

## 💀 Skeleton Loaders

```tsx
import { Skeleton } from './components/ui/skeleton';

// Loading card
<Skeleton className="h-24 w-full" />

// Loading list
<div className="space-y-3">
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
</div>
```

## 🎯 Icons

```tsx
import { 
  Calendar, Clock, MapPin, User, Settings,
  Plus, Edit, Trash2, Search, List, 
  LayoutGrid, Sparkles, LogOut, ChevronLeft,
  ChevronRight, MoreVertical
} from 'lucide-react';

// Sizes
<Calendar className="h-4 w-4" /> // 16px - small
<Calendar className="h-5 w-5" /> // 20px - medium  
<Calendar className="h-6 w-6" /> // 24px - large

// With color
<Calendar className="h-4 w-4 text-primary" />
<Calendar className="h-4 w-4 text-muted-foreground" />
```

## 📱 Responsive Grid

```tsx
// Stack on mobile, 2 cols on tablet, 3 on desktop
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>

// Flex that stacks
<div className="flex flex-col gap-4 md:flex-row">
  <div className="flex-1">Left</div>
  <div className="flex-1">Right</div>
</div>
```

## 🎭 Conditional Rendering

```tsx
// Loading state
{isLoading ? (
  <Skeleton className="h-24 w-full" />
) : (
  <Content />
)}

// Empty state
{items.length === 0 ? (
  <Alert>
    <AlertDescription>No hay elementos</AlertDescription>
  </Alert>
) : (
  <ItemsList items={items} />
)}

// Error state
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

## 🎨 Custom Component Pattern

```tsx
// Component file structure
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface MyComponentProps {
  data: MyData;
  onAction: (id: string) => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  const [localState, setLocalState] = useState(false);
  
  return (
    <Card>
      {/* Component content */}
    </Card>
  );
}
```

## 📐 Layout Patterns

```tsx
// Page container
<div className="min-h-screen bg-background">
  <div className="mx-auto max-w-[1200px] p-4 md:p-6">
    {/* Content */}
  </div>
</div>

// Section spacing
<div className="space-y-6">
  <Section1 />
  <Section2 />
  <Section3 />
</div>

// Card grid
<div className="grid gap-4 md:grid-cols-2">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</div>
```

## ♿ Accessibility Quick Tips

```tsx
// Icon-only button
<Button aria-label="Editar cita">
  <Edit className="h-4 w-4" />
</Button>

// Screen reader only text
<span className="sr-only">Descripción para lectores de pantalla</span>

// Loading state
<div aria-busy="true">
  <Skeleton />
</div>

// Form label association
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// Required field
<Label htmlFor="title">
  Título <span className="text-destructive">*</span>
</Label>
```

## 🎬 Animation Classes

```tsx
// Hover states (transition already applied)
className="hover:bg-primary/10"
className="hover:border-primary"
className="hover:opacity-80"

// Group hover
<div className="group">
  <span className="group-hover:text-primary">Text</span>
</div>
```

## 🔍 Common Patterns

### Action buttons in card

```tsx
<Card className="group">
  <CardHeader className="flex flex-row items-start justify-between">
    <div className="flex-1">
      <CardTitle>Title</CardTitle>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Action</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Filter bar

```tsx
<div className="flex flex-col gap-3 md:flex-row md:items-center">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input placeholder="Buscar..." className="pl-9" />
  </div>
  <div className="flex gap-2">
    <Input type="date" />
    <Button variant="outline">Filtrar</Button>
  </div>
</div>
```

### Status badge

```tsx
{isUpcoming && (
  <Badge variant="default">Próxima</Badge>
)}
{isPast && (
  <Badge variant="secondary">Pasada</Badge>
)}
```

---

## 🚀 Getting Started Template

```tsx
import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { toast } from 'sonner@2.0.3';

interface MyFeatureProps {
  onSubmit: (data: any) => Promise<void>;
}

export function MyFeature({ onSubmit }: MyFeatureProps) {
  const [data, setData] = useState({ field: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(data);
      toast.success('Operación exitosa');
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al procesar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Función</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field">Campo</Label>
            <Input
              id="field"
              value={data.field}
              onChange={(e) => setData({ field: e.target.value })}
              disabled={isLoading}
            />
          </div>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Enviar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

**Last Updated:** November 9, 2025
