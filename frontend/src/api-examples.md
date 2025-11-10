# API Examples & Sample Data

This document provides concrete examples of API requests and responses for testing and development.

## Table of Contents

1. [Authentication](#authentication)
2. [Appointments (Citas)](#appointments-citas)
3. [Natural Language Commands](#natural-language-commands)
4. [Error Responses](#error-responses)

---

## Authentication

### Register New User

**Request:**
```http
POST /users/register
Content-Type: application/json

{
  "email": "maria.garcia@example.com",
  "password": "SecurePass123",
  "nombre": "María García"
}
```

**Response (Success):**
```json
{
  "objectId": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
  "email": "maria.garcia@example.com",
  "nombre": "María García",
  "created": "2025-11-09T10:30:00.000Z"
}
```

### Login

**Request:**
```http
POST /users/login
Content-Type: application/json

{
  "login": "maria.garcia@example.com",
  "password": "SecurePass123"
}
```

**Response (Success):**
```json
{
  "objectId": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
  "email": "maria.garcia@example.com",
  "nombre": "María García",
  "user-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "created": "2025-11-09T10:30:00.000Z"
}
```

**Store the `user-token` for subsequent requests!**

### Logout

**Request:**
```http
GET /users/logout
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Update User Profile

**Request:**
```http
PUT /users/3F2504E0-4F89-11D3-9A0C-0305E82C3301
Content-Type: application/json
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "nombre": "María García López",
  "email": "maria.garcia.lopez@example.com"
}
```

**Response:**
```json
{
  "objectId": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
  "email": "maria.garcia.lopez@example.com",
  "nombre": "María García López",
  "updated": "2025-11-09T14:20:00.000Z"
}
```

---

## Appointments (Citas)

### Create Appointment

**Request:**
```http
POST /data/Cita
Content-Type: application/json
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "titulo": "Revisión dental",
  "fecha": "2025-11-15",
  "hora_inicio": "16:00",
  "lugar": "Consultorio Dr. García",
  "descripcion": "Revisión anual y limpieza dental"
}
```

**Response:**
```json
{
  "objectId": "A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P",
  "titulo": "Revisión dental",
  "fecha": "2025-11-15",
  "hora_inicio": "16:00",
  "lugar": "Consultorio Dr. García",
  "descripcion": "Revisión anual y limpieza dental",
  "owner": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
  "created": "2025-11-09T11:00:00.000Z",
  "updated": "2025-11-09T11:00:00.000Z"
}
```

### List All Appointments

**Request:**
```http
GET /data/Cita
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  {
    "objectId": "A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P",
    "titulo": "Revisión dental",
    "fecha": "2025-11-15",
    "hora_inicio": "16:00",
    "lugar": "Consultorio Dr. García",
    "descripcion": "Revisión anual y limpieza dental",
    "owner": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
    "created": "2025-11-09T11:00:00.000Z",
    "updated": "2025-11-09T11:00:00.000Z"
  },
  {
    "objectId": "B8C4D0E2-3F5G-6H7I-8J9K-0L1M2N3O4P5Q",
    "titulo": "Reunión con el equipo",
    "fecha": "2025-11-12",
    "hora_inicio": "10:00",
    "lugar": "Sala de conferencias, Oficina principal",
    "descripcion": "Revisión de proyecto Q4",
    "owner": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
    "created": "2025-11-09T12:30:00.000Z",
    "updated": "2025-11-09T12:30:00.000Z"
  }
]
```

### List Appointments with Filter

**Request (filter by date range):**
```http
GET /data/Cita?where=fecha%3E%3D%272025-11-10%27%20AND%20fecha%3C%3D%272025-11-20%27
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Decoded WHERE clause:** `fecha>='2025-11-10' AND fecha<='2025-11-20'`

**Response:**
```json
[
  {
    "objectId": "A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P",
    "titulo": "Revisión dental",
    "fecha": "2025-11-15",
    "hora_inicio": "16:00",
    "lugar": "Consultorio Dr. García",
    "owner": "3F2504E0-4F89-11D3-9A0C-0305E82C3301"
  },
  {
    "objectId": "B8C4D0E2-3F5G-6H7I-8J9K-0L1M2N3O4P5Q",
    "titulo": "Reunión con el equipo",
    "fecha": "2025-11-12",
    "hora_inicio": "10:00",
    "lugar": "Sala de conferencias, Oficina principal",
    "owner": "3F2504E0-4F89-11D3-9A0C-0305E82C3301"
  }
]
```

### Get Single Appointment

**Request:**
```http
GET /data/Cita/A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "objectId": "A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P",
  "titulo": "Revisión dental",
  "fecha": "2025-11-15",
  "hora_inicio": "16:00",
  "lugar": "Consultorio Dr. García",
  "descripcion": "Revisión anual y limpieza dental",
  "owner": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
  "created": "2025-11-09T11:00:00.000Z",
  "updated": "2025-11-09T11:00:00.000Z"
}
```

### Update Appointment

**Request:**
```http
PUT /data/Cita/A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P
Content-Type: application/json
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "fecha": "2025-11-16",
  "hora_inicio": "15:30",
  "descripcion": "Revisión anual, limpieza dental y consulta ortodoncia"
}
```

**Response:**
```json
{
  "objectId": "A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P",
  "titulo": "Revisión dental",
  "fecha": "2025-11-16",
  "hora_inicio": "15:30",
  "lugar": "Consultorio Dr. García",
  "descripcion": "Revisión anual, limpieza dental y consulta ortodoncia",
  "owner": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
  "created": "2025-11-09T11:00:00.000Z",
  "updated": "2025-11-09T13:45:00.000Z"
}
```

### Delete Appointment

**Request:**
```http
DELETE /data/Cita/A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "message": "Cita deleted successfully"
}
```

---

## Natural Language Commands

### Example 1: Simple Appointment

**Request:**
```http
POST /data/Comando
Content-Type: application/json
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "texto": "Agendar cita con el dentista el martes a las 4pm"
}
```

**Response:**
```json
{
  "mensaje": "Interpretación: Agendar 'Cita con dentista' para el martes 12 de noviembre a las 16:00",
  "resultado": {
    "titulo": "Cita con dentista",
    "fecha": "2025-11-12",
    "hora_inicio": "16:00",
    "lugar": "Por definir",
    "descripcion": ""
  }
}
```

### Example 2: Detailed Appointment

**Request:**
```http
POST /data/Comando
Content-Type: application/json
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "texto": "Crear reunión con el equipo de marketing mañana a las 10am en la sala de juntas para revisar el plan Q4"
}
```

**Response:**
```json
{
  "mensaje": "Interpretación: Crear 'Reunión con equipo de marketing' para el 10 de noviembre a las 10:00 en Sala de juntas",
  "resultado": {
    "titulo": "Reunión con equipo de marketing",
    "fecha": "2025-11-10",
    "hora_inicio": "10:00",
    "lugar": "Sala de juntas",
    "descripcion": "Revisar el plan Q4"
  }
}
```

### Example 3: Medical Appointment

**Request:**
```http
POST /data/Comando
Content-Type: application/json
user-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "texto": "Recordatorio: cita médica el viernes 15 a las 3pm en el hospital central"
}
```

**Response:**
```json
{
  "mensaje": "Interpretación: Crear recordatorio 'Cita médica' para el 15 de noviembre a las 15:00 en Hospital Central",
  "resultado": {
    "titulo": "Cita médica",
    "fecha": "2025-11-15",
    "hora_inicio": "15:00",
    "lugar": "Hospital Central",
    "descripcion": "Recordatorio"
  }
}
```

---

## Error Responses

### 400 Bad Request

**Missing required fields:**
```json
{
  "code": 400,
  "message": "Missing required field: titulo"
}
```

**Invalid date format:**
```json
{
  "code": 400,
  "message": "Invalid date format. Expected YYYY-MM-DD"
}
```

### 401 Unauthorized

**Missing auth token:**
```json
{
  "code": 401,
  "message": "Authentication required. Please provide user-token header."
}
```

**Invalid or expired token:**
```json
{
  "code": 401,
  "message": "Invalid or expired authentication token."
}
```

### 404 Not Found

**Resource not found:**
```json
{
  "code": 404,
  "message": "Cita not found with id: A7B3C9D1-2E4F-5G6H-7I8J-9K0L1M2N3O4P"
}
```

### 409 Conflict

**Duplicate email on registration:**
```json
{
  "code": 409,
  "message": "User with email maria.garcia@example.com already exists"
}
```

### 500 Internal Server Error

**Server error:**
```json
{
  "code": 500,
  "message": "Internal server error. Please try again later."
}
```

---

## Sample Data Sets

### Test User Accounts

```json
[
  {
    "nombre": "María García",
    "email": "maria.garcia@example.com",
    "password": "SecurePass123"
  },
  {
    "nombre": "Juan Pérez",
    "email": "juan.perez@example.com",
    "password": "Password456"
  },
  {
    "nombre": "Ana Martínez",
    "email": "ana.martinez@example.com",
    "password": "MyPass789"
  }
]
```

### Sample Appointments

```json
[
  {
    "titulo": "Revisión dental",
    "fecha": "2025-11-15",
    "hora_inicio": "16:00",
    "lugar": "Consultorio Dr. García, Calle Principal 123",
    "descripcion": "Revisión anual y limpieza dental"
  },
  {
    "titulo": "Reunión con cliente",
    "fecha": "2025-11-12",
    "hora_inicio": "11:30",
    "lugar": "Café Central, Centro",
    "descripcion": "Presentación de propuesta comercial"
  },
  {
    "titulo": "Cita médica",
    "fecha": "2025-11-20",
    "hora_inicio": "09:00",
    "lugar": "Hospital Regional, Consulta 5B",
    "descripcion": "Chequeo anual"
  },
  {
    "titulo": "Entrenamiento personal",
    "fecha": "2025-11-13",
    "hora_inicio": "18:00",
    "lugar": "Gimnasio FitLife",
    "descripcion": "Sesión de cardio y fuerza"
  },
  {
    "titulo": "Clase de yoga",
    "fecha": "2025-11-14",
    "hora_inicio": "19:30",
    "lugar": "Estudio Namaste, Sala 2",
    "descripcion": "Yoga Vinyasa nivel intermedio"
  }
]
```

### Sample Natural Language Commands

```
"Agendar cita con el dentista el martes a las 4pm"
"Crear reunión con el equipo mañana a las 10am"
"Recordatorio: cita médica viernes a las 3pm"
"Agendar revisión del coche el 20 de noviembre a las 5pm en el taller"
"Cita con el abogado el lunes 11 a las 2pm en su oficina"
"Clase de inglés todos los miércoles a las 6pm"
"Entrenamiento personal martes y jueves 7am gimnasio"
"Cena con amigos el sábado 16 a las 9pm restaurante italiano"
```

---

## cURL Examples

### Register User

```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "nombre": "Usuario de Prueba"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "test@example.com",
    "password": "TestPass123"
  }'
```

### Create Appointment

```bash
curl -X POST http://localhost:5000/data/Cita \
  -H "Content-Type: application/json" \
  -H "user-token: YOUR_TOKEN_HERE" \
  -d '{
    "titulo": "Prueba de cita",
    "fecha": "2025-11-15",
    "hora_inicio": "14:00",
    "lugar": "Oficina"
  }'
```

### Process Command

```bash
curl -X POST http://localhost:5000/data/Comando \
  -H "Content-Type: application/json" \
  -H "user-token: YOUR_TOKEN_HERE" \
  -d '{
    "texto": "Agendar cita con el dentista mañana a las 3pm"
  }'
```

---

## Notes for Developers

1. **Date Format:** Always use `YYYY-MM-DD` for dates
2. **Time Format:** Always use `HH:MM` (24-hour format) for times
3. **Token Storage:** Store the `user-token` from login response
4. **Token Header:** Include `user-token` header in all authenticated requests
5. **CORS:** Ensure backend allows requests from your frontend domain
6. **Error Handling:** Always check response status codes and handle errors gracefully

---

**Last Updated:** November 9, 2025
