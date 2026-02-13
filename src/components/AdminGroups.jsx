import { useEffect, useMemo, useState } from "react";
import { groupService } from "../services/groupService";
import { userService } from "../services/userService";
import { normalizeRole } from "../constants/permissions";

function AdminGroups() {
  const [grupos, setGrupos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosGrupo, setUsuariosGrupo] = useState([]);
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState("");
  const [nuevoGrupo, setNuevoGrupo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState(null);
  const [guardandoMiembros, setGuardandoMiembros] = useState(false);

  useEffect(() => {
    cargarDatosBase();
  }, []);

  useEffect(() => {
    if (!grupoSeleccionadoId) {
      setUsuariosGrupo([]);
      return;
    }
    cargarUsuariosDelGrupo(grupoSeleccionadoId);
  }, [grupoSeleccionadoId]);

  const cargarDatosBase = async () => {
    try {
      const [gruposData, usuariosData] = await Promise.all([
        groupService.listar(),
        userService.listar(),
      ]);
      setGrupos(gruposData || []);
      setUsuarios(usuariosData || []);
      setError(null);

      if (!grupoSeleccionadoId && gruposData?.length) {
        setGrupoSeleccionadoId(String(gruposData[0].id));
      }
    } catch (err) {
      setError("No se pudieron cargar grupos/usuarios.");
      console.error(err);
    }
  };

  const cargarUsuariosDelGrupo = async (grupoId) => {
    try {
      const miembros = await groupService.listarUsuarios(grupoId);
      setUsuariosGrupo(miembros || []);
    } catch (err) {
      setUsuariosGrupo([]);
      console.error(err);
    }
  };

  const crearGrupo = async (e) => {
    e.preventDefault();
    if (!nuevoGrupo.trim()) return;

    try {
      await groupService.crear({ nombre: nuevoGrupo, descripcion });
      setNuevoGrupo("");
      setDescripcion("");
      await cargarDatosBase();
    } catch (err) {
      alert("Error al crear el grupo");
    }
  };

  const eliminarGrupo = async (id) => {
    if (!confirm("Seguro que quieres eliminar este grupo?")) return;
    try {
      await groupService.eliminar(id);
      await cargarDatosBase();
      if (String(grupoSeleccionadoId) === String(id)) {
        setGrupoSeleccionadoId("");
      }
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const guardarUsuariosGrupo = async (selectedOptions) => {
    if (!grupoSeleccionadoId) return;
    const usuarioIds = Array.from(selectedOptions || []).map((o) => Number(o.value));
    try {
      setGuardandoMiembros(true);
      await groupService.asignarUsuarios(grupoSeleccionadoId, usuarioIds);
      await cargarUsuariosDelGrupo(grupoSeleccionadoId);
      await cargarDatosBase();
    } catch (err) {
      alert(err.message || "Error al actualizar usuarios del grupo");
    } finally {
      setGuardandoMiembros(false);
    }
  };

  const idsSeleccionados = usuariosGrupo.map((u) => String(u.id));
  const grupoActivo = useMemo(
    () => grupos.find((g) => String(g.id) === String(grupoSeleccionadoId)),
    [grupos, grupoSeleccionadoId]
  );

  return (
    <div className="bg-slate-50 p-8 font-sans min-h-full">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-cyan-900 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-extrabold">Grupos de Resolucion</h2>
        <p className="mt-1 text-sm text-cyan-100">
          Crea equipos, define miembros y mantén la estructura de soporte ordenada.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Nuevo Grupo</h3>
          <form onSubmit={crearGrupo} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre del equipo</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                value={nuevoGrupo}
                onChange={(e) => setNuevoGrupo(e.target.value)}
                placeholder="Ej: Redes N2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Descripcion</label>
              <textarea
                className="h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Que tipo de incidencias atiende este equipo..."
              />
            </div>
            <button className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700">
              Crear Grupo
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Grupo activo</p>
            {grupoActivo ? (
              <div className="mt-2">
                <p className="font-bold text-slate-700">{grupoActivo.nombre}</p>
                <p className="text-xs text-slate-500">{grupoActivo.descripcion || "Sin descripcion"}</p>
                <p className="mt-2 text-xs text-cyan-700 font-semibold">
                  {usuariosGrupo.length} miembro(s)
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Selecciona un grupo para gestionar miembros.</p>
            )}
          </div>
        </section>

        <section className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Miembros por Grupo</h3>
              <select
                className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                value={grupoSeleccionadoId}
                onChange={(e) => setGrupoSeleccionadoId(e.target.value)}
              >
                <option value="">Selecciona un grupo</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Asignar usuarios</p>
                <select
                  multiple
                  className="h-56 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none focus:border-cyan-500"
                  value={idsSeleccionados}
                  disabled={!grupoSeleccionadoId || guardandoMiembros}
                  onChange={(e) => guardarUsuariosGrupo(e.target.selectedOptions)}
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({normalizeRole(u.rol)})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  Usa Ctrl/Cmd + click para seleccionar multiples usuarios.
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Miembros actuales</p>
                <div className="h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {usuariosGrupo.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {usuariosGrupo.map((u) => (
                        <span
                          key={u.id}
                          className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800"
                        >
                          {u.nombre} ({normalizeRole(u.rol)})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Sin miembros en este grupo.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              <div className="col-span-1">ID</div>
              <div className="col-span-4">Nombre</div>
              <div className="col-span-5">Descripcion</div>
              <div className="col-span-2 text-right">Accion</div>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {grupos.map((g) => (
                <div key={g.id} className="grid grid-cols-12 gap-2 items-center border-b border-slate-50 px-5 py-3 text-sm hover:bg-slate-50/70">
                  <div className="col-span-1 text-xs font-mono text-slate-400">#{g.id}</div>
                  <div className="col-span-4 font-semibold text-slate-700">{g.nombre}</div>
                  <div className="col-span-5 text-slate-500">{g.descripcion || "-"}</div>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => eliminarGrupo(g.id)}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {grupos.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-400">No hay grupos creados aun.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminGroups;
