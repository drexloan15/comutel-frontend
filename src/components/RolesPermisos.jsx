import { useEffect, useState } from "react";
import { userService } from "../services/userService";
import { groupService } from "../services/groupService";
import {
  DEFAULT_PERMISSIONS_CONFIG,
  savePermissionsConfig,
  normalizeRole,
} from "../constants/permissions";

function RolesPermisos({
  config,
  onChangeConfig,
  puedeGestionarTesterAdmin = false,
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [usuariosData, gruposData] = await Promise.all([
          userService.listar(),
          groupService.listar(),
        ]);
        setUsuarios(usuariosData || []);
        setGrupos(gruposData || []);
      } catch (error) {
        console.error("Error cargando datos de permisos", error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const applyConfig = (nextConfig) => {
    savePermissionsConfig(nextConfig);
    onChangeConfig(nextConfig);
  };

  const updateRolePermission = (role, enabled) => {
    const next = {
      ...config,
      roles: { ...(config?.roles || {}), [role]: enabled },
    };
    applyConfig(next);
  };

  const updateUserPermission = (userId, enabled) => {
    const nextUsers = { ...(config?.usuarios || {}) };
    if (enabled === null) delete nextUsers[String(userId)];
    else nextUsers[String(userId)] = enabled;
    applyConfig({ ...config, usuarios: nextUsers });
  };

  const updateGroupPermission = (groupId, enabled) => {
    const nextGroups = { ...(config?.grupos || {}) };
    if (enabled === null) delete nextGroups[String(groupId)];
    else nextGroups[String(groupId)] = enabled;
    applyConfig({ ...config, grupos: nextGroups });
  };

  const resetDefault = () => {
    applyConfig({ ...DEFAULT_PERMISSIONS_CONFIG, roles: { ...DEFAULT_PERMISSIONS_CONFIG.roles } });
  };

  const roleRows = ["CLIENTE", "TECNICO", "ADMIN", "TESTERADMIN"];

  return (
    <div className="bg-slate-50 p-8 font-sans min-h-full">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Roles y Permisos</h1>
            <p className="text-sm text-slate-500">
              Controla acceso al panel de administracion por rol, usuario y grupo.
            </p>
            {!puedeGestionarTesterAdmin && (
              <p className="text-xs text-amber-600 mt-1">
                El rol TESTERADMIN solo puede ser gestionado por TESTERADMIN.
              </p>
            )}
          </div>
          <button
            onClick={resetDefault}
            className="px-3 py-2 text-xs font-bold rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Restaurar por defecto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-1">
          <h3 className="font-bold text-gray-800 mb-4">Permiso por rol</h3>
          <div className="space-y-3">
            {roleRows.map((role) => {
              const isTesterAdminRole = role === "TESTERADMIN";
              const testerRoleBloqueado = isTesterAdminRole && !puedeGestionarTesterAdmin;
              return (
                <label key={role} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{role}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(config?.roles?.[role])}
                    onChange={(e) => updateRolePermission(role, e.target.checked)}
                    disabled={testerRoleBloqueado}
                    className="accent-blue-600"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-1">
          <h3 className="font-bold text-gray-800 mb-4">Override por usuario</h3>
          {cargando ? (
            <p className="text-sm text-gray-400">Cargando usuarios...</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto divide-y">
              {usuarios.map((u) => {
                const rolUsuario = normalizeRole(u.rol);
                const current = config?.usuarios?.[String(u.id)];
                const bloqueoTesterAdmin = rolUsuario === "TESTERADMIN" && !puedeGestionarTesterAdmin;
                return (
                  <div key={u.id} className="py-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{u.nombre}</p>
                      <p className="text-[11px] text-gray-400">{u.email}</p>
                    </div>
                    <select
                      className="text-xs border rounded px-2 py-1"
                      value={typeof current === "boolean" ? String(current) : "default"}
                      disabled={bloqueoTesterAdmin}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "default") updateUserPermission(u.id, null);
                        else updateUserPermission(u.id, v === "true");
                      }}
                    >
                      <option value="default">Por rol</option>
                      <option value="true">Permitir</option>
                      <option value="false">Bloquear</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-1">
          <h3 className="font-bold text-gray-800 mb-4">Override por grupo</h3>
          {cargando ? (
            <p className="text-sm text-gray-400">Cargando grupos...</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto divide-y">
              {grupos.map((g) => {
                const current = config?.grupos?.[String(g.id)];
                return (
                  <div key={g.id} className="py-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{g.nombre}</p>
                      <p className="text-[11px] text-gray-400">{g.descripcion || "-"}</p>
                    </div>
                    <select
                      className="text-xs border rounded px-2 py-1"
                      value={typeof current === "boolean" ? String(current) : "default"}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "default") updateGroupPermission(g.id, null);
                        else updateGroupPermission(g.id, v === "true");
                      }}
                    >
                      <option value="default">Sin override</option>
                      <option value="true">Permitir</option>
                      <option value="false">Bloquear</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RolesPermisos;
