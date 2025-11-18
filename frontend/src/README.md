# Agente inteligente para agendar citas personales

A modern, accessible booking and appointments web application with natural language command support.

![Agente de Citas Logo](https://img.shields.io/badge/Agente%20de%20Citas-Inteligente%20y%20Personal-2B7A78?style=for-the-badge)

## ✨ Features

- 🎯 **Intuitive Dashboard** - Overview of upcoming appointments with calendar integration
- 📝 **CRUD Operations** - Create, read, update, and delete appointments
- 🤖 **Natural Language Commands** - Create appointments using conversational language
- 🎤 **Voice Input** - Dictate commands using speech-to-text (supported browsers)
- 🧠 **Personalized AI Agent** - Teach the AI your scheduling preferences and rules for smarter suggestions
- 🔔 **Smart Notifications** - Set reminders and custom messages for appointments
- 🔒 **Secure Account Management** - Change password with strong validation requirements
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- ♿ **Accessible** - WCAG AA compliant with keyboard navigation support
- 🎨 **Modern Design** - Calm teal/blue color scheme with polished UI
- 🇪🇸 **Spanish Interface** - Friendly, professional microcopy in Spanish

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Backend API running at `http://localhost:5000` (Flask proxy + Backendless)

### Running the Application

The application runs in **DEMO MODE** by default with mock data - no backend required!

**Quick Start (Demo Mode):**
1. Launch the application
2. Log in with any email and password (e.g., demo@example.com / password123)
3. Explore all features with simulated data

**Connecting to Real Backend:**
1. Open `/utils/api.ts`
2. Set `USE_MOCK_DATA = false`
3. Update `API_BASE_URL` to your backend endpoint
4. Ensure the backend implements all API endpoints (see `api-examples.md`)

📖 **For detailed information about Demo Mode, see [DEMO-MODE.md](./DEMO-MODE.md)**

### Demo Flow

1. **Register:** Create a new account with name, email, and password
2. **Dashboard:** View your appointments overview and calendar
3. **Create Appointment:** Use the form, natural language command, or voice input
4. **Set Notifications:** Enable reminders with custom messages for any appointment
5. **Notifications Panel:** View all appointments with active reminders on the right sidebar (desktop)
6. **Manage:** Edit, delete, or view appointment details
7. **Settings:** Update your profile, personalize the AI agent, change your password, and manage integrations

### Using Voice Input

The Command Center supports voice dictation:

1. Click the microphone button (🎤) in the text area
2. Allow microphone access when prompted by your browser
3. Speak your command clearly in Spanish (e.g., "Agendar cita con el dentista mañana a las tres")
4. The text will appear automatically as you speak
5. Click "Procesar" to process the command

**Requirements:**
- Supported browsers: Chrome, Edge, Safari (limited support)
- HTTPS connection required for security
- Microphone access permission
- Quiet environment recommended for best accuracy

**Note:** Voice input currently uses browser-based speech recognition. For integration with an AI agent backend, see [VOICE-AI-INTEGRATION.md](./VOICE-AI-INTEGRATION.md)

### Using Notifications

Appointments can have optional notifications/reminders:

- When creating or editing an appointment, toggle "Activar recordatorio"
- Choose when to be notified (15 min, 30 min, 1 hour, 2 hours, or 1 day before)
- Add a custom reminder message (optional)
- Appointments with active notifications appear in the Notifications Panel on the dashboard (desktop view)
- The panel shows upcoming notifications at the top and past ones below

### Personalizing the AI Agent

Teach the agent your scheduling habits and preferences:

- Go to Settings > "Instrucciones para el Agente"
- Add your personal rules, preferences, and scheduling constraints
- Examples:
  - Preferred time slots (e.g., "I prefer morning appointments between 9am-12pm")
  - Recurring commitments (e.g., "Monday 10am is always blocked for team meetings")
  - Buffer time requirements (e.g., "Need 15 minutes between consecutive appointments")
  - Location preferences (e.g., "Medical appointments at Central Hospital")
  - Default reminder times (e.g., "1 hour before medical appointments")
  - Availability restrictions (e.g., "No appointments Friday afternoons")
- The AI agent will use these instructions to provide more intelligent and personalized suggestions

### Account Security

Keep your account secure:

- Go to Settings > "Cambiar contraseña"
- Enter your current password
- Create a new password that meets the requirements:
  - Minimum 8 characters
  - Include uppercase and lowercase letters
  - Include numbers
- Confirm your new password
- Your password will be updated immediately

## 📁 Project Structure

```
/
├── App.tsx                      # Main application with routing
├── components/
│   ├── Header.tsx              # Global header
│   ├── CitaCard.tsx            # Appointment card
│   ├── CitaForm.tsx            # Create/Edit form
│   ├── CommandComposer.tsx     # Natural language interface
│   ├── CompactCalendar.tsx     # Mini calendar
│   ├── NotificationsPanel.tsx  # Notifications sidebar
│   └── ui/                     # ShadCN UI components
├── pages/
│   ├── Login.tsx               # Login screen
│   ├── Register.tsx            # Registration screen
│   ├── Dashboard.tsx           # Main dashboard
│   ├── CitasList.tsx           # All appointments view
│   ├── CitaDetail.tsx          # Single appointment
│   └── Settings.tsx            # User settings
├── utils/
│   └── api.ts                  # API client
├── styles/
│   └── globals.css             # Design tokens
├── dev-handoff.md              # Developer documentation
├── component-spec.md           # Component specifications
└── design-tokens.json          # Exportable design tokens
```

## 🎨 Design System

### Colors

- **Primary Accent:** `#2B7A78` (Teal)
- **Secondary Accent:** `#4BA3C7` (Blue)
- **Background:** `#F6F7FB` (Light gray)
- **Success:** `#2FAF9B`
- **Error:** `#E45A5A`

### Typography

- **Font Family:** Inter, 'Segoe UI', Roboto, Arial, sans-serif
- **Scale:** 13px - 32px (8 sizes)
- **Weights:** 400 (normal), 500 (medium), 600 (semibold)

### Spacing

8px baseline grid with tokens from 4px to 64px.

## 🔌 API Integration

The application connects to a Flask backend proxy that communicates with Backendless.

### Endpoints Used

- `POST /users/register` - Create new account
- `POST /users/login` - Authenticate user
- `GET /users/logout` - End session
- `PUT /users/{id}` - Update profile
- `POST /data/Cita` - Create appointment
- `GET /data/Cita` - List appointments
- `GET /data/Cita/{id}` - Get single appointment
- `PUT /data/Cita/{id}` - Update appointment
- `DELETE /data/Cita/{id}` - Delete appointment
- `POST /data/Comando` - Process natural language command

### Authentication

Auth token is automatically stored in localStorage and included in all API requests via the `user-token` header.

## 📱 Responsive Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

Maximum content width: 1200px

## ♿ Accessibility

- **Keyboard Navigation:** Full keyboard support with visible focus indicators
- **ARIA Labels:** Proper labeling for screen readers
- **Color Contrast:** WCAG AA compliant (4.5:1 for body text)
- **Semantic HTML:** Proper heading hierarchy and landmarks

## 🧪 Testing

### Manual Testing Checklist

- [ ] Register new account
- [ ] Login with credentials
- [ ] Create appointment via form
- [ ] Create appointment via command
- [ ] View appointments list (grid/list views)
- [ ] View appointment details
- [ ] Edit appointment
- [ ] Delete appointment
- [ ] Filter appointments by date/search
- [ ] Update user profile
- [ ] Test on mobile device
- [ ] Test keyboard navigation
- [ ] Logout

### Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 Documentation

Comprehensive documentation is available:

- **[dev-handoff.md](./dev-handoff.md)** - Complete developer guide with API details, deployment instructions, and security checklist
- **[component-spec.md](./component-spec.md)** - Detailed component documentation with props, variants, and usage examples
- **[design-tokens.json](./design-tokens.json)** - Machine-readable design tokens for design tools integration

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **ShadCN/UI** - Component library
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## 🎯 Key Features

### Natural Language Commands

Type commands like:
- "Agendar cita con el dentista el martes a las 4pm"
- "Crear reunión con el equipo mañana a las 10am"
- "Recordatorio: cita médica viernes"

The system interprets your intent and creates appointments automatically.

### Smart Calendar

- Mini calendar with event indicators
- Click dates to filter appointments
- Visual distinction for today and upcoming events
- Month navigation

### Flexible Views

- **Dashboard:** Quick overview with upcoming appointments
- **List View:** All appointments with search and filters
- **Grid View:** Visual card layout
- **Detail View:** Full appointment information

## 🔐 Security Notes

- Passwords are handled by backend (not stored in frontend)
- Auth tokens stored in localStorage (consider httpOnly cookies for production)
- All API calls should use HTTPS in production
- CORS configured on backend for allowed origins

## 🚧 Known Limitations

1. **Backend Required:** Application requires running backend to function
2. **No Offline Mode:** No service worker or offline support (yet)
3. **No Real-time Updates:** Manual refresh required to see changes from other devices
4. **No File Attachments:** Cannot add files to appointments
5. **No Recurring Appointments:** Each appointment is a single event

## 🔮 Future Enhancements

Recommended features for future versions:

- [ ] WebSocket support for real-time updates
- [ ] Service worker for offline capability
- [ ] Calendar sync (Google Calendar, iCal)
- [ ] File attachments
- [ ] Recurring appointments
- [ ] Push notifications/reminders
- [ ] Multi-user shared appointments
- [ ] Email invitations
- [ ] Export to PDF
- [ ] Dark mode

## 📄 License

This project is provided as-is for the Agente inteligente para agendar citas personales.

## 🤝 Contributing

This is a client project. For questions or modifications, please contact the development team.

## 📧 Support

For technical issues:
1. Check browser console for errors
2. Verify backend API is running
3. Check network requests in DevTools
4. Review documentation files

---

**Version:** 1.0.0  
**Last Updated:** November 10, 2025  
**Built with:** React + TypeScript + Tailwind CSS

Made with ❤️ for Agente inteligente para agendar citas personales
