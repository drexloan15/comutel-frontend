const STORAGE_KEY = "comutelPermisosConfig";

export const normalizeRole = (rol) => String(rol || "").trim().toUpperCase();

export const DEFAULT_PERMISSIONS_CONFIG = {
  roles: {
    CLIENTE: false,
    TECNICO: false,
    ADMIN: true,
    TESTERADMIN: true,
  },
  usuarios: {},
  grupos: {},
};

export const loadPermissionsConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERMISSIONS_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      roles: { ...DEFAULT_PERMISSIONS_CONFIG.roles, ...(parsed?.roles || {}) },
      usuarios: parsed?.usuarios || {},
      grupos: parsed?.grupos || {},
    };
  } catch {
    return { ...DEFAULT_PERMISSIONS_CONFIG };
  }
};

export const savePermissionsConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const canUserViewAdminPanel = (usuario, config) => {
  if (!usuario) return false;

  const role = normalizeRole(usuario.rol);
  if (role === "TESTERADMIN") return true;

  const byUserId = config?.usuarios?.[String(usuario.id)];
  if (typeof byUserId === "boolean") return byUserId;

  const groups = Array.isArray(usuario.grupos) ? usuario.grupos : [];
  for (const group of groups) {
    const byGroupId = config?.grupos?.[String(group?.id)];
    if (typeof byGroupId === "boolean") return byGroupId;
  }

  return Boolean(config?.roles?.[role]);
};
