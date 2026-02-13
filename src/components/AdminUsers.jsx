import { useState, useEffect } from "react";
import { userService } from "../services/userService";
import { groupService } from "../services/groupService";
import { normalizeRole } from "../constants/permissions";

function AdminUsers({ usuarioActual }) {
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("CLIENTE");
  const [error, setError] = useState(null);
  const [guardandoGruposId, setGuardandoGruposId] = useState(null);

  const esSuperAdmin = normalizeRole(usuarioActual?.rol) === "TESTERADMIN";

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [usuariosData, gruposData] = await Promise.all([
        userService.listar(),
        groupService.listar(),
      ]);
      setUsuarios(usuariosData || []);
      setGrupos(gruposData || []);
      setError(null);
    } catch (err) {
      setError("Error cargando usuarios o grupos.");
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      return alert("Todos los campos son obligatorios");
    }

    if (rol === "TESTERADMIN" && !esSuperAdmin) {
      return alert("Solo TESTERADMIN puede crear usuarios TESTERADMIN.");
    }

    try {
      await userService.crear({ nombre, email, password, rol });
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("CLIENTE");
      await cargarDatos();
      alert("Usuario creado con exito");
    } catch (err) {
      alert("Error al crear usuario. Verifica los datos.");
    }
  };

  const eliminarUsuario = async (id) => {
    if (!confirm("Seguro que deseas eliminar este usuario?")) return;
    try {
      await userService.eliminar(id);
      await cargarDatos();
    } catch (err) {
      alert(err.message || "Error al eliminar usuario");
    }
  };

  const actualizarGruposUsuario = async (usuario, selectedOptions) => {
    if (normalizeRole(usuario.rol) !== "TECNICO") return;
    const grupoIds = Array.from(selectedOptions || []).map((o) => Number(o.value));
    try {
      setGuardandoGruposId(usuario.id);
      await userService.asignarGrupos(usuario.id, grupoIds);
      await cargarDatos();
    } catch (err) {
      alert(err.message || "Error al actualizar grupos del usuario");
    } finally {
      setGuardandoGruposId(null);
    }
  };

  const opcionesRol = ["CLIENTE", "TECNICO", "ADMIN", ...(esSuperAdmin ? ["TESTERADMIN"] : [])];

  return (
    <div className="bg-slate-50 p-8 font-sans min-h-full">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-800">Usuarios</h2>
        <p className="mt-1 text-sm text-slate-500">
          Crea usuarios y administra grupos de tecnicos. El cambio de rol se hace en la seccion Roles y Permisos.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Nuevo Usuario</h3>
          <form onSubmit={crearUsuario} className="space-y-3">
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Contrasena" value={password} onChange={(e) => setPassword(e.target.value)} />
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" value={rol} onChange={(e) => setRol(e.target.value)}>
              {opcionesRol.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">
              Crear Usuario
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden xl:col-span-2">
          <div className="grid grid-cols-12 gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            <div className="col-span-3">Usuario</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-3">Grupos (solo tecnico)</div>
            <div className="col-span-1 text-right">Accion</div>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {usuarios.map((u) => {
              const rolUsuario = normalizeRole(u.rol);
              const gruposUsuario = Array.isArray(u.grupos) ? u.grupos.map((g) => String(g.id)) : [];
              return (
                <div key={u.id} className="grid grid-cols-12 gap-2 px-5 py-3 text-sm border-b border-slate-50 items-center hover:bg-slate-50/60">
                  <div className="col-span-3 font-semibold text-slate-700">{u.nombre}</div>
                  <div className="col-span-3 text-slate-500">{u.email}</div>
                  <div className="col-span-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{rolUsuario}</span>
                  </div>
                  <div className="col-span-3">
                    {rolUsuario === "TECNICO" ? (
                      <select
                        multiple
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white h-20"
                        value={gruposUsuario}
                        disabled={guardandoGruposId === u.id}
                        onChange={(e) => actualizarGruposUsuario(u, e.target.selectedOptions)}
                      >
                        {grupos.map((g) => (
                          <option key={g.id} value={g.id}>{g.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-400">No aplica</span>
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => eliminarUsuario(u.id)} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                      Borrar
                    </button>
                  </div>
                </div>
              );
            })}
            {usuarios.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400">No hay usuarios registrados.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
