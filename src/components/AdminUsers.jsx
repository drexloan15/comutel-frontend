import { useEffect, useState } from "react";

function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "", email: "", password: "", rol: "TECNICO"
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const res = await fetch("http://localhost:8080/api/usuarios");
    const data = await res.json();
    setUsuarios(data);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.nombre || !nuevoUsuario.email) return;

    await fetch("http://localhost:8080/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoUsuario)
    });

    setNuevoUsuario({ nombre: "", email: "", password: "", rol: "TECNICO" });
    setMostrarFormulario(false);
    cargarUsuarios(); // Recargar tabla
  };

  const eliminarUsuario = async (id) => {
    if(!confirm("¿Estás seguro de eliminar este usuario?")) return;
    await fetch(`http://localhost:8080/api/usuarios/${id}`, { method: "DELETE" });
    cargarUsuarios();
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Personal</h2>
        <button 
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
            {mostrarFormulario ? "Cancelar" : "+ Nuevo Usuario"}
        </button>
      </div>

      {/* FORMULARIO DESPLEGABLE */}
      {mostrarFormulario && (
        <form onSubmit={guardarUsuario} className="bg-gray-50 p-4 rounded mb-6 border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
                type="text" placeholder="Nombre Completo" className="p-2 border rounded"
                value={nuevoUsuario.nombre}
                onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
            />
            <input 
                type="email" placeholder="Correo Electrónico" className="p-2 border rounded"
                value={nuevoUsuario.email}
                onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
            />
            <input 
                type="password" placeholder="Contraseña Temporal" className="p-2 border rounded"
                value={nuevoUsuario.password}
                onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
            />
            <select 
                className="p-2 border rounded"
                value={nuevoUsuario.rol}
                onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
            >
                <option value="CLIENTE">CLIENTE</option>
                <option value="TECNICO">TECNICO</option>
                <option value="ADMIN">ADMIN</option>
            </select>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded md:col-span-2 hover:bg-green-700">
                Guardar Usuario
            </button>
        </form>
      )}

      {/* TABLA DE USUARIOS */}
      <table className="w-full text-left border-collapse">
        <thead>
            <tr className="bg-slate-100 text-slate-600">
                <th className="p-3">ID</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3 text-right">Acciones</th>
            </tr>
        </thead>
        <tbody>
            {usuarios.map(u => (
                <tr key={u.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-gray-500">#{u.id}</td>
                    <td className="p-3 font-medium">{u.nombre}</td>
                    <td className="p-3 text-gray-600">{u.email}</td>
                    <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                            u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            u.rol === 'TECNICO' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                            {u.rol}
                        </span>
                    </td>
                    <td className="p-3 text-right">
                        <button 
                            onClick={() => eliminarUsuario(u.id)}
                            className="text-red-500 hover:underline text-sm"
                        >
                            Eliminar
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUsers;