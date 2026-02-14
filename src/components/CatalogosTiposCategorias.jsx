import { useEffect, useMemo, useState } from "react";
import { catalogoService } from "../services/catalogoService";
import { groupService } from "../services/groupService";

const PROCESS_TYPES = ["INCIDENCIA", "REQUERIMIENTO", "CAMBIO", "APROBACION"];

const initialTipo = { clave: "", nombre: "", workflowKey: "", activo: true };
const initialCategoria = {
  nombre: "",
  processType: "INCIDENCIA",
  rolAsignado: "",
  grupoDefectoId: "",
  activo: true,
};

function CatalogosTiposCategorias() {
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tipoForm, setTipoForm] = useState(initialTipo);
  const [categoriaForm, setCategoriaForm] = useState(initialCategoria);
  const [editingTipoId, setEditingTipoId] = useState(null);
  const [editingCategoriaId, setEditingCategoriaId] = useState(null);

  const [filtroProcessType, setFiltroProcessType] = useState("");
  const [catalogosNoDisponibles, setCatalogosNoDisponibles] = useState(false);

  const categoriasFiltradas = useMemo(() => {
    if (!filtroProcessType) return categorias;
    return categorias.filter((c) => String(c.processType || "").toUpperCase() === filtroProcessType);
  }, [categorias, filtroProcessType]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setCatalogosNoDisponibles(false);
      const [tiposData, categoriasData, gruposData] = await Promise.all([
        catalogoService.listarTipos({ incluirInactivos: true }),
        catalogoService.listarCategorias({ incluirInactivas: true }),
        groupService.listar(),
      ]);
      setTipos(Array.isArray(tiposData) ? tiposData : []);
      setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
    } catch (error) {
      console.error(error);
      if (error?.status === 404) {
        setCatalogosNoDisponibles(true);
        setTipos([]);
        setCategorias([]);
      } else {
        alert(error?.message || "No se pudieron cargar los catalogos");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const resetTipoForm = () => {
    setEditingTipoId(null);
    setTipoForm(initialTipo);
  };

  const resetCategoriaForm = () => {
    setEditingCategoriaId(null);
    setCategoriaForm(initialCategoria);
  };

  const handleSubmitTipo = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        clave: tipoForm.clave.trim().toUpperCase(),
        nombre: tipoForm.nombre.trim(),
        workflowKey: tipoForm.workflowKey.trim(),
        descripcion: tipoForm.workflowKey.trim() || null,
        activo: Boolean(tipoForm.activo),
        activa: Boolean(tipoForm.activo),
      };
      if (editingTipoId) {
        await catalogoService.actualizarTipo(editingTipoId, payload);
      } else {
        await catalogoService.crearTipo(payload);
      }
      resetTipoForm();
      await cargarDatos();
      alert(editingTipoId ? "Tipo actualizado" : "Tipo creado");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo guardar el tipo");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitCategoria = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        nombre: categoriaForm.nombre.trim(),
        processType: categoriaForm.processType,
        tipo: categoriaForm.processType,
        rolAsignado: categoriaForm.rolAsignado.trim() || null,
        grupoDefectoId: categoriaForm.grupoDefectoId ? Number(categoriaForm.grupoDefectoId) : null,
        grupoDefaultId: categoriaForm.grupoDefectoId ? Number(categoriaForm.grupoDefectoId) : null,
        activo: Boolean(categoriaForm.activo),
        activa: Boolean(categoriaForm.activo),
      };
      if (editingCategoriaId) {
        await catalogoService.actualizarCategoria(editingCategoriaId, payload);
      } else {
        await catalogoService.crearCategoria(payload);
      }
      resetCategoriaForm();
      await cargarDatos();
      alert(editingCategoriaId ? "Categoria actualizada" : "Categoria creada");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo guardar la categoria");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTipo = async (tipo) => {
    if (!confirm(`Eliminar tipo ${tipo.nombre}?`)) return;
    try {
      setSaving(true);
      await catalogoService.eliminarTipo(tipo.id);
      if (editingTipoId === tipo.id) resetTipoForm();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo eliminar el tipo");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategoria = async (categoria) => {
    if (!confirm(`Eliminar categoria ${categoria.nombre}?`)) return;
    try {
      setSaving(true);
      await catalogoService.eliminarCategoria(categoria.id);
      if (editingCategoriaId === categoria.id) resetCategoriaForm();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo eliminar la categoria");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full bg-slate-100 p-6">
      {catalogosNoDisponibles && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El backend actual no expone <code>/api/catalogos/*</code> (404). Reinicia con la version nueva para habilitar Tipos y Categorias.
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-800">Tipos de Ticket</h2>
            <button type="button" onClick={resetTipoForm} className="text-xs font-bold px-3 py-1.5 rounded bg-slate-100 text-slate-600">
              Nuevo
            </button>
          </div>

          <form onSubmit={handleSubmitTipo} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Clave (ej: INCIDENCIA)"
              value={tipoForm.clave}
              onChange={(e) => setTipoForm((prev) => ({ ...prev, clave: e.target.value }))}
              required
            />
            <input
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Nombre"
              value={tipoForm.nombre}
              onChange={(e) => setTipoForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
            <input
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm md:col-span-2"
              placeholder="Workflow key (opcional)"
              value={tipoForm.workflowKey}
              onChange={(e) => setTipoForm((prev) => ({ ...prev, workflowKey: e.target.value }))}
            />
            <label className="text-xs text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={tipoForm.activo}
                onChange={(e) => setTipoForm((prev) => ({ ...prev, activo: e.target.checked }))}
              />
              Activo
            </label>
            <button
              type="submit"
              disabled={saving}
              className="md:col-span-2 rounded-lg bg-cyan-600 text-white py-2 text-sm font-bold disabled:opacity-50"
            >
              {editingTipoId ? "Actualizar tipo" : "Crear tipo"}
            </button>
          </form>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {loading && <p className="text-sm text-slate-400">Cargando tipos...</p>}
            {!loading && tipos.length === 0 && <p className="text-sm text-slate-400">No hay tipos registrados.</p>}
            {tipos.map((tipo) => (
              <div key={tipo.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800">{tipo.nombre}</p>
                    <p className="text-xs text-slate-500">{tipo.clave}</p>
                    {tipo.workflowKey && <p className="text-xs text-slate-500">Workflow: {tipo.workflowKey}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${tipo.activo ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {tipo.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white font-bold"
                    onClick={() => {
                      setEditingTipoId(tipo.id);
                      setTipoForm({
                        clave: tipo.clave || "",
                        nombre: tipo.nombre || "",
                        workflowKey: tipo.workflowKey || "",
                        activo: tipo.activo !== false,
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded bg-rose-600 text-white font-bold"
                    onClick={() => handleDeleteTipo(tipo)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-800">Categorias</h2>
            <div className="flex items-center gap-2">
              <select
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                value={filtroProcessType}
                onChange={(e) => setFiltroProcessType(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {PROCESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button type="button" onClick={resetCategoriaForm} className="text-xs font-bold px-3 py-1.5 rounded bg-slate-100 text-slate-600">
                Nueva
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitCategoria} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm md:col-span-2"
              placeholder="Nombre de categoria"
              value={categoriaForm.nombre}
              onChange={(e) => setCategoriaForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={categoriaForm.processType}
              onChange={(e) => setCategoriaForm((prev) => ({ ...prev, processType: e.target.value }))}
              required
            >
              {PROCESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Rol asignado (opcional)"
              value={categoriaForm.rolAsignado}
              onChange={(e) => setCategoriaForm((prev) => ({ ...prev, rolAsignado: e.target.value }))}
            />
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm md:col-span-2"
              value={categoriaForm.grupoDefectoId}
              onChange={(e) => setCategoriaForm((prev) => ({ ...prev, grupoDefectoId: e.target.value }))}
            >
              <option value="">Grupo por defecto (opcional)</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
            <label className="text-xs text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={categoriaForm.activo}
                onChange={(e) => setCategoriaForm((prev) => ({ ...prev, activo: e.target.checked }))}
              />
              Activa
            </label>
            <button
              type="submit"
              disabled={saving}
              className="md:col-span-2 rounded-lg bg-cyan-600 text-white py-2 text-sm font-bold disabled:opacity-50"
            >
              {editingCategoriaId ? "Actualizar categoria" : "Crear categoria"}
            </button>
          </form>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {loading && <p className="text-sm text-slate-400">Cargando categorias...</p>}
            {!loading && categoriasFiltradas.length === 0 && <p className="text-sm text-slate-400">No hay categorias registradas.</p>}
            {categoriasFiltradas.map((categoria) => (
              <div key={categoria.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800">{categoria.nombre}</p>
                    <p className="text-xs text-slate-500">{categoria.processType}</p>
                    <p className="text-xs text-slate-500">Grupo: {categoria.grupoDefectoNombre || "Sin grupo"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${categoria.activo ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {categoria.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white font-bold"
                    onClick={() => {
                      setEditingCategoriaId(categoria.id);
                      setCategoriaForm({
                        nombre: categoria.nombre || "",
                        processType: categoria.processType || "INCIDENCIA",
                        rolAsignado: categoria.rolAsignado || "",
                        grupoDefectoId: categoria.grupoDefectoId ? String(categoria.grupoDefectoId) : "",
                        activo: categoria.activo !== false,
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded bg-rose-600 text-white font-bold"
                    onClick={() => handleDeleteCategoria(categoria)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CatalogosTiposCategorias;
