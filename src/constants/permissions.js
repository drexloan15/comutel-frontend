export const normalizeRole = (rol) => String(rol || "").trim().toUpperCase();

export const canAccessAdminPanel = (rol) => {
  const role = normalizeRole(rol);
  return role === "ADMIN" || role === "TESTERADMIN";
};

export const canManageRoles = (rol) => {
  const role = normalizeRole(rol);
  return role === "ADMIN" || role === "TESTERADMIN";
};
