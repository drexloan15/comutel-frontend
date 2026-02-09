import { useState, useEffect } from 'react';

function AdminGroups() {
  const [grupos, setGrupos] = useState([]);
  const [nuevoGrupo, setNuevoGrupo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/grupos");
      if (res.ok) setGrupos(await res.json());
    } catch (error) {
      console.error("Error cargando grupos");
    }
  };

  const crearGrupo = async (e) => {
    e.preventDefault();
    if (!nuevoGrupo.trim()) return;

    const grupo = { nombre: nuevoGrupo, descripcion: descripcion };

    const res = await fetch("http://localhost:8080/api/grupos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grupo)
    });

    if (res.ok) {
      setNuevoGrupo("");
      setDescripcion("");
      cargarGrupos(); // Recargar lista
    }
  };

  const eliminarGrupo = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este grupo?")) return;
    await fetch(`http://localhost:8080/api/grupos/${id}`, { method: "DELETE" });
    cargarGrupos();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        🏢 Gestión de Grupos de Resolución
      </h2>

      <div className="flex gap-8">
        
        {/* FORMULARIO DE CREACIÓN */}
        <div className="w-1/3 bg-gray-50 p-4 rounded-lg h-fit">
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">Nuevo Grupo</h3>
          <form onSubmit={crearGrupo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Equipo</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: Soporte Nivel 2"
                value={nuevoGrupo}
                onChange={(e) => setNuevoGrupo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
              <textarea 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                placeholder="¿Qué hace este equipo?"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <button className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
              + Crear Grupo
            </button>
          </form>
        </div>

        {/* LISTA DE GRUPOS */}
        <div className="flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                <th className="py-2">ID</th>
                <th className="py-2">Nombre</th>
                <th className="py-2">Descripción</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grupos.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 group">
                  <td className="py-3 text-xs text-gray-400 font-mono">#{g.id}</td>
                  <td className="py-3 font-bold text-gray-700">{g.nombre}</td>
                  <td className="py-3 text-sm text-gray-600">{g.descripcion || "-"}</td>
                  <td className="py-3 text-right">
                    <button 
                      onClick={() => eliminarGrupo(g.id)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {grupos.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-400 italic">
                    No hay grupos creados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminGroups;