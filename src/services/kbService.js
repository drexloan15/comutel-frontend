import { API_BASE_URL } from "../constants/api";

export const kbService = {
  // Buscar (Si query está vacío, trae todo)
  buscar: async (query = "") => {
    const url = query 
        ? `${API_BASE_URL}/kb?query=${query}` 
        : `${API_BASE_URL}/kb`;
        
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error buscando artículos");
    return await response.json();
  },

  crear: async (articulo) => {
    const response = await fetch(`${API_BASE_URL}/kb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articulo),
    });
    if (!response.ok) throw new Error("Error creando artículo");
    return await response.json();
  },
  
  eliminar: async (id) => {
      await fetch(`${API_BASE_URL}/kb/${id}`, { method: "DELETE" });
  }
};