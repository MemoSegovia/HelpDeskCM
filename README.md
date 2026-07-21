# Helpdesk CM - Colegio Mexicano

Sistema de soporte técnico e incidencias para el departamento de tecnología del **Colegio Mexicano**. Permite la comunicación fluida entre el personal docente y el equipo de soporte técnico a través de reportes y un chat interactivo en tiempo real, todo conectado directamente a una hoja de cálculo de Google.

## 🚀 Características Principales

* **Portal de Docentes (`index.html`)**:
  * Inicio de sesión seguro validado contra una lista oficial de docentes.
  * Formulario intuitivo de reporte de fallas (Red, Hardware, iPads, Software, etc.).
  * Historial de tickets personales del docente logueado con refresco automático cada 15 segundos.
  * Notificaciones visuales (Toasts) inmediatas cuando un ticket cambia de estado a "En Proceso" o "Resuelto".
  * Chat integrado para interactuar con el soporte de TI cuando el ticket está en atención.

* **Tablero de Sistemas (`dashboard.html`)**:
  * Visualización global de todas las incidencias con métricas estadísticas automáticas.
  * Buscador rápido y filtros dinámicos por estado y tipo de solicitud.
  * Actualización de estado en tiempo real mediante un selector inline.
  * Chat interactivo con el docente ("Atender / Chat") activo para tickets "En Proceso".
  * Formulario de registro de incidencias manual con un selector de docentes autorizados.

* **Base de Datos (Google Sheets + Apps Script)**:
  * Backend serverless en `codigo.gs` con funciones rápidas `doGet` y `doPost`.
  * Conversión del historial de conversaciones a formato JSON guardado directamente en la hoja de cálculo.
  * Bypass automático de CORS para una integración directa sin configuraciones complicadas.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend**: HTML5, CSS3 (diseño institucional premium responsivo con tipografía *Plus Jakarta Sans*), Vanilla JavaScript.
* **Backend**: Google Apps Script (GAS).
* **Base de Datos**: Google Sheets.

---

## 📋 Configuración y Despliegue

### 1. Preparar Google Sheets
1. Crea una hoja de cálculo en Google Drive.
2. Agrega los siguientes encabezados exactos en la fila 1 (Columnas A a G):
   `Fecha y Hora` | `Usuario` | `Ubicación / Salón` | `Tipo de Solicitud` | `Descripción del Problema` | `Estado` | `Historial de Chat`

### 2. Implementar Google Apps Script
1. En la hoja de cálculo, abre **Extensiones** > **Apps Script**.
2. Pega el código de `codigo.gs`.
3. Guarda el proyecto y haz clic en **Implementar** > **Nueva implementación**.
4. Elige **Aplicación web**. Configura:
   * **Ejecutar como**: Tu cuenta de Google.
   * **Quién tiene acceso**: Cualquier persona.
5. Copia la URL generada (`https://script.google.com/macros/s/.../exec`).

### 3. Conexión del Frontend
La URL de la API de Apps Script ya se encuentra preconfigurada en las constantes del código de `index.html` y `dashboard.html`. Si requieres cambiarla, edita la constante `apiUrl` en la sección `<script>` de ambos archivos.

---

## 📝 Licencia

Este proyecto ha sido desarrollado exclusivamente para el **Colegio Mexicano**.
