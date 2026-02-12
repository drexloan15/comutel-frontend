import { API_BASE_URL } from "../constants/api";

const BASE_URL = `${API_BASE_URL}/kb`;

export const kbService = {
  listar: async () => {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error("Error al cargar articulos");
    return await response.json();
  },

  buscar: async (query) => {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error("Error al buscar");
    const data = await response.json();
    return data.filter(
      (a) =>
        a.titulo.toLowerCase().includes(query.toLowerCase()) ||
        a.contenido.toLowerCase().includes(query.toLowerCase())
    );
  },

  crear: async (payload) => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Error al crear articulo");
    return await response.json();
  },

  actualizar: async (id, payload) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Error al actualizar articulo");
    return await response.json();
  },

  eliminar: async (id) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar articulo");
    return true;
  },
};
