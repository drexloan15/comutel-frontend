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

export const catalogoService = {
  listarTipos: async ({ incluirInactivos = false } = {}) => {
    const url = withQuery(`${API_BASE_URL}/catalogos/tipos`, { incluirInactivos });
    const response = await fetch(url);
    return await parseJson(response, "Error cargando tipos de ticket");
  },

  crearTipo: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/tipos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error creando tipo de ticket");
  },

  actualizarTipo: async (id, payload) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/tipos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error actualizando tipo de ticket");
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
    return await parseJson(response, "Error cargando categorias");
  },

  crearCategoria: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error creando categoria");
  },

  actualizarCategoria: async (id, payload) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseJson(response, "Error actualizando categoria");
  },

  eliminarCategoria: async (id) => {
    const response = await fetch(`${API_BASE_URL}/catalogos/categorias/${id}`, {
      method: "DELETE",
    });
    return await parseJson(response, "Error eliminando categoria");
  },
};
