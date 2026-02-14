import { API_BASE_URL } from "../constants/api";

const parseJson = async (response, fallbackMessage) => {
  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || fallbackMessage);
    error.status = response.status;
    throw error;
  }
  return await response.json();
};

const withQuery = (baseUrl, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? `${baseUrl}?${suffix}` : baseUrl;
};

const normalizeTipo = (item = {}) => {
  const nombre = item.nombre ?? "";
  const fallbackClave = String(nombre)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  return {
    ...item,
    id: item.id,
    nombre,
    clave: item.clave ?? item.tipo ?? fallbackClave,
    workflowKey: item.workflowKey ?? "",
    activo: item.activo ?? item.activa ?? true,
  };
};

const normalizeCategoria = (item = {}) => {
  const grupoDefault = item.grupoDefecto ?? item.grupoDefault ?? null;
  return {
    ...item,
    id: item.id,
    nombre: item.nombre ?? "",
    processType: item.processType ?? item.tipo ?? "",
    rolAsignado: item.rolAsignado ?? "",
    grupoDefectoId: item.grupoDefectoId ?? grupoDefault?.id ?? 0,
    grupoDefectoNombre: item.grupoDefectoNombre ?? grupoDefault?.nombre ?? "",
    activo: item.activo ?? item.activa ?? true,
  };
};

export const catalogoService = {
  listarTipos: async ({ incluirInactivos = false } = {}) => {
    const url = withQuery(`${API_BASE_URL}/catalogos/tipos`, { incluirInactivos });
    const response = await fetch(url);
    const data = await parseJson(response, "Error cargando tipos de ticket");
    return Array.isArray(data) ? data.map(normalizeTipo) : [];
  },

  crearTipo: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/tipos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response, "Error creando tipo de ticket");
    return normalizeTipo(data);
  },

  actualizarTipo: async (id, payload) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/tipos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response, "Error actualizando tipo de ticket");
    return normalizeTipo(data);
  },

  eliminarTipo: async (id) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/tipos/${id}`, {
      method: "DELETE",
    });
    return await parseJson(response, "Error eliminando tipo de ticket");
  },

  listarCategorias: async ({ processType, incluirInactivas = false } = {}) => {
    const url = withQuery(`${API_BASE_URL}/catalogos/categorias`, {
      processType,
      incluirInactivas,
    });
    const response = await fetch(url);
    const data = await parseJson(response, "Error cargando categorias");
    return Array.isArray(data) ? data.map(normalizeCategoria) : [];
  },

  crearCategoria: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response, "Error creando categoria");
    return normalizeCategoria(data);
  },

  actualizarCategoria: async (id, payload) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response, "Error actualizando categoria");
    return normalizeCategoria(data);
  },

  eliminarCategoria: async (id) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/categorias/${id}`, {
      method: "DELETE",
    });
    return await parseJson(response, "Error eliminando categoria");
  },
};
