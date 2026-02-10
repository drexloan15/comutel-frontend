// src/services/groupService.js
import { API_BASE_URL } from "../constants/api";

export const groupService = {
  // 1. Listar
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/grupos`);
    if (!response.ok) throw new Error("Error al cargar grupos");
    return await response.json();
  },

  // 2. Crear
  crear: async (grupo) => {
    const response = await fetch(`${API_BASE_URL}/grupos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grupo),
    });
    if (!response.ok) throw new Error("Error al crear grupo");
    return await response.json();
  },

  // 3. Eliminar
  eliminar: async (id) => {
    const response = await fetch(`${API_BASE_URL}/grupos/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar grupo");
    return true; // Retornamos true si salió bien
  }
};