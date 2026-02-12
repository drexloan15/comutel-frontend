const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBaseUrl = "http://localhost:8080/api";

export const API_BASE_URL = (envApiBaseUrl || defaultApiBaseUrl).replace(/\/+$/, "");

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
