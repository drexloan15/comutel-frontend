import React, { useEffect, useState } from 'react';
import { ticketService } from '../services/ticketService';

function TicketTable({ alSeleccionar, usuarioActual }) {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroPrioridad, setFiltroPrioridad] = useState("TODAS");

  useEffect(() => {
    cargarTickets();
  }, []);

  const cargarTickets = async () => {
    setCargando(true);
    try {
      const data = await ticketService.listar();
      // Ordenar: Los más nuevos primero
      const ordenados = data.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
      setTickets(ordenados);
    } catch (error) { console.error(error); }
    finally { setCargando(false); }
  };

  // --- LÓGICA DE FILTRADO ---
  const ticketsFiltrados = tickets.filter(t => {
    const coincideTexto = 
        t.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
        t.id.toString().includes(busqueda) ||
        (t.usuario?.nombre || "").toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === "TODOS" || t.estado === filtroEstado;
    const coincidePrioridad = filtroPrioridad === "TODAS" || t.prioridad === filtroPrioridad;

    return coincideTexto && coincideEstado && coincidePrioridad;
  });

  // --- ACCIÓN: TOMAR CASO (Auto-asignar) ---
  const autoAsignar = async (e, ticketId) => {
      e.stopPropagation(); // Evitar que se abra el detalle al hacer click
      
      if (!usuarioActual || !usuarioActual.id) {
          alert("Error: No se ha identificado tu usuario.");
          return;
      }

      if(!window.confirm("¿Deseas asignarte este ticket y comenzar a trabajarlo?")) return;
      
      try {
          // Llamada al endpoint: /api/tickets/{id}/atender/{tecnicoId}
          await ticketService.atenderTicket(ticketId, usuarioActual.id); 
          // Recargamos la lista para ver el cambio (el botón desaparecerá)
          await cargarTickets(); 
          alert("✅ Ticket asignado correctamente.");
      } catch(e) { 
          console.error(e);
          alert("Error al asignar el ticket. Revisa la consola."); 
      }
  };

  // --- ACCIÓN: EXPORTAR A EXCEL (Formato CSV) ---
  const exportarExcel = () => {
      if (ticketsFiltrados.length === 0) return alert("No hay datos para exportar");

      // 1. Cabeceras
      const headers = ["ID", "Asunto", "Solicitante", "Prioridad", "Estado", "Grupo Asignado", "Tecnico", "Fecha Creacion"];
      
      // 2. Datos
      const rows = ticketsFiltrados.map(t => [
          t.id,
          `"${t.titulo.replace(/"/g, '""')}"`, // Escapar comillas para CSV
          t.usuario?.nombre || "Anonimo",
          t.prioridad,
          t.estado,
          t.grupoAsignado || "Sin Grupo",
          t.tecnico?.nombre || "Sin Asignar",
          new Date(t.fechaCreacion).toLocaleDateString()
      ]);

      // 3. Construir el CSV
      const csvContent = [
          headers.join(","), 
          ...rows.map(row => row.join(","))
      ].join("\n");

      // 4. Descargar
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Reporte_Tickets_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    // ELIMINADO 'h-full' y 'overflow-y-auto' para quitar la doble barra de scroll
    <div className="bg-slate-50 p-8 font-sans min-h-full">
      
      {/* 1. ENCABEZADO Y ACCIONES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Incidencias</h1>
            <p className="text-sm text-slate-500">Administra y resuelve los tickets reportados.</p>
        </div>
        <button 
            onClick={exportarExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
            <span>📊</span> Exportar Excel (CSV)
        </button>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
                type="text" 
                placeholder="Buscar por ID, Asunto, Usuario..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
            />
        </div>
        
        <select 
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:border-blue-500 bg-white"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
        >
            <option value="TODOS">Todos los Estados</option>
            <option value="NUEVO">🔵 Nuevos</option>
            <option value="EN_PROCESO">🟠 En Proceso</option>
            <option value="RESUELTO">🟢 Resueltos</option>
            <option value="CERRADO">⚫ Cerrados</option>
        </select>

        <select 
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:border-blue-500 bg-white"
            value={filtroPrioridad}
            onChange={e => setFiltroPrioridad(e.target.value)}
        >
            <option value="TODAS">Todas las Prioridades</option>
            <option value="CRITICA">🔥 Crítica</option>
            <option value="ALTA">🔴 Alta</option>
            <option value="MEDIA">🟡 Media</option>
            <option value="BAJA">🟢 Baja</option>
        </select>
      </div>

      {/* 3. TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="p-4">ID</th>
                        <th className="p-4 w-1/3">Asunto / Solicitante</th>
                        <th className="p-4">Prioridad</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Grupo</th> {/* NUEVA COLUMNA */}
                        <th className="p-4">Asignado a</th>
                        <th className="p-4 text-center">Fecha</th>
                        <th className="p-4 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                    {cargando ? (
                        <tr><td colSpan="8" className="p-8 text-center text-gray-400">Cargando tickets...</td></tr>
                    ) : ticketsFiltrados.length === 0 ? (
                        <tr><td colSpan="8" className="p-8 text-center text-gray-400">No se encontraron incidencias.</td></tr>
                    ) : (
                        ticketsFiltrados.map((t) => (
                            <tr 
                                key={t.id} 
                                onClick={() => alSeleccionar(t)}
                                className="hover:bg-blue-50/50 transition cursor-pointer group"
                            >
                                <td className="p-4 font-mono text-gray-400 text-xs">#{t.id}</td>
                                
                                <td className="p-4">
                                    <p className="font-bold text-gray-800 truncate max-w-[250px]">{t.titulo}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-gray-500">Por:</span>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                            {t.usuario?.nombre || "Anonimo"}
                                        </span>
                                    </div>
                                </td>

                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                                        t.prioridad === 'CRITICA' ? 'bg-red-50 text-red-600 border-red-100' :
                                        t.prioridad === 'ALTA' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        t.prioridad === 'MEDIA' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                        'bg-green-50 text-green-600 border-green-100'
                                    }`}>
                                        {t.prioridad}
                                    </span>
                                </td>

                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                        t.estado === 'NUEVO' ? 'bg-blue-100 text-blue-700' :
                                        t.estado === 'RESUELTO' ? 'bg-green-100 text-green-700' :
                                        t.estado === 'CERRADO' ? 'bg-gray-100 text-gray-600' :
                                        'bg-purple-100 text-purple-700'
                                    }`}>
                                        {t.estado}
                                    </span>
                                </td>

                                {/* NUEVA COLUMNA: GRUPO */}
                                <td className="p-4">
                                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                        {t.grupoAsignado || "Sin Grupo"}
                                    </span>
                                </td>

                                <td className="p-4">
                                    {t.tecnico ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold border border-teal-200">
                                                {t.tecnico.nombre.charAt(0)}
                                            </div>
                                            <span className="text-sm text-gray-600 truncate max-w-[100px]">{t.tecnico.nombre}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">-- Sin asignar --</span>
                                    )}
                                </td>

                                <td className="p-4 text-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-600">{new Date(t.fechaCreacion).toLocaleDateString()}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(t.fechaCreacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </td>

                                <td className="p-4 text-right">
                                    {!t.tecnico && t.estado !== 'RESUELTO' && t.estado !== 'CERRADO' ? (
                                        <button 
                                            onClick={(e) => autoAsignar(e, t.id)}
                                            className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded hover:bg-indigo-100 font-bold transition shadow-sm hover:shadow"
                                        >
                                            🙋‍♂️ Tomar Caso
                                        </button>
                                    ) : (
                                        <button className="text-gray-400 hover:text-blue-600 transition font-bold text-xl px-2">
                                            ➝
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
            <span>Mostrando <strong>{ticketsFiltrados.length}</strong> registros</span>
        </div>
      </div>
    </div>
  );
}

export default TicketTable;