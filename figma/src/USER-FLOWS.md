# User Flows - MNA Agente de Citas

Visual guide to application flows and user journeys.

## 🗺️ Application Navigation Map

```
                    ┌─────────────────┐
                    │   Landing       │
                    │   (Public)      │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼───────┐         ┌──────▼───────┐
         │    Login     │◄────────┤   Register   │
         └──────┬───────┘         └──────────────┘
                │
                │ (Authentication Successful)
                │
         ┌──────▼───────┐
         │   Dashboard  │◄────┐
         │   (Main Hub) │     │
         └──────┬───────┘     │
                │              │
    ┌───────────┼──────────────┼──────────┐
    │           │              │          │
┌───▼───┐  ┌───▼───┐    ┌────▼────┐  ┌──▼──────┐
│ Citas │  │ Cita  │    │ Command │  │Settings │
│ List  │  │Detail │    │ Center  │  └─────────┘
└───┬───┘  └───┬───┘    └─────────┘
    │          │
    └──────────┤
               │
        ┌──────▼──────┐
        │  Cita Form  │
        │ (Create/Edit)│
        └─────────────┘
```

---

## 📝 User Journeys

### Journey 1: New User Registration

```
1. Land on App
   └─> Shows Login screen
   
2. Click "Regístrate aquí"
   └─> Navigate to Register screen
   
3. Fill Registration Form
   ├─> Nombre completo
   ├─> Correo electrónico
   ├─> Contraseña
   └─> Confirmar contraseña
   
4. Click "Crear cuenta"
   └─> Validation checks
       ├─> Success: Navigate to Login
       │   └─> Show success toast
       └─> Error: Show inline errors
   
5. Enter credentials on Login
   └─> Click "Iniciar sesión"
   
6. Authenticated
   └─> Navigate to Dashboard
   └─> Show welcome toast
```

**Success Criteria:**
- ✅ Account created
- ✅ Redirected to login
- ✅ Success message shown
- ✅ Can log in immediately

**Error States:**
- Email already exists
- Password too short
- Passwords don't match
- Invalid email format

---

### Journey 2: Create Appointment (Form Method)

```
1. User on Dashboard
   └─> Sees "Crear cita" button
   
2. Click "Crear cita"
   └─> Modal opens with form
   
3. Fill Cita Form
   ├─> Título (required)
   ├─> Fecha (required, date picker)
   ├─> Hora (required, time picker)
   ├─> Lugar (required)
   └─> Descripción (optional)
   
4. Click "Crear cita"
   └─> Validation
       ├─> Success:
       │   ├─> API call to create
       │   ├─> Modal closes
       │   ├─> Success toast
       │   └─> Dashboard refreshes
       └─> Error:
           └─> Show inline errors
           
5. New Cita Appears
   ├─> In upcoming appointments list
   └─> In calendar (date indicator)
```

**Success Criteria:**
- ✅ Appointment created
- ✅ Appears in dashboard
- ✅ Calendar updated
- ✅ Success feedback shown

**Error States:**
- Missing required fields
- Invalid date/time format
- API error

---

### Journey 3: Create Appointment (Natural Language)

```
1. User on Dashboard
   └─> Click "Centro de comandos"
   
2. Command Composer Opens
   └─> Shows textarea and suggestions
   
3. Type Natural Language Command
   Example: "Agendar cita con el dentista el martes a las 4pm"
   
   OR
   
   Click Suggested Command
   └─> Populates textarea
   
4. Press Cmd/Ctrl+Enter OR Click "Procesar"
   └─> API processes command
       ├─> Success:
       │   └─> Shows interpretation preview
       │       ├─> Mensaje: "Interpretación..."
       │       └─> Resultado: Parsed cita data
       └─> Error:
           └─> Show error message
           
5. Review Interpretation
   └─> Preview card shows:
       ├─> Título
       ├─> Fecha y hora
       ├─> Lugar
       └─> Descripción
       
6. Click "Confirmar"
   └─> Creates cita
   └─> Success toast
   └─> Dashboard refreshes
   
   OR
   
   Click "Cancelar"
   └─> Clear command and result
```

**Success Criteria:**
- ✅ Command interpreted correctly
- ✅ User can preview before confirming
- ✅ Appointment created on confirm
- ✅ User can cancel and try again

**Error States:**
- Cannot parse command
- Ambiguous date/time
- API error

---

### Journey 4: View and Edit Appointment

```
1. User on Dashboard or Citas List
   └─> Sees list of appointments
   
2. Click on Cita Card
   └─> Navigate to Cita Detail
   
3. Cita Detail Page Shows
   ├─> Full title
   ├─> Date and time (formatted)
   ├─> Location
   ├─> Description
   ├─> Status badge (Próxima/Pasada)
   └─> Action buttons (Edit, Delete, Share)
   
4. Click "Editar"
   └─> Modal opens with pre-filled form
   
5. Modify Fields
   └─> Change any field
   
6. Click "Guardar cambios"
   └─> Validation
       ├─> Success:
       │   ├─> API updates cita
       │   ├─> Modal closes
       │   ├─> Detail page refreshes
       │   └─> Success toast
       └─> Error:
           └─> Show inline errors
```

