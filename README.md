## `routes/role_routes.js`

All endpoints in this file require authentication (via `verifyToken` middleware).

### POST `/create-role`
- **Description:** Creates a new role for the authenticated user's organization.
- **Parameters:**
  - `body`: JSON object containing role data. The `organizacion_id` is automatically set based on the authenticated user's organization.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "message": "Rol creado con éxito" }`
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-roles`
- **Description:** Retrieves all roles for the authenticated user's organization.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of role objects)
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-single-role`
- **Description:** Retrieves roles for the authenticated user's organization. (Note: This endpoint appears to have the same functionality as `/get-roles`).
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of role objects)
  - Error: `500 Internal Server Error` with an error message.

## `routes/track.js`

### GET `/get-names`
- **Description:** Retrieves a list of names for tracking.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of names)
  - Not Found: `200 OK` with `{ "success": false, "message": "No se encontraron nombres" }`
  - Error: `500 Internal Server Error` with `{ "error": "Error al obtener los nombres" }`

### GET `/fuzzy_search`
- **Description:** Performs a fuzzy search for names.
- **Parameters:**
  - `query`:
    - `search`: The search string.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...], "totalResults": ... }` (array of matching names and total results)
  - Missing Parameter: `400 Bad Request` with `{ "error": "El parámetro 'search' es requerido" }`
  - Error: `500 Internal Server Error` with `{ "error": "Error en la búsqueda difusa" }`

## `routes/grade.js`

All endpoints in this file require authentication (via `verifyToken` middleware).

### POST `/create-grade`
- **Description:** Creates a new grade for the authenticated user's organization.
- **Parameters:**
  - `body`: JSON object containing grade data. The `organizacion_id` is automatically set based on the authenticated user's organization.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "message": "Grado creado con éxito" }`
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-grades`
- **Description:** Retrieves all grades for the authenticated user's organization.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of grade objects)
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-single-grade`
- **Description:** Retrieves grades for the authenticated user's organization. (Note: This endpoint appears to have the same functionality as `/get-grades`).
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of grade objects)
  - Error: `500 Internal Server Error` with an error message.

## `routes/place.js`

All endpoints in this file require authentication (via `verifyToken` middleware).

### POST `/create-place`
- **Description:** Creates a new place for the authenticated user's organization.
- **Parameters:**
  - `body`: JSON object containing place data. The `organizacion_id` is automatically set based on the authenticated user's organization.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "message": "Espacio creado con éxito" }`
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-places`
- **Description:** Retrieves all places for the authenticated user's organization.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of place objects)
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-single-place`
- **Description:** Retrieves places for the authenticated user's organization. (Note: This endpoint appears to have the same functionality as `/get-places`).
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of place objects)
  - Error: `500 Internal Server Error` with an error message.

## `routes/education_level.js`

All endpoints in this file require authentication (via `verifyToken` middleware).

### POST `/create-education-level`
- **Description:** Creates a new education level for the authenticated user's organization.
- **Parameters:**
  - `body`: JSON object containing education level data. The `organizacion_id` is automatically set based on the authenticated user's organization.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "message": "Escuela creada con éxito" }`
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-education-levels`
- **Description:** Retrieves all education levels for the authenticated user's organization.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of education level objects)
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-single-education-level`
- **Description:** Retrieves education levels for the authenticated user's organization. (Note: This endpoint appears to have the same functionality as `/get-education-levels`).
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of education level objects)
  - Error: `500 Internal Server Error` with an error message.

## `routes/department.js`

All endpoints in this file require authentication (via `verifyToken` middleware).

### POST `/create-department`
- **Description:** Creates a new department for the authenticated user's organization.
- **Parameters:**
  - `body`: JSON object containing department data. The `organizacion_id` is automatically set based on the authenticated user's organization.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "message": "Departamento creado con éxito" }`
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-departments`
- **Description:** Retrieves all departments for the authenticated user's organization.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of department objects)
  - Error: `500 Internal Server Error` with an error message.

### GET `/get-single-department`
- **Description:** Retrieves departments for the authenticated user's organization. (Note: This endpoint appears to have the same functionality as `/get-departments`).
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of department objects)
  - Error: `500 Internal Server Error` with an error message.

## `routes/schedule.js`

### POST `/create-schema`
- **Description:** Creates a new schema and monthly tables for a given year.
- **Parameters:**
  - `query`:
    - `year`: The year for which to create the schema and tables.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": "cronograma_registrado" }`
  - Missing Parameter: `400 Bad Request` with `El año es requerido`
  - Error: `500 Internal Server Error` with an error message.

### POST `/create-event`
- **Description:** Creates a new event in the schedule.
- **Parameters:**
  - `query`:
    - `tema`: The topic of the event.
    - `acargo`: The person in charge of the event.
    - `mediagroup_video`: Video media group for the event.
    - `mediagroup_sonido`: Audio media group for the event.
    - `fecha`: The date of the event (e.g., `YYYY-MM-DDTHH:mm:ss.sssZ`).
    - `descripcion`: Description of the event.
    - `lugar`: The location of the event.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": "SUCCESS" }`
  - Error: `500 Internal Server Error` with `Error al crear evento: ` + error message.

### POST `/delete-schema`
- **Description:** Deletes a schema and its associated tables for a given year.
- **Parameters:**
  - `query`:
    - `year`: The year of the schema to delete.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": "Borrado exitosamente" }`
  - Missing Parameter: `400 Bad Request` with `El parámetro 'year' es requerido.`
  - Error: `500 Internal Server Error` with `Error al borrar: ` + error message.

