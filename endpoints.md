# Endpoints Documentation

This document outlines the API endpoints, their types, required parameters, and expected responses.

---

## `routes/schedule.js`

### `POST /schedule/create-schema`
*   **Description:** Creates a new schema and monthly tables for a given year.
*   **Parameters (Query):**
    *   `year`: (Required) The year for which to create the schema and tables.
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": "cronograma_registrado" }`
    *   `400 Bad Request`: `{ "error": "El año es requerido" }`
    *   `500 Internal Server Error`: `{ "error": "Error en la transacción: [error_message]" }`

### `POST /schedule/create-event`
*   **Description:** Creates a new event in the schedule.
*   **Parameters (Query):**
    *   `tema`: (Required) The topic of the event.
    *   `acargo`: (Required) Person in charge of the event.
    *   `mediagroup_video`: (Required) Video media group.
    *   `mediagroup_sonido`: (Required) Audio media group.
    *   `fecha`: (Required) Date of the event (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ").
    *   `descripcion`: (Required) Description of the event.
    *   `lugar`: (Required) Location of the event.
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": "SUCCESS" }`
    *   `500 Internal Server Error`: `Error al crear evento: [error_message]`

### `POST /schedule/delete-schema`
*   **Description:** Deletes a schema and all its tables for a given year.
*   **Parameters (Query):**
    *   `year`: (Required) The year of the schema to delete.
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": "Borrado exitosamente" }`
    *   `400 Bad Request`: `El parámetro 'year' es requerido.`
    *   `500 Internal Server Error`: `Error al borrar: [error_message]`

### `POST /schedule/delete-event`
*   **Description:** Deletes an event from the schedule.
*   **Parameters (Query):**
    *   `id`: (Required) The ID of the event to delete.
    *   `month`: (Required) The month of the event (e.g., "01" for January).
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": "success" }`
    *   `500 Internal Server Error`: `Error al consultar la tabla: [error_message]`

### `GET /schedule/month-events`
*   **Description:** Retrieves all events for a given month.
*   **Parameters (Query):**
    *   `month`: (Required) The month (e.g., "01" for January).
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": [event_objects] }`
    *   `200 OK`: `{ "success": false, "data": "No_hay_tablas" }` (if no events found)
    *   `400 Bad Request`: `El parámetro 'month' es requerido.`
    *   `500 Internal Server Error`: `Error al consultar la tabla: [error_message]`

### `GET /schedule/month-topic`
*   **Description:** Retrieves the topic for a specific month (Note: The code checks for `!id` instead of `!month` which is a bug. Also, it queries `WHERE id = 0` which might be a placeholder or incomplete logic).
*   **Parameters (Query):**
    *   `month`: (Required) The month.
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": [topic_objects] }`
    *   `200 OK`: `{ "success": false, "data": "No_hay_tablas" }` (if no topics found)
    *   `400 Bad Request`: `El parámetro 'month' es requerido.`
    *   `500 Internal Server Error`: `{ "success": false, "data": "No_hay_tablas" }` (generic error message)

### `GET /schedule/week-events`
*   **Description:** Retrieves events for the current week.
*   **Parameters:** None (uses current date to determine week).
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": [event_objects] }`
    *   `200 OK`: `{ "success": false, "data": "No_hay_tablas" }` (if no events found)
    *   `500 Internal Server Error`: `Error al consultar la tabla: [error_message]`

### `GET /schedule/next-events`
*   **Description:** Retrieves events for the next week (logic is identical to `/week-events`).
*   **Parameters:** None (uses current date to determine week).
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": [event_objects] }`
    *   `200 OK`: `{ "success": false, "data": "No_hay_tablas" }` (if no events found)
    *   `500 Internal Server Error`: `Error al consultar la tabla: [error_message]`

### `GET /schedule/closest-event`
*   **Description:** Retrieves the closest future event.
*   **Parameters:** None.
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": event_object }` (single event object)
    *   `200 OK`: `{ "success": false, "data": "No se encontró ningún evento futuro" }` (if no future events found)
    *   `500 Internal Server Error`: `Error al obtener el evento: [error_message]`

### `GET /schedule/event`
*   **Description:** Retrieves a specific event by ID and month.
*   **Parameters (Query):**
    *   `id`: (Required) The ID of the event.
    *   `month`: (Required) The month of the event.
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": [event_objects] }`
    *   `200 OK`: `{ "success": false, "data": "No_hay_tablas" }` (if no event found)
    *   `500 Internal Server Error`: `Error al consultar la tabla: [error_message]`

### `POST /schedule/mediagroup`
*   **Description:** Updates media group information for an event.
*   **Parameters (Query):**
    *   `id`: (Required) The ID of the event.
    *   `month`: (Required) The month of the event.
    *   `video`: (Required) Video media group value.
    *   `sonido`: (Required) Audio media group value.
*   **Returns:**
    *   `200 OK`: `{ "success": true, "data": [updated_rows] }` (Note: `result.rows` might be empty for UPDATE)
    *   `200 OK`: `{ "success": false, "data": "No_hay_tablas" }` (if no event found)
    *   `500 Internal Server Error`: `Error al consultar la tabla: [error_message]`

### `GET /schedule/list-mediagroup`
*   **Description:** Retrieves media group information for current and next weeks.
*   **Parameters:** None.
*   **Returns:**
    *   `200 OK`: `[media_group_objects]` (array of objects)
    *   `200 OK`: `{ "success": false, "data": "No_hay_tablas" }` (if no data found)
    *   `500 Internal Server Error`: `{ "error": "Error al consultar la tabla: [error_message]" }`

---
