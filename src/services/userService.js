import { API_BASE_URL } from "../constants/api";

export const userService = {
  // 1. Listar
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/usuarios`);
    if (!response.ok) throw new Error("Error al cargar usuarios");
    return await response.json();
  },

  // 2. Crear
  crear: async (usuario) => {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    });
    if (!response.ok) throw new Error("Error al crear usuario");
    return await response.json();
  },

  // 3. Eliminar
  eliminar: async (id) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
        // Intentamos leer el mensaje de error del backend (ej: "Tiene tickets asociados")
        const errorMsg = await response.text();
        throw new Error(errorMsg || "Error al eliminar usuario");
    }
    return true;
  }
};