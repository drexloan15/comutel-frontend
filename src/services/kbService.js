import { API_BASE_URL } from "../constants/api"; // O usa la URL directa si no tienes la constante

const BASE_URL = `${API_BASE_URL}/kb`; // Asegúrate que tu backend sea /api/kb

export const kbService = {
    // Listar todos los artículos
    listar: async () => {
        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error("Error al cargar artículos");
        return await response.json();
    },

    // Buscar (Si tu backend tiene endpoint de busqueda, si no filtraremos en frontend)
    buscar: async (query) => {
        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error("Error al buscar");
        const data = await response.json();
        // Filtro simple en cliente si el backend devuelve todo
        return data.filter(a => 
            a.titulo.toLowerCase().includes(query.toLowerCase()) || 
            a.contenido.toLowerCase().includes(query.toLowerCase())
        );
    }
};