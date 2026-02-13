import { API_BASE_URL } from "../constants/api";

export const groupService = {
  listar: async () => {
    const response = await fetch(`${API_BASE_URL}/grupos`);
    if (!response.ok) throw new Error("Error al cargar grupos");
    return await response.json();
  },

  crear: async (grupo) => {
    const response = await fetch(`${API_BASE_URL}/grupos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grupo),
    });
    if (!response.ok) throw new Error("Error al crear grupo");
    return await response.json();
  },

  eliminar: async (id) => {
    const response = await fetch(`${API_BASE_URL}/grupos/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar grupo");
    return true;
  },

  listarUsuarios: async (grupoId) => {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}/usuarios`);
    if (!response.ok) throw new Error("Error al cargar usuarios del grupo");
    return await response.json();
  },

  asignarUsuarios: async (grupoId, usuarioIds = []) => {
    const response = await fetch(`${API_BASE_URL}/grupos/${grupoId}/usuarios`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioIds }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || "Error al asignar usuarios al grupo");
    }
    return await response.json();
  },
};