**Success Criteria:**
- ✅ Can view full details
- ✅ Can edit any field
- ✅ Changes saved
- ✅ Updated data shown

**Error States:**
- Validation errors
- API error
- Concurrent modification

---

### Journey 5: Delete Appointment

```
1. User on Cita Detail or Card
   └─> Click "Eliminar" or trash icon
   
2. Confirmation Dialog
   └─> "¿Estás seguro de que quieres eliminar '{título}'?"
   
3. User Confirms
   └─> API deletes cita
       ├─> Success:
       │   ├─> Navigate back to Dashboard/List
       │   ├─> Success toast
       │   └─> List refreshes (cita removed)
       └─> Error:
           └─> Error toast
           └─> Stay on page
           
   OR
   
   User Cancels
   └─> Stay on page
   └─> No action
```

**Success Criteria:**
- ✅ Confirmation required
- ✅ Appointment deleted
- ✅ User redirected
- ✅ Feedback shown

**Error States:**
- API error
- Already deleted (404)

---

### Journey 6: Search and Filter Appointments

```
1. User on Citas List
   └─> Sees search bar and filters
   
2. Enter Search Query
   └─> Type in search field
   └─> Real-time filter
       └─> Searches: título, lugar, descripción
       
   OR
   
   Select Date Filter
   └─> Pick date from date input
   └─> Shows only citas for that date
   
3. Results Update
   └─> Shows "X of Y citas"
   └─> Filtered list displays
   
4. Switch View Mode
   ├─> Grid view (cards)
   └─> List view (compact)
   
5. Click "Limpiar" (if date filter active)
   └─> Removes date filter
   └─> Shows all citas
```

**Success Criteria:**
- ✅ Search works in real-time
- ✅ Date filter works
- ✅ Can combine search + date
- ✅ Can clear filters
- ✅ Results count shown

---

### Journey 7: Update Profile

```
1. User on any authenticated page
   └─> Click avatar in header
   
2. Dropdown Menu Opens
   └─> Click "Configuración"
   
3. Settings Page Loads
   └─> Shows profile form
       ├─> Nombre completo (editable)
       ├─> Correo electrónico (editable)
       └─> Account info (read-only)
       
4. Edit Fields
   └─> Modify name or email
   
5. Click "Guardar cambios"
   └─> Validation
       ├─> Success:
       │   ├─> API updates user
       │   ├─> Success message shown
       │   ├─> Header updates with new name
       │   └─> Form shows updated data
       └─> Error:
           └─> Show error message
```

**Success Criteria:**
- ✅ Can update name
- ✅ Can update email
- ✅ Changes reflected immediately
- ✅ Success feedback shown

**Error States:**
- Invalid email format
- Email already in use
- API error

---

### Journey 8: Logout

```
1. User on any authenticated page
   └─> Click avatar in header
   
2. Dropdown Menu Opens
   └─> Click "Cerrar sesión"
   
3. Logout Process
   ├─> API call to logout endpoint
   ├─> Clear token from localStorage
   ├─> Clear user data
   └─> Navigate to Login screen
   
4. Login Screen Shows
   └─> Success toast: "Sesión cerrada"
```

**Success Criteria:**
- ✅ User logged out
- ✅ Token cleared
- ✅ Redirected to login
- ✅ Cannot access protected pages

---

## 🔄 State Transitions

### Authentication States

```
┌─────────────┐
│ Unauthenticated │
└──────┬──────┘
       │
       │ Register + Login
       │
       ▼
┌─────────────┐
│Authenticated│
└──────┬──────┘
       │
       │ Logout OR Token Expire
       │
       ▼
┌─────────────┐
│Unauthenticated│
└─────────────┘
```

### Cita States

```
┌─────────────┐
│   Draft     │ (Form being filled)
└──────┬──────┘
       │
       │ Submit
       │
       ▼
┌─────────────┐
│   Created   │ (Exists in DB)
└──────┬──────┘
       │
       ├─> Edit ──> Modified
       │
       └─> Delete ──> Deleted (removed)
```

### Command Processing States

```
┌─────────────┐
│    Idle     │ (Waiting for input)
└──────┬──────┘
       │
       │ Type command
       │
       ▼
┌─────────────┐
│   Ready     │ (Command entered)
└──────┬──────┘
       │
       │ Process
       │
       ▼
┌─────────────┐
│ Processing  │ (API call)
└──────┬──────┘
       │
       ├─> Success ──> Preview
       │               └─> Confirm ──> Created
       │               └─> Cancel ──> Idle
       │
       └─> Error ──> Error State
                     └─> Retry ──> Processing
```

---

## 📱 Responsive Behavior

