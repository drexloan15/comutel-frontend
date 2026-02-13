import { useEffect, useMemo, useState } from "react";
import { userService } from "../services/userService";
import { groupService } from "../services/groupService";
import { normalizeRole } from "../constants/permissions";

const ROLE_OPTIONS = ["CLIENTE", "TECNICO", "ADMIN", "TESTERADMIN"];

function RolesPermisos({ usuarioActual, onUsuarioActualizado, puedeGestionarTesterAdmin = false }) {
  const [modo, setModo] = useState("USUARIO");
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState("");
  const [miembrosGrupo, setMiembrosGrupo] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);

  const recargarUsuarios = async () => {
    const usuariosData = await userService.listar();
    setUsuarios(usuariosData || []);
  };

  const recargarGrupos = async () => {
    const gruposData = await groupService.listar();
    setGrupos(gruposData || []);
    if (!grupoSeleccionadoId && (gruposData || []).length > 0) {
      setGrupoSeleccionadoId(String(gruposData[0].id));
    }
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        await Promise.all([recargarUsuarios(), recargarGrupos()]);
      } catch (error) {
        console.error("Error cargando roles", error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    const cargarMiembros = async () => {
      if (!grupoSeleccionadoId) {
        setMiembrosGrupo([]);
        return;
      }
      try {
        const data = await groupService.listarUsuarios(grupoSeleccionadoId);
        setMiembrosGrupo(data || []);
      } catch (error) {
        console.error("Error cargando miembros de grupo", error);
        setMiembrosGrupo([]);
      }
    };
    cargarMiembros();
  }, [grupoSeleccionadoId]);

  const usuariosFiltrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) =>
      [u.nombre, u.email, u.rol].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [usuarios, filtro]);

  const puedeEditarRol = (usuario) => {
    const rol = normalizeRole(usuario?.rol);
    if (rol === "TESTERADMIN" && !puedeGestionarTesterAdmin) return false;
    return true;
  };

  const opcionesRol = (usuario) => {
    const rol = normalizeRole(usuario?.rol);
    if (rol === "TESTERADMIN" && !puedeGestionarTesterAdmin) {
      return ["TESTERADMIN"];
    }
    return ROLE_OPTIONS.filter((r) => puedeGestionarTesterAdmin || r !== "TESTERADMIN");
  };

  const actualizarRol = async (usuario, nuevoRol) => {
    const rolActual = normalizeRole(usuario.rol);
    const rolObjetivo = normalizeRole(nuevoRol);
    if (rolActual === rolObjetivo) return;

    if (!puedeEditarRol(usuario)) {
      alert("No tienes permiso para modificar este usuario.");
      return;
    }
    if (rolObjetivo === "TESTERADMIN" && !puedeGestionarTesterAdmin) {
      alert("Solo TESTERADMIN puede asignar rol TESTERADMIN.");
      return;
    }

    try {
      setGuardandoId(usuario.id);
      const actualizado = await userService.actualizarRol(usuario.id, rolObjetivo);
      await recargarUsuarios();
      if (grupoSeleccionadoId) {
        const data = await groupService.listarUsuarios(grupoSeleccionadoId);
        setMiembrosGrupo(data || []);
      }
      setMiembrosGrupo((prev) =>
        prev.map((u) => (String(u.id) === String(actualizado.id) ? actualizado : u))
      );

      if (usuarioActual?.id === usuario.id) {
        onUsuarioActualizado?.(actualizado);
      }
    } catch (error) {
      alert(error.message || "No se pudo actualizar rol");
    } finally {
      setGuardandoId(null);
    }
  };

  const RolSelect = ({ usuario }) => (
    <select
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
      value={normalizeRole(usuario.rol)}
      disabled={!puedeEditarRol(usuario) || guardandoId === usuario.id}
      onChange={(e) => actualizarRol(usuario, e.target.value)}
    >
      {opcionesRol(usuario).map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );

  if (cargando) {
    return (
      <div className="h-full bg-slate-50 p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-slate-500">
          Cargando configuracion de roles...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 p-8 font-sans">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight">Roles y Permisos</h1>
        <p className="mt-1 text-sm text-blue-100">
          Administra roles de usuarios por listado general o por miembros de grupo.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setModo("USUARIO")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            modo === "USUARIO" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Rol por usuario
        </button>
        <button
          onClick={() => setModo("GRUPO")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            modo === "GRUPO" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Rol por grupo
        </button>
        <input
          className="ml-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="Buscar usuario por nombre/email/rol..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {modo === "USUARIO" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            <div className="col-span-4">Usuario</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Rol Actual</div>
            <div className="col-span-2 text-right">Nuevo Rol</div>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {usuariosFiltrados.map((u) => (
              <div key={u.id} className="grid grid-cols-12 gap-2 px-5 py-3 text-sm border-b border-slate-50 items-center hover:bg-slate-50/60">
                <div className="col-span-4 font-semibold text-slate-700">{u.nombre}</div>
                <div className="col-span-4 text-slate-500">{u.email}</div>
                <div className="col-span-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{normalizeRole(u.rol)}</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <RolSelect usuario={u} />
                </div>
              </div>
            ))}
            {usuariosFiltrados.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400">No se encontraron usuarios.</div>
            )}
          </div>
        </div>
      )}

      {modo === "GRUPO" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Grupo</label>
            <select
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
              value={grupoSeleccionadoId}
              onChange={(e) => setGrupoSeleccionadoId(e.target.value)}
            >
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              <div className="col-span-4">Miembro</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Rol Actual</div>
              <div className="col-span-2 text-right">Nuevo Rol</div>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {miembrosGrupo.map((u) => (
                <div key={u.id} className="grid grid-cols-12 gap-2 px-5 py-3 text-sm border-b border-slate-50 items-center hover:bg-slate-50/60">
                  <div className="col-span-4 font-semibold text-slate-700">{u.nombre}</div>
                  <div className="col-span-4 text-slate-500">{u.email}</div>
                  <div className="col-span-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{normalizeRole(u.rol)}</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <RolSelect usuario={u} />
                  </div>
                </div>
              ))}
              {miembrosGrupo.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-400">Este grupo no tiene usuarios asignados.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesPermisos;
