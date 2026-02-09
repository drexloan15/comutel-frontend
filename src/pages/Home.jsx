import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [metricas, setMetricas] = useState({
    total: 0, nuevos: 0, proceso: 0, resueltos: 0, criticos: 0
  });
  const [ticketsCriticos, setTicketsCriticos] = useState([]);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      // 1. Cargar Números Generales
      const resMetricas = await fetch("http://localhost:8080/api/tickets/metricas");
      if (resMetricas.ok) setMetricas(await resMetricas.json());

      // 2. Cargar Lista de Alertas (Tickets que NO están resueltos)
      // En un sistema real, harías un endpoint específico tipo /api/tickets/urgentes
      // Aquí filtramos en el frontend temporalmente
      const resTickets = await fetch("http://localhost:8080/api/tickets");
      if (resTickets.ok) {
        const todos = await resTickets.json();
        // Filtramos: Alta Prioridad y NO resueltos
        const urgentes = todos.filter(t => t.prioridad === 'ALTA' && t.estado !== 'RESUELTO');
        setTicketsCriticos(urgentes);
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  return (
    <div className="p-6 space-y-8">
      
      {/* 1. HEADER DE BIENVENIDA */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Centro de Comando ITSM</h1>
        <p className="text-gray-500">Resumen operativo en tiempo real.</p>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS (WIDGETS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Widget: Total */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-400 uppercase">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-800">{metricas?.total || 0}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full text-2xl">📂</div>
        </div>

        {/* Widget: Pendientes (Nuevos) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-400 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-400 uppercase">Por Asignar</p>
                <p className="text-3xl font-bold text-yellow-600">{metricas?.nuevos || 0}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full text-2xl">🆕</div>
        </div>

        {/* Widget: En Proceso */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-400 uppercase">En Atención</p>
                <p className="text-3xl font-bold text-blue-600">{metricas?.proceso || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-2xl">👨‍🔧</div>
        </div>

        {/* Widget: Críticos (Alerta) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-400 uppercase">Prioridad Alta</p>
                <p className="text-3xl font-bold text-red-600">{metricas.criticos}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full text-2xl animate-pulse">🔥</div>
        </div>
      </div>

      {/* 3. SECCIÓN DE ALERTAS Y ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: ALERTAS DE INCIDENCIAS (Ocupa 2 espacios) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                <h3 className="font-bold text-red-800 flex items-center gap-2">
                    🚨 Atención Inmediata ({ticketsCriticos.length})
                </h3>
                <Link to="/tickets" className="text-xs font-bold text-red-600 hover:underline">Ver todos los tickets →</Link>
            </div>
            
            <div className="p-0">
                {ticketsCriticos?.length === 0 ? (
                    <div className="p-8 text-center text-green-600">
                        <span className="text-4xl block mb-2">✅</span>
                        <p>¡Todo bajo control! No hay incidentes críticos pendientes.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Asunto</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ticketsCriticos?.slice(0, 5).map(t => (
                                <tr key={t.id} className="hover:bg-red-50 transition">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">#{t.id}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{t.titulo}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-white border border-red-200 text-red-600 text-xs rounded font-bold">
                                            {t.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link 
                                            to={`/tickets/${t.id}`}
                                            className="text-blue-600 hover:underline text-sm font-bold"
                                        >
                                            Gestionar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: ACCIONES RÁPIDAS */}
        <div className="space-y-6">
            {/* Tarjeta de SLA (Simulada por ahora) */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
                <h3 className="font-bold text-lg mb-2">Salud del Servicio (SLA)</h3>
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-green-400">98.5%</span>
                    <span className="text-sm text-slate-400 mb-1">cumplimiento</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[98.5%]"></div>
                </div>
                <p className="text-xs text-slate-400 mt-4">Calculado sobre los últimos 30 días.</p>
            </div>

            {/* Accesos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-700 mb-4">Accesos Directos</h3>
                <div className="space-y-3">
                    <Link to="/tickets" className="block w-full text-center py-2 px-4 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition font-bold">
                        🔍 Buscar Ticket
                    </Link>
                    {/* Botón para Knowledge Base (Futuro) */}
                    <button className="block w-full text-center py-2 px-4 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition">
                        📚 Base de Conocimiento
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default Home;