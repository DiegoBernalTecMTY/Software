# Agente de Citas Component Specification

This document details all custom components in the Agente inteligente para agendar citas personales application, their props, variants, and usage guidelines.

## Table of Contents

1. [Header](#header)
2. [CitaCard](#citacard)
3. [CitaForm](#citaform)
4. [CommandComposer](#commandcomposer)
5. [CompactCalendar](#compactcalendar)

---

## Header

**Location:** `/components/Header.tsx`

Global application header with branding, user info, and account menu.

### Props

```typescript
interface HeaderProps {
  user: Usuario | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}
```

### Features

- **Logo & Branding:** Calendar icon with "Agente de Citas" text
- **User Avatar:** Shows user initials with dropdown menu
- **Navigation:** Quick access to dashboard, settings, and logout
- **Responsive:** User email hidden on mobile

### Usage

```tsx
<Header 
  user={currentUser} 
  onNavigate={handleNavigate} 
  onLogout={handleLogout} 
/>
```

### Accessibility

- ARIA labels on icon-only buttons
- Keyboard navigation for dropdown menu
- Focus trap within dropdown

---

## CitaCard

**Location:** `/components/CitaCard.tsx`

Displays appointment information in card format with actions.

### Props

```typescript
interface CitaCardProps {
  cita: Cita;
  onEdit?: (cita: Cita) => void;
  onDelete?: (cita: Cita) => void;
  onClick?: (cita: Cita) => void;
  variant?: 'default' | 'compact';
}
```

### Variants

#### Default

Full card with all details:
- Large title
- Date, time, location
- Description
- Status badges (Próxima/Pasada)
- Action menu (edit/delete)

```tsx
<CitaCard 
  cita={cita}
  variant="default"
  onClick={handleClick}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

#### Compact

Streamlined list view:
- Date badge (month + day)
- Title and time
- Location
- Status badge

```tsx
<CitaCard 
  cita={cita}
  variant="compact"
  onClick={handleClick}
/>
```

### States

- **Upcoming:** Primary badge, displayed when cita is in the future
- **Past:** Secondary badge, displayed when cita has passed
- **Hover:** Border color changes, shadow increases

### Accessibility

- Semantic HTML (button for actions, proper headings)
- ARIA labels for icon-only actions
- Keyboard accessible action menu

---

## CitaForm

**Location:** `/components/CitaForm.tsx`

Modal form for creating and editing appointments.

### Props

```typescript
interface CitaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Cita>) => Promise<void>;
  initialData?: Cita | null;
  mode?: 'create' | 'edit';
}
```

### Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| titulo | text | Yes | Not empty |
| fecha | date | Yes | Valid date format (YYYY-MM-DD) |
| hora_inicio | time | Yes | Valid time format (HH:MM) |
| lugar | text | Yes | Not empty |
| descripcion | textarea | No | None |

### Modes

#### Create

```tsx
<CitaForm
  open={showCreateForm}
  onClose={() => setShowCreateForm(false)}
  onSubmit={handleCreate}
  mode="create"
/>
```

#### Edit

```tsx
<CitaForm
  open={showEditForm}
  onClose={() => setShowEditForm(false)}
  onSubmit={handleUpdate}
  initialData={selectedCita}
  mode="edit"
/>
```

### Validation

- Real-time validation on submit
- Inline error messages below each field
- Required fields marked with red asterisk
- Submit button disabled during submission

### States

- **Default:** All fields enabled
- **Submitting:** All fields disabled, button shows "Guardando..."
- **Error:** Red border on invalid fields, error text below
- **Success:** Modal closes, parent handles success feedback

### Accessibility

- Proper label-input associations
- Error messages linked with aria-describedby
- Focus management (first field on open, return on close)
- Escape key closes modal

---

## CommandComposer

**Location:** `/components/CommandComposer.tsx`

Natural language command interface for creating appointments.

### Props

```typescript
interface CommandComposerProps {
  onProcess: (texto: string) => Promise<CommandResponse>;
  onConfirm?: (result: any) => void;
}
```

### Features

1. **Command Input:**
   - Multi-line textarea
   - Keyboard shortcut (Cmd/Ctrl + Enter to submit)
   - Character count/guidance
   - Voice input button (microphone icon)

2. **Voice Input (NEW):**
   - Speech-to-text using Web Speech API
   - Visual indicator when listening (pulsing red button)
   - Real-time transcription to textarea
   - Support for Spanish (es-ES)
   - Browser compatibility: Chrome, Edge, Safari (limited)
   - Error handling for permissions and unsupported browsers
   - See [VOICE-AI-INTEGRATION.md](./VOICE-AI-INTEGRATION.md) for AI agent integration

3. **Suggested Commands:**
   - Pre-written example commands
   - Click to populate input
   - Contextual to common actions

4. **Result Preview:**
   - Shows interpreted command
   - Preview of created cita
   - Confirm/Cancel actions

5. **Error Handling:**
   - Clear error messages
   - Retry button
   - Suggestions for correction
   - Voice-specific errors (no microphone, permission denied, etc.)

### Usage Flow

```tsx
<CommandComposer
  onProcess={async (text) => {
    return await api.command.process(text);
  }}
  onConfirm={(result) => {
    // Create the cita from result
    createCita(result);
  }}
/>
```

### States

- **Idle:** Empty input with suggestions, microphone button available
- **Listening:** Voice input active, pulsing red microphone button, textarea disabled
- **Processing:** Disabled input, loading indicator with spinner
- **Preview:** Shows interpretation with confirm button
- **Error:** Red alert with error message

### Accessibility

- Textarea properly labeled
- Keyboard shortcuts documented in UI
- Focus management through flow
- Error announcements
- Voice button has title attribute for tooltip
- Visual feedback for listening state (animation + text)
- Clear microphone permission requests

---

## CompactCalendar

**Location:** `/components/CompactCalendar.tsx`

Mini calendar widget showing current month with event indicators.

### Props

```typescript
interface CompactCalendarProps {
  citas: Cita[];
  onDateClick?: (date: Date) => void;
}
```

### Features

- **Month Navigation:** Previous/next buttons
- **Event Indicators:** Dots below days with citas
- **Today Highlight:** Primary color background
- **Interactive:** Click days to filter/navigate

### Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| Primary background | Today's date |
| Small dots (1-3) | Days with appointments |
| Badge with number | Today with appointments (shows count) |

### Usage

```tsx
<CompactCalendar
  citas={allCitas}
  onDateClick={(date) => {
    // Navigate to citas list filtered by date
    navigateToCitas({ date: date.toISOString() });
  }}
/>
```

### Accessibility

- Semantic table structure for calendar grid
- ARIA labels for navigation buttons
- Keyboard navigation (arrow keys recommended for future enhancement)
- Clear visual distinction for today

---

## ShadCN Components

The application uses ShadCN components from `/components/ui/`. Key components:

### Button

```tsx
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Delete</Button>
```

### Card

```tsx
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

### Dialog (Modal)

```tsx
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

### Input

```tsx
<Label htmlFor="field">Label</Label>
<Input 
  id="field"
  type="text"
  placeholder="Placeholder"
  value={value}
  onChange={handleChange}
/>
```

### Dropdown Menu

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Badge

```tsx
<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Error</Badge>
```

### Alert

```tsx
<Alert>
  <AlertDescription>Message</AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertDescription>Error message</AlertDescription>
</Alert>
```

### Skeleton

For loading states:

```tsx
<Skeleton className="h-24 w-full" />
```

---

## Icons

**Library:** Lucide React

**Common Icons:**
- `Calendar` - Dates, appointments
- `Clock` - Time
- `MapPin` - Location
- `User` - User profile
- `Settings` - Settings/configuration
- `Plus` - Create actions
- `Edit` - Edit actions
- `Trash2` - Delete actions
- `Search` - Search functionality
- `List` - List view
- `LayoutGrid` - Grid view
- `Sparkles` - AI/NLP features
- `LogOut` - Logout
- `ChevronLeft/Right` - Navigation
- `MoreVertical` - More options menu

**Usage:**

```tsx
import { Calendar } from 'lucide-react';

<Calendar className="h-4 w-4" /> // Small (16px)
<Calendar className="h-5 w-5" /> // Medium (20px)
<Calendar className="h-6 w-6" /> // Large (24px)
```

---

## Design Patterns

### Loading States

Use Skeleton components:

```tsx
{isLoading ? (
  <Skeleton className="h-24 w-full" />
) : (
  <CitaCard cita={cita} />
)}
```

### Empty States

Use Alert component:

```tsx
{items.length === 0 && (
  <Alert>
    <Calendar className="h-4 w-4" />
    <AlertDescription>
      No hay citas disponibles.
    </AlertDescription>
  </Alert>
)}
```

### Error States

Use Alert with destructive variant:

```tsx
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

### Success Feedback

Use toast notifications:

```tsx
import { toast } from 'sonner@2.0.3';

toast.success('Operación exitosa');
toast.error('Error al procesar');
```

---

## Best Practices

### Component Composition

1. **Keep components focused:** Each component has a single responsibility
2. **Use composition:** Combine smaller components to build complex UIs
3. **Props over state:** Pass data down, events up
4. **TypeScript:** All props interfaces defined

### State Management

1. **Local state:** Use useState for UI-only state
2. **Shared state:** Lift state to App.tsx
3. **API state:** Centralized in App.tsx with refresh mechanism

### Error Handling

1. **Try-catch:** Wrap all async operations
2. **User feedback:** Show error messages via toast
3. **Validation:** Frontend validation before API calls
4. **Graceful degradation:** Show meaningful fallbacks

### Performance

1. **Conditional rendering:** Don't render hidden content
2. **Key props:** Use unique IDs for list items
3. **Memo:** Consider React.memo for expensive components
4. **Lazy loading:** Could implement code splitting for routes

---

## Future Enhancements

Recommended additions for future versions:

1. **Animations:** Add motion/react for transitions
2. **Real-time:** WebSocket support for live updates
3. **Offline:** Service worker for offline capability
4. **Attachments:** File upload support
5. **Reminders:** Push notification integration
6. **Calendar sync:** iCal/Google Calendar integration
7. **Recurring:** Support for recurring appointments
8. **Multi-user:** Shared appointments and invitations

---

**Last Updated:** November 9, 2025
