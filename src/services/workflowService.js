import { API_BASE_URL } from "../constants/api";

const parseJson = async (response, fallbackMessage) => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || fallbackMessage);
  }
  return await response.json();
};

const withActorId = (url, actorId) => {
  if (actorId == null) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}actorId=${encodeURIComponent(actorId)}`;
};

export const workflowService = {
  listarDefiniciones: async (processType) => {
    const query = processType ? `?processType=${encodeURIComponent(processType)}` : "";
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions${query}`);
    return await parseJson(response, "Error cargando definiciones de workflow");
  },

  obtenerDefinicion: async (id) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${id}`);
    return await parseJson(response, "Error cargando definicion de workflow");
  },

  crearDefinicion: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error creando definicion de workflow");
  },

  activarDefinicion: async (id) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${id}/activate`, {
      method: "PUT",
    });
    return await parseJson(response, "Error activando definicion de workflow");
  },

  desactivarDefinicion: async (id) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${id}/deactivate`, {
      method: "PUT",
    });
    return await parseJson(response, "Error desactivando definicion de workflow");
  },

  agregarEstado: async (definitionId, payload) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/states`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error agregando estado de workflow");
  },

  actualizarEstado: async (definitionId, stateId, payload) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/states/${stateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error actualizando estado de workflow");
  },

  eliminarEstado: async (definitionId, stateId) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/states/${stateId}`, {
      method: "DELETE",
    });
    return await parseJson(response, "Error eliminando estado de workflow");
  },

  agregarTransicion: async (definitionId, payload) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error agregando transicion de workflow");
  },

  actualizarTransicion: async (definitionId, transitionId, payload) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/transitions/${transitionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error actualizando transicion de workflow");
  },

  eliminarTransicion: async (definitionId, transitionId) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/transitions/${transitionId}`, {
      method: "DELETE",
    });
    return await parseJson(response, "Error eliminando transicion de workflow");
  },

  agregarReglaAsignacion: async (definitionId, payload) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/assignment-rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error agregando regla de asignacion");
  },

  actualizarReglaAsignacion: async (definitionId, ruleId, payload) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/assignment-rules/${ruleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error actualizando regla de asignacion");
  },

  eliminarReglaAsignacion: async (definitionId, ruleId) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/definitions/${definitionId}/assignment-rules/${ruleId}`, {
      method: "DELETE",
    });
    return await parseJson(response, "Error eliminando regla de asignacion");
  },

  listarSlaPolicies: async () => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/sla-policies`);
    return await parseJson(response, "Error cargando SLA policies");
  },

  crearSlaPolicy: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/workflows/admin/sla-policies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error creando SLA policy");
  },

  obtenerInstanciaPorEntidad: async (entityType, entityId) => {
    const response = await fetch(`${API_BASE_URL}/workflows/runtime/instances/entity/${encodeURIComponent(entityType)}/${entityId}`);
    return await parseJson(response, "Error cargando instancia de workflow");
  },

  obtenerTransicionesDisponibles: async (instanceId, actorId) => {
    const url = withActorId(`${API_BASE_URL}/workflows/runtime/instances/${instanceId}/transitions`, actorId);
    const response = await fetch(url);
    return await parseJson(response, "Error cargando transiciones disponibles");
  },

  ejecutarTransicionInstancia: async (instanceId, eventKey, actorId, payload) => {
    const baseUrl = `${API_BASE_URL}/workflows/runtime/instances/${instanceId}/transitions/${encodeURIComponent(eventKey)}`;
    const url = withActorId(baseUrl, actorId);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return await parseJson(response, "Error ejecutando transicion de instancia");
  },

  obtenerLogInstancia: async (instanceId) => {
    const response = await fetch(`${API_BASE_URL}/workflows/runtime/instances/${instanceId}/log`);
    return await parseJson(response, "Error cargando log de instancia");
  },

  obtenerTareasInstancia: async (instanceId) => {
    const response = await fetch(`${API_BASE_URL}/workflows/runtime/instances/${instanceId}/tasks`);
    return await parseJson(response, "Error cargando tareas de instancia");
  },
};