### POST `/delete-event`
- **Description:** Deletes an event from the schedule.
- **Parameters:**
  - `query`:
    - `id`: The ID of the event to delete.
    - `month`: The month of the event (e.g., `01` for January).
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": "success" }`
  - Error: `500 Internal Server Error` with `Error al consultar la tabla: ` + error message.

### GET `/month-events`
- **Description:** Retrieves all events for a given month.
- **Parameters:**
  - `query`:
    - `month`: The month (e.g., `01` for January, or `1` for January).
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of event objects)
  - Not Found: `200 OK` with `{ "success": false, "data": "No_hay_tablas" }`
  - Missing Parameter: `400 Bad Request` with `El parámetro 'month' es requerido.`
  - Error: `500 Internal Server Error` with `Error al consultar la tabla: ` + error message.

### GET `/month-topic`
- **Description:** Retrieves the topic for a specific month (Note: The implementation seems to query for `id = 0` which might not be intended for a general topic retrieval).
- **Parameters:**
  - `query`:
    - `month`: The month.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of topic objects)
  - Not Found: `200 OK` with `{ "success": false, "data": "No_hay_tablas" }`
  - Missing Parameter: `400 Bad Request` with `El parámetro 'month' es requerido.`
  - Error: `200 OK` with `{ "success": false, "data": "No_hay_tablas" }`

### GET `/week-events`
- **Description:** Retrieves events for the current week.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of event objects)
  - Not Found: `200 OK` with `{ "success": false, "data": "No_hay_tablas" }`
  - Error: `500 Internal Server Error` with `Error al consultar la tabla: ` + error message.

### GET `/next-events`
- **Description:** Retrieves events for the next few weeks (similar to `week-events`).
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of event objects)
  - Not Found: `200 OK` with `{ "success": false, "data": "No_hay_tablas" }`
  - Error: `500 Internal Server Error` with `Error al consultar la tabla: ` + error message.

### GET `/closest-event`
- **Description:** Retrieves the closest upcoming event.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": {...} }` (closest event object)
  - Not Found: `200 OK` with `{ "success": false, "data": "No se encontró ningún evento futuro" }`
  - Error: `500 Internal Server Error` with `Error al obtener el evento: ` + error message.

### GET `/event`
- **Description:** Retrieves a specific event by ID and month.
- **Parameters:**
  - `query`:
    - `id`: The ID of the event.
    - `month`: The month of the event.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (array of event objects)
  - Not Found: `200 OK` with `{ "success": false, "data": "No_hay_tablas" }`
  - Error: `500 Internal Server Error` with `Error al consultar la tabla: ` + error message.

### POST `/mediagroup`
- **Description:** Updates mediagroup information for an event.
- **Parameters:**
  - `query`:
    - `id`: The ID of the event.
    - `month`: The month of the event.
    - `video`: The video mediagroup value.
    - `sonido`: The audio mediagroup value.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": [...] }` (updated event data)
  - Not Found: `200 OK` with `{ "success": false, "data": "No_hay_tablas" }`
  - Error: `500 Internal Server Error` with `Error al consultar la tabla: ` + error message.

### GET `/list-mediagroup`
- **Description:** Retrieves mediagroup information for events in the current and next month.
- **Parameters:** None
- **Returns:**
  - Success: `200 OK` with `[...]` (array of mediagroup event objects)
  - Not Found: `200 OK` with `{ "success": false, "data": "No_hay_tablas" }`
  - Error: `500 Internal Server Error` with `{ "error": "Error al consultar la tabla: " }` + error message.

## `routes/user_device.js`

All endpoints in this file require authentication (via `verifyToken` middleware).

### POST `/`
- **Description:** Registers a new user device.
- **Parameters:**
  - `body`:
    - `email`: The email of the user.
    - `player_id`: The player ID of the device.
    - `device_type`: The type of the device.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": {...} }` (result of device registration)
  - Missing Parameters: `400 Bad Request` with `{ "success": false, "error": "Faltan datos requeridos." }`
  - Error: `500 Internal Server Error` with an error message.

### GET `/`
- **Description:** Retrieves user device information by email.
- **Parameters:**
  - `query`:
    - `email`: The email of the user.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": {...} }` (device information)
  - Error: `500 Internal Server Error` with an error message.

### PUT `/:id`
- **Description:** Updates user device information.
- **Parameters:**
  - `params`:
    - `id`: The ID of the device to update.
  - `body`:
    - `device_type`: (Optional) The new device type.
    - `last_active`: (Optional) The new last active timestamp.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "data": {...} }` (updated device information)
  - Not Found: `404 Not Found` with `{ "success": false, "error": "Dispositivo no encontrado." }`
  - Missing Parameters: `400 Bad Request` with `{ "success": false, "error": "No se proporcionó ningún dato para actualizar." }`
  - Error: `500 Internal Server Error` with an error message.

### DELETE `/:id`
- **Description:** Deletes a user device by ID.
- **Parameters:**
  - `params`:
    - `id`: The ID of the device to delete.
- **Returns:**
  - Success: `200 OK` with `{ "success": true, "message": "Dispositivo eliminado correctamente." }`
  - Not Found: `404 Not Found` with `{ "success": false, "error": "Dispositivo no encontrado." }`
  - Error: `500 Internal Server Error` with an error message.