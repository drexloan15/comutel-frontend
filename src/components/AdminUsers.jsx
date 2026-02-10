import { useState, useEffect } from 'react';
import { userService } from '../services/userService'; // Importamos el servicio

function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  // Formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("CLIENTE"); // Valor por defecto
  
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const data = await userService.listar();
      setUsuarios(data);
      setError(null);
    } catch (err) {
      setError("Error cargando la lista de usuarios.");
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !password.trim()) {
        return alert("Todos los campos son obligatorios");
    }

    const nuevoUsuario = { nombre, email, password, rol };

    try {
      await userService.crear(nuevoUsuario);
      // Limpiar formulario
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("CLIENTE");
      alert("✅ Usuario creado con éxito");
      cargarUsuarios();
    } catch (err) {
      alert("❌ Error al crear usuario. Verifica los datos.");
    }
  };

  const eliminarUsuario = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      await userService.eliminar(id);
      cargarUsuarios();
    } catch (err) {
      // Aquí mostramos el mensaje del backend (ej: si tiene tickets)
      alert("⚠️ " + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        👥 Gestión de Usuarios
      </h2>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex gap-8">
        
        {/* FORMULARIO */}
        <div className="w-1/3 bg-gray-50 p-4 rounded-lg h-fit">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">Nuevo Usuario</h3>
          <form onSubmit={crearUsuario} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700">Nombre</label>
              <input type="text" className="w-full border p-2 rounded" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Email</label>
              <input type="email" className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@empresa.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Contraseña</label>
              <input type="password" className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} placeholder="******" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700">Rol</label>
              <select className="w-full border p-2 rounded bg-white" value={rol} onChange={e => setRol(e.target.value)}>
                <option value="CLIENTE">Cliente</option>
                <option value="TECNICO">Técnico</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <button className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
              + Registrar Usuario
            </button>
          </form>
        </div>

        {/* LISTA */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-500 text-xs uppercase">
                <th className="py-2">Nombre</th>
                <th className="py-2">Email</th>
                <th className="py-2">Rol</th>
                <th className="py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 font-bold text-gray-700">{u.nombre}</td>
                  <td className="py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded font-bold border ${
                      u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      u.rol === 'TECNICO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => eliminarUsuario(u.id)} className="text-red-400 hover:text-red-600">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;