### Mobile (< 768px)

```
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │  Header (Stack) │ │
│ │  Logo | Avatar  │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Quick Actions   │ │
│ │  (Stacked)      │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Upcoming Citas  │ │
│ │  (List)         │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Calendar        │ │
│ │  (Below)        │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### Tablet (768px - 1024px)

```
┌───────────────────────────────┐
│ ┌───────────────────────────┐ │
│ │  Header (Horizontal)      │ │
│ │  Logo  |  Name  | Avatar  │ │
│ └───────────────────────────┘ │
│                               │
│ ┌─────────────┬─────────────┐ │
│ │Quick Actions│             │ │
│ │  (2 cols)   │             │ │
│ └─────────────┴─────────────┘ │
│                               │
│ ┌────────────────┬──────────┐ │
│ │ Upcoming Citas │ Calendar │ │
│ │   (60%)        │  (40%)   │ │
│ └────────────────┴──────────┘ │
└───────────────────────────────┘
```

### Desktop (> 1024px)

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │  Header (Full)                          │ │
│ │  Logo | Search | Name + Avatar          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌───────────┬──────────┬──────────┐        │
│ │   Quick   │  Actions │  (3col)  │        │
│ └───────────┴──────────┴──────────┘        │
│                                             │
│ ┌─────────────────────────┬───────────────┐ │
│ │                         │               │ │
│ │   Upcoming Citas        │   Calendar    │ │
│ │   (Grid 2 cols)         │   (Sidebar)   │ │
│ │                         │               │ │
│ │                         │               │ │
│ └─────────────────────────┴───────────────┘ │
│                                             │
│           Max Width: 1200px                 │
└─────────────────────────────────────────────┘
```

---

## 🎯 Key Interaction Patterns

### 1. Form Submission

```
User fills form
    ↓
Clicks submit
    ↓
Frontend validation
    ├─> Invalid: Show errors
    │           ↓
    │        User fixes
    │           ↓
    │        Try again
    │
    └─> Valid: Disable form
                ↓
             API call
                ├─> Success: Close modal + toast
                │             ↓
                │          Refresh data
                │
                └─> Error: Show error + enable form
                             ↓
                          User retries
```

### 2. Delete Confirmation

```
User clicks delete
    ↓
Confirmation prompt
    ├─> Cancel: No action
    │
    └─> Confirm: API call
                    ├─> Success: Remove from UI + toast
                    │
                    └─> Error: Show error toast
```

### 3. Real-time Search

```
User types in search
    ↓
On each keystroke
    ↓
Filter local data
    ↓
Update results display
    ↓
Show count "X of Y"
```

### 4. Modal Flow

```
Trigger action
    ↓
Modal opens
    ├─> Focus first input
    ├─> Trap keyboard focus
    └─> Add backdrop
    
User interacts
    ├─> Submit: Process + close
    ├─> Cancel: Close
    └─> Escape: Close
    
Modal closes
    └─> Return focus to trigger
```

---

## 🔍 Error Handling Flows

### API Error

```
API call fails
    ↓
Catch error
    ├─> 401 Unauthorized
    │   └─> Clear session
    │       └─> Redirect to login
    │
    ├─> 404 Not Found
    │   └─> Show "Not found" message
    │       └─> Redirect to list
    │
    ├─> 500 Server Error
    │   └─> Show generic error
    │       └─> Suggest retry
    │
    └─> Network Error
        └─> Show connection error
            └─> Suggest check connection
```

### Validation Error

```
User submits form
    ↓
Validation fails
    ↓
For each error
    ├─> Highlight field (red border)
    ├─> Show error message below
    └─> Keep focus on first error
    
User fixes
    ↓
Error clears for that field
    ↓
Try submit again
```

---

## ✅ Success Feedback Patterns

```
Action completed
    ↓
Immediate feedback
    ├─> Toast notification
    │   ├─> Success: Green with checkmark
    │   ├─> Error: Red with X
    │   └─> Info: Blue with i
    │
    ├─> UI updates
    │   ├─> Add to list
    │   ├─> Remove from list
    │   └─> Update in place
    │
    └─> Visual confirmation
        ├─> Badge changes
        ├─> Count updates
        └─> State indicators
```

---

## 🎨 Visual Feedback States

```
Default → Hover → Active → Disabled
   │        │        │         │
   ↓        ↓        ↓         ↓
Normal   Lighter  Pressed   Muted
Color    Shadow   Inset     Opacity
```

**Button States:**
- Default: Normal colors
- Hover: Opacity 80%
- Active: Scale 98%
- Disabled: Opacity 50%, not interactive
- Loading: Spinner + disabled

**Input States:**
- Default: Gray border
- Focus: Primary border + ring
- Error: Red border
- Disabled: Gray background
- Filled: Normal appearance

---

This user flows document provides a comprehensive map of how users interact with the MNA application across all features and states.

**Last Updated:** November 9, 2025
