import { API_BASE_URL } from "../constants/api";

const ALLOWED_PROCESS_TYPES = new Set([
  "INCIDENCIA",
  "REQUERIMIENTO",
  "CAMBIO",
  "APROBACION",
]);

const obtenerUsuarioSesion = () => {
  try {
    const sesion = localStorage.getItem("sesionComutel");
    if (!sesion) return null;
    const datos = JSON.parse(sesion);
    return datos?.usuario ?? null;
  } catch {
    return null;
  }
};

const agregarUsuarioId = (url) => {
  const usuario = obtenerUsuarioSesion();
  if (!usuario?.id) return url;

  const separador = url.includes("?") ? "&" : "?";
  return `${url}${separador}usuarioId=${usuario.id}`;
};

const normalizarTicket = (ticket = {}) => ({
  ...ticket,
  workflowInstanceId: ticket.workflowInstanceId ?? null,
  workflowStateKey: ticket.workflowStateKey ?? null,
  processType: ticket.processType ?? null,
  workflowKey: ticket.workflowKey ?? null,
  categoriaId: ticket.categoriaId ?? null,
  categoria: ticket.categoria ?? null,
});

const normalizarListaTickets = (tickets) => {
  if (!Array.isArray(tickets)) return [];
  return tickets.map(normalizarTicket);
};

const leerError = async (response, fallback) => {
  if (response.ok) return;
  const mensaje = await response.text();
  throw new Error(mensaje || fallback);
};

const buildCrearTicketPayload = (ticket = {}) => {
  if (ticket.usuarioId == null) {
    throw new Error("usuarioId es obligatorio para crear ticket");
  }

  const payload = {
    titulo: ticket.titulo,
    descripcion: ticket.descripcion,
    prioridad: ticket.prioridad,
    usuarioId: ticket.usuarioId,
  };

  if (ticket.processType) {
    const processType = String(ticket.processType).trim().toUpperCase();
    if (!ALLOWED_PROCESS_TYPES.has(processType)) {
      throw new Error("processType invalido");
    }
    payload.processType = processType;
  }

  if (ticket.workflowKey) {
    payload.workflowKey = String(ticket.workflowKey).trim();
  }

  if (ticket.categoriaId != null && ticket.categoriaId !== "") {
    const categoriaId = Number(ticket.categoriaId);
    if (!Number.isFinite(categoriaId) || categoriaId <= 0) {
      throw new Error("categoriaId invalido");
    }
    payload.categoriaId = categoriaId;
  }

  return payload;
};

export const ticketService = {
  listar: async () => {
    const response = await fetch(agregarUsuarioId(`${API_BASE_URL}/tickets`));
    if (!response.ok) throw new Error("Error cargando tickets");
    const data = await response.json();
    return normalizarListaTickets(data);
  },

  obtenerPorId: async (id) => {
    const response = await fetch(agregarUsuarioId(`${API_BASE_URL}/tickets/${id}`));
    if (!response.ok) throw new Error("Error cargando el ticket");
    const data = await response.json();
    return normalizarTicket(data);
  },

  crear: async (ticket) => {
    const payload = buildCrearTicketPayload(ticket);
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await leerError(response, "Error creando ticket");
    const data = await response.json();
    return normalizarTicket(data);
  },

  resolver: async (id, notaCierre) => {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}/finalizar`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: notaCierre,
    });
    await leerError(response, "Error al resolver ticket");
    const data = await response.json();
    return normalizarTicket(data);
  },

  ejecutarTransicion: async (ticketId, eventKey, actorId, payload) => {
    if (!eventKey) {
      throw new Error("eventKey es obligatorio");
    }

    const encodedEventKey = encodeURIComponent(eventKey);
    const actorQuery = actorId != null ? `?actorId=${encodeURIComponent(actorId)}` : "";
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/transition/${encodedEventKey}${actorQuery}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    await leerError(response, "Error ejecutando transicion de workflow");
    const data = await response.json();
    return normalizarTicket(data);
  },

  asignarGrupo: async (ticketId, grupoId, usuarioActorId) => {
    const url = `${API_BASE_URL}/tickets/${ticketId}/asignar-grupo/${grupoId}?actorId=${usuarioActorId}`;
    const response = await fetch(url, { method: "PUT" });
    await leerError(response, "Error al derivar ticket");
    const data = await response.json();
    return normalizarTicket(data);
  },

  derivarTicket: async (ticketId, grupoId, actorId, tecnicoId = null) => {
    const payload = {
      grupoId,
      actorId,
      tecnicoId: tecnicoId == null ? null : tecnicoId,
    };

    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/derivar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await leerError(response, "Error al derivar ticket");
    const data = await response.json();
    return normalizarTicket(data);
  },

  actualizarClasificacion: async (ticketId, payload) => {
    const body = {
      processType: payload?.processType ? String(payload.processType).trim().toUpperCase() : null,
      categoriaId: payload?.categoriaId == null || payload?.categoriaId === "" ? null : Number(payload.categoriaId),
      actorId: payload?.actorId == null ? null : Number(payload.actorId),
    };

    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/clasificacion`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    await leerError(response, "Error actualizando clasificacion");
    const data = await response.json();
    return normalizarTicket(data);
  },

  atenderTicket: async (ticketId, tecnicoId) => {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/atender/${tecnicoId}`, {
      method: "PUT",
    });
    await leerError(response, "No se pudo asignar el tecnico al ticket.");
    const data = await response.json();
    return normalizarTicket(data);
  },

  listarComentarios: async (ticketId) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comentarios`);
    return await res.json();
  },

  agregarComentario: async (ticketId, payload) => {
    await fetch(`${API_BASE_URL}/tickets/${ticketId}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  listarHistorial: async (ticketId) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/historial`);
    if (!res.ok) return [];
    return await res.json();
  },

  iniciarChat: async (ticketId, usuarioId) => {
    await fetch(`${API_BASE_URL}/tickets/${ticketId}/iniciar-chat?usuarioId=${usuarioId}`, { method: "POST" });
  },

  subirAdjunto: async (ticketId, archivo, usuarioId) => {
    const formData = new FormData();
    formData.append("file", archivo);
    formData.append("usuarioId", usuarioId);

    const res = await fetch(`${API_BASE_URL}/adjuntos/ticket/${ticketId}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Error subiendo archivo");
    return await res.json();
  },

  listarAdjuntos: async (ticketId) => {
    const res = await fetch(`${API_BASE_URL}/adjuntos/ticket/${ticketId}`);
    return await res.json();
  },

  enviarCorreoManual: async (ticketId, asunto, mensaje) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/enviar-correo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asunto, mensaje }),
    });
    if (!res.ok) throw new Error("Error enviando correo manual");
  },

  listarActivosInventario: async () => {
    const res = await fetch(`${API_BASE_URL}/tickets/activos`);
    return await res.json();
  },

  vincularActivo: async (ticketId, activoId) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/vincular-activo/${activoId}`, {
      method: "PUT",
    });
    const data = await res.json();
    return normalizarTicket(data);
  },

  crearActivo: async (activo) => {
    await fetch(`${API_BASE_URL}/tickets/activos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activo),
    });
  },
};
