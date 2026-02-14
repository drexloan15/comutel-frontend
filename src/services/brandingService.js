import { API_BASE_URL } from '../constants/api';

async function parseJson(response, fallbackMessage) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || fallbackMessage);
  }
  return await response.json();
}

export const brandingService = {
  obtenerConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/branding/config`);
    return await parseJson(response, 'Error al cargar configuracion visual');
  },

  guardarConfig: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/branding/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    return await parseJson(response, 'Error al guardar configuracion visual');
  },
};
