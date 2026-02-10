import { API_BASE_URL } from "../constants/api";

export const ticketService = {
  // 1. Listar todos
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/tickets`);
    if (!response.ok) throw new Error("Error cargando tickets");
    return await response.json();
  },

  // 2. Obtener uno por ID (Detalle)
  obtenerPorId: async (id) => {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`);
    if (!response.ok) throw new Error("Error cargando el ticket");
    return await response.json();
  },

  // 3. Crear Ticket
  crear: async (ticket) => {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket),
    });
    if (!response.ok) throw new Error("Error creando ticket");
    return await response.json();
  },

  // 4. Resolver (Finalizar)
  resolver: async (id, notaCierre) => {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}/finalizar`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" }, // O application/json si tu backend lo requiere así
      body: notaCierre
    });
    if (!response.ok) throw new Error("Error al resolver ticket");
    return await response.json();
  },

  // 5. Asignar Grupo
  asignarGrupo: async (ticketId, grupoId, usuarioActorId) => {
    const url = `${API_BASE_URL}/tickets/${ticketId}/asignar-grupo/${grupoId}?actorId=${usuarioActorId}`;
    const response = await fetch(url, { method: "PUT" });
    if (!response.ok) throw new Error("Error al derivar ticket");
    return await response.json();
  },

  // 👇👇👇 AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA 👇👇👇
  // 5.5. Asignar Técnico (Tomar Caso)
  atenderTicket: async (ticketId, tecnicoId) => {
    // Asumimos que tu backend tiene este endpoint: PUT /api/tickets/{id}/asignar/{tecnicoId}
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/asignar/${tecnicoId}`, {
        method: "PUT"
    });
    
    if (!response.ok) {
        throw new Error("No se pudo asignar el técnico al ticket.");
    }
    return await response.json();
  },
  // 👆👆👆 ----------------------------------- 👆👆👆

  // 6. Comentarios
  listarComentarios: async (ticketId) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comentarios`);
    return await res.json();
  },

  agregarComentario: async (ticketId, payload) => {
    await fetch(`${API_BASE_URL}/tickets/${ticketId}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  
  // 7. Historial
  listarHistorial: async (ticketId) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/historial`);
    if(!res.ok) return [];
    return await res.json();
  },

  // 8. Extras
  iniciarChat: async (ticketId, usuarioId) => {
    await fetch(`${API_BASE_URL}/tickets/${ticketId}/iniciar-chat?usuarioId=${usuarioId}`, { method: "POST" });
  },

  subirAdjunto: async (ticketId, archivo, usuarioId) => {
    const formData = new FormData();
    formData.append("file", archivo);
    formData.append("usuarioId", usuarioId);

    const res = await fetch(`${API_BASE_URL}/adjuntos/ticket/${ticketId}`, {
      method: "POST",
      body: formData
    });
    if(!res.ok) throw new Error("Error subiendo archivo");
    return await res.json();
  },

  listarAdjuntos: async (ticketId) => {
    const res = await fetch(`${API_BASE_URL}/adjuntos/ticket/${ticketId}`);
    return await res.json();
  },

  enviarCorreoManual: async (ticketId, asunto, mensaje) => {
    await fetch(`${API_BASE_URL}/tickets/${ticketId}/enviar-correo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asunto, mensaje })
    });
  },

  // 9. Activos
  listarActivosInventario: async () => {
    const res = await fetch(`${API_BASE_URL}/tickets/activos`);
    return await res.json();
  },

  vincularActivo: async (ticketId, activoId) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/vincular-activo/${activoId}`, {
      method: "PUT"
    });
    return await res.json();
  },
  
  crearActivo: async (activo) => {
      await fetch(`${API_BASE_URL}/tickets/activos`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(activo)
      });
  },
};