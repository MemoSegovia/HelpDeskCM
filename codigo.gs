/**
 * Helpdesk CM - Backend (Google Apps Script)
 * Desarrollado para el departamento de tecnología del Colegio Mexicano.
 * 
 * Columnas de la Hoja de Cálculo:
 * A: Fecha y Hora
 * B: Usuario (Maestro/Admin)
 * C: Ubicación / Salón
 * D: Tipo de Solicitud
 * E: Descripción del Problema
 * F: Estado (Pendiente / En Proceso / Resuelto)
 * G: Historial de Chat (Texto JSON)
 * H: Técnico / Atendido Por
 */

// Token de seguridad secreto compartido entre el frontend y el backend
const SECURITY_TOKEN = "CM-Helpdesk-Token-Seguridad-ColegioMexicano-2026";

function doGet(e) {
  try {
    // Validar token de seguridad en la consulta GET
    const token = e && e.parameter && e.parameter.token;
    if (token !== SECURITY_TOKEN) {
      return createJsonResponse({ success: false, error: 'Acceso no autorizado.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const lastRow = sheet.getLastRow();
    
    // Si no hay datos (solo encabezados o vacío)
    if (lastRow < 2) {
      return createJsonResponse([]);
    }
    
    // Obtener los datos desde la fila 2 hasta la última, cubriendo las 8 columnas
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
    const values = dataRange.getValues();
    
    const tickets = values.map((row, index) => {
      const rowIndex = index + 2; // El ID del ticket corresponde al número de fila real en la hoja
      
      let chatHistory = [];
      try {
        if (row[6]) {
          chatHistory = JSON.parse(row[6]);
        }
      } catch (err) {
        console.error("Error al parsear el chat en la fila " + rowIndex + ": " + err.message);
      }
      
      return {
        id: rowIndex,
        fechaHora: row[0],
        usuario: row[1],
        ubicacion: row[2],
        tipoSolicitud: row[3],
        descripcion: row[4],
        estado: row[5] || 'Pendiente',
        historialChat: chatHistory,
        tecnico: row[7] || ''
      };
    });
    
    return createJsonResponse(tickets);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    // Validar el payload recibido
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'No se recibieron datos (payload vacío).' });
    }
    
    // Parsear el contenido recibido en texto plano
    const payload = JSON.parse(e.postData.contents);
    
    // Validar token de seguridad en la solicitud POST
    const token = payload && payload.token;
    if (token !== SECURITY_TOKEN) {
      return createJsonResponse({ success: false, error: 'Acceso no autorizado.' });
    }

    const action = payload.action;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    
    if (action === 'create') {
      let fechaHora = new Date();
      if (payload.fechaHora) {
        fechaHora = new Date(payload.fechaHora);
        if (isNaN(fechaHora.getTime())) {
          fechaHora = payload.fechaHora;
        }
      }
      const usuario = payload.usuario || '';
      const ubicacion = payload.ubicacion || '';
      const tipoSolicitud = payload.tipoSolicitud || '';
      const descripcion = payload.descripcion || '';
      const estado = payload.estado || 'Pendiente';
      const historialChat = JSON.stringify([]); // Iniciar historial como string de array vacío
      const tecnico = payload.tecnico || '';
      
      sheet.appendRow([fechaHora, usuario, ubicacion, tipoSolicitud, descripcion, estado, historialChat, tecnico]);
      
      // Obtener el índice de la fila recién insertada
      const newRowId = sheet.getLastRow();
      
      return createJsonResponse({ 
        success: true, 
        message: 'Ticket creado exitosamente', 
        id: newRowId 
      });
      
    } else if (action === 'update_status') {
      const id = parseInt(payload.id);
      const newStatus = payload.estado;
      const tecnico = payload.tecnico;
      
      if (isNaN(id) || id < 2) {
        return createJsonResponse({ success: false, error: 'ID de ticket inválido.' });
      }
      if (!newStatus) {
        return createJsonResponse({ success: false, error: 'El estado a actualizar no es válido.' });
      }
      
      // La columna 6 es la F (Estado)
      sheet.getRange(id, 6).setValue(newStatus);
      
      // Si se proporciona el técnico asignado / que atiende (Columna 8 / H)
      if (tecnico !== undefined) {
        sheet.getRange(id, 8).setValue(tecnico);
      }
      
      return createJsonResponse({ 
        success: true, 
        message: 'Estado actualizado correctamente a: ' + newStatus 
      });
      
    } else if (action === 'edit_ticket') {
      const id = parseInt(payload.id);
      
      if (isNaN(id) || id < 2 || id > sheet.getLastRow()) {
        return createJsonResponse({ success: false, error: 'ID de ticket inválido.' });
      }
      
      if (payload.usuario !== undefined) sheet.getRange(id, 2).setValue(payload.usuario);
      if (payload.ubicacion !== undefined) sheet.getRange(id, 3).setValue(payload.ubicacion);
      if (payload.tipoSolicitud !== undefined) sheet.getRange(id, 4).setValue(payload.tipoSolicitud);
      if (payload.descripcion !== undefined) sheet.getRange(id, 5).setValue(payload.descripcion);
      if (payload.estado !== undefined) sheet.getRange(id, 6).setValue(payload.estado);
      if (payload.tecnico !== undefined) sheet.getRange(id, 8).setValue(payload.tecnico);
      
      return createJsonResponse({ 
        success: true, 
        message: 'Ticket #' + id + ' editado exitosamente en Google Sheets.' 
      });
      
    } else if (action === 'delete') {
      const id = parseInt(payload.id);
      
      if (isNaN(id) || id < 2 || id > sheet.getLastRow()) {
        return createJsonResponse({ success: false, error: 'ID de ticket inválido.' });
      }
      
      sheet.deleteRow(id);
      
      return createJsonResponse({ 
        success: true, 
        message: 'Ticket #' + id + ' eliminado exitosamente de Google Sheets.' 
      });
      
    } else if (action === 'add_message') {
      const id = parseInt(payload.id);
      const sender = payload.remitente;
      const message = payload.mensaje;
      
      if (isNaN(id) || id < 2) {
        return createJsonResponse({ success: false, error: 'ID de ticket inválido.' });
      }
      if (!sender || !message) {
        return createJsonResponse({ success: false, error: 'Remitente y mensaje son requeridos.' });
      }
      
      // La columna 7 es la G (Historial de Chat)
      const chatCell = sheet.getRange(id, 7);
      const chatVal = chatCell.getValue();
      
      let chatHistory = [];
      try {
        if (chatVal) {
          chatHistory = JSON.parse(chatVal);
        }
      } catch (err) {
        // En caso de que falle el parsing, reiniciamos el historial
        chatHistory = [];
      }
      
      // Agregar el nuevo mensaje
      chatHistory.push({
        remitente: sender,
        mensaje: message,
        timestamp: new Date().toISOString()
      });
      
      // Guardar de vuelta como JSON serializado
      chatCell.setValue(JSON.stringify(chatHistory));
      
      return createJsonResponse({ 
        success: true, 
        message: 'Mensaje de chat agregado exitosamente.', 
        chat: chatHistory 
      });
      
    } else {
      return createJsonResponse({ success: false, error: 'Acción "' + action + '" no es reconocida.' });
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Helper para construir respuestas JSON válidas en Google Apps Script
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
