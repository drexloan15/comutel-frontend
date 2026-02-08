import { useEffect, useState } from "react";

function TicketTable({ alSeleccionar }) { // <--- Recibimos la función del padre
  const [tickets, setTickets] = useState([]);
  const [grupos, setGrupos] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  
  // ID simulado (luego vendrá del login real)
  const USUARIO_ACTUAL_ID = 1; 

  useEffect(() => {
    cargarDatos();

    // Actualizar la tabla cada 10 segundos
    const intervalo = setInterval(() => {
        cargarDatos(true);
    }, 10000);

    return () => clearInterval(intervalo);
  }, []);

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setCargando(true);

    try {
      const resTickets = await fetch("http://localhost:8080/api/tickets");
      if (resTickets.ok) {
         const data = await resTickets.json();
         // Truco: Solo actualizamos si la longitud cambia o si queremos forzar (opcional)
         setTickets(data);
      }

      // Los grupos no hace falta cargarlos cada 10 segs, cambian poco.
      // Solo los cargamos si es la primera vez (!silencioso)
      if (!silencioso) {
          const resGrupos = await fetch("http://localhost:8080/api/grupos");
          if (resGrupos.ok) {
              setGrupos(await resGrupos.json());
          }
      }

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  // --- LÓGICA DE NEGOCIO ---
  const verificarSLA = (fechaVencimiento, estado) => {
    if (!fechaVencimiento || estado === "RESUELTO" || estado === "CERRADO") return false;
    return new Date() > new Date(fechaVencimiento);
  };

  const derivarGrupo = async (ticketId, grupoId) => {
    if (!confirm("¿Seguro que deseas derivar este ticket?")) return;
    try {
        // Detener propagación del clic para que no abra el detalle al seleccionar
        const url = `http://localhost:8080/api/tickets/${ticketId}/asignar-grupo/${grupoId}?actorId=${USUARIO_ACTUAL_ID}`;
        const response = await fetch(url, { method: "PUT" });
        if (response.ok) {
            alert("✅ Ticket derivado exitosamente.");
            cargarDatos();
        } else {
            alert("❌ Error al derivar.");
        }
    } catch (error) {
        console.error(error);
    }
  };

  const avanzarEstado = async (e, ticket) => {
    e.stopPropagation(); // Evita que se abra el detalle al hacer clic en el botón
    let url = "";
    if (ticket.estado === "NUEVO") url = `http://localhost:8080/api/tickets/${ticket.id}/atender/${USUARIO_ACTUAL_ID}`;
    else if (ticket.estado === "EN_PROCESO") url = `http://localhost:8080/api/tickets/${ticket.id}/finalizar`;

    if (url) {
        await fetch(url, { method: "PUT" });
        cargarDatos();
    }
  };

  const ticketsFiltrados = tickets.filter(t => filtroEstado === "TODOS" ? true : t.estado === filtroEstado);

  if (cargando) return <p className="text-center p-4 text-gray-500">Cargando sistema...</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Listado de Tickets</h2>
        
        <select 
          className="border p-2 rounded bg-gray-50 text-sm"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="NUEVO">Nuevos</option>
          <option value="EN_PROCESO">En Proceso</option>
          <option value="RESUELTO">Resueltos</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Asunto / SLA</th>
              <th className="py-3 px-4">Grupo Actual</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4">Acciones</th>
              <th className="py-3 px-4">Derivar</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {ticketsFiltrados.map((ticket) => {
              const esVencido = verificarSLA(ticket.fechaVencimiento, ticket.estado);

              return (
                <tr 
                    key={ticket.id} 
                    className="border-b hover:bg-blue-50 transition cursor-pointer group"
                    onClick={() => alSeleccionar && alSeleccionar(ticket)} // <--- CLIC EN LA FILA ABRE EL TICKET
                >
                  <td className="py-3 px-4 font-bold text-blue-600">#{ticket.id}</td>
                  
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800 group-hover:text-blue-700">{ticket.titulo}</div>
                    <div className="text-xs flex items-center gap-2 mt-1">
                        {esVencido ? (
                            <span className="text-red-600 font-bold bg-red-100 px-1 rounded">VENCIDO</span>
                        ) : (
                            <span className="text-green-600 bg-green-100 px-1 rounded">En tiempo</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] text-white ${
                            ticket.prioridad === 'ALTA' ? 'bg-red-500' : 'bg-blue-400'
                        }`}>{ticket.prioridad}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {ticket.grupoAsignado ? (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
                            {ticket.grupoAsignado}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs italic">Sin asignar</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        ticket.estado === 'NUEVO' ? 'bg-green-100 text-green-700' :
                        ticket.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.estado}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {ticket.estado === 'NUEVO' && (
                      <button onClick={(e) => avanzarEstado(e, ticket)} className="text-green-600 hover:underline font-bold bg-white border border-green-200 px-2 py-1 rounded hover:bg-green-50">
                        ▶ Atender
                      </button>
                    )}
                    {ticket.estado === 'EN_PROCESO' && (
                      <button onClick={(e) => avanzarEstado(e, ticket)} className="text-blue-600 hover:underline font-bold bg-white border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">
                        ✔ Finalizar
                      </button>
                    )}
                  </td>

                  {/* SELECTOR DE DERIVACIÓN (Con stopPropagation para no abrir el detalle al seleccionar) */}
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    {ticket.estado !== 'RESUELTO' && ticket.estado !== 'CERRADO' && (
                        <select 
                            className="border border-gray-300 rounded text-xs p-1 bg-white hover:border-blue-400 focus:outline-none"
                            onChange={(e) => derivarGrupo(ticket.id, e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>↪ Derivar...</option>
                            {Array.isArray(grupos) && grupos.map(g => (
                                <option key={g.id} value={g.id}>{g.nombre}</option>
                            ))}
                        </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ticketsFiltrados.length === 0 && <div className="p-4 text-center text-gray-400">No hay tickets.</div>}
      </div>
    </div>
  );
}

export default TicketTable;