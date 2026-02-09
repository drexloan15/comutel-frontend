import { useEffect, useState, useRef , useLayoutEffect} from "react";

function DetalleTicket({ ticket, usuarioActual, alVolver }) {
  const [comentarios, setComentarios] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
  const [notaCierre, setNotaCierre] = useState("");
  const [ticketData, setTicketData] = useState(ticket);// INICIALIZAMOS EL ESTADO CON EL TICKET QUE RECIBIMOS

  // Referencia para el scroll automático
  const mensajesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [esPrimeraCarga, setEsPrimeraCarga] = useState(true);

  // Cargar datos iniciales y polling
  useEffect(() => {
    cargarDatos(); 
    const intervalo = setInterval(() => cargarDatos(true), 3000);
    return () => clearInterval(intervalo);
  }, [ticketData.id]);

  // Efecto para bajar el scroll cuando llegan mensajes nuevos
  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // 1. Si es la primera vez que carga, bajamos sí o sí
    if (esPrimeraCarga && comentarios.length > 0) {
      mensajesEndRef.current?.scrollIntoView({ behavior: "auto" });
      setEsPrimeraCarga(false);
      return;
    }

    // 2. Medimos: ¿Qué tan lejos está el usuario del fondo?
    const { scrollHeight, scrollTop, clientHeight } = container;
    const distanciaDelFondo = scrollHeight - scrollTop - clientHeight;
    
    // 3. REGLA DE ORO: Solo bajamos si el usuario ya estaba cerca del fondo (ej. a menos de 150px)
    // Si el usuario subió para leer (distancia > 150), NO lo movemos.
    const estabaCercaDelFondo = distanciaDelFondo < 150;

    if (estabaCercaDelFondo) {
      mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comentarios]);

  const resolverTicket = async () => {
    if (!notaCierre.trim()) return alert("La nota de solución es obligatoria según ITIL.");

    try {
        const res = await fetch(`http://localhost:8080/api/tickets/${ticketData.id}/finalizar`, {
            method: "PUT",
            headers: { "Content-Type": "text/plain" }, // O application/json si ajustamos el backend
            body: notaCierre
        });

        if (res.ok) {
            alert("✅ Ticket resuelto correctamente.");
            setModalCierreAbierto(false);
            cargarDatos(); // Recargar para ver el estado actualizado
        } else {
            alert("❌ Error al finalizar ticketData.");
        }
    } catch (error) {
        console.error(error);
    }
  };
  

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setCargando(true);

    try {
      // A. REFRESCAR EL TICKET (¡NUEVO!)
      const resTicket = await fetch(`http://localhost:8080/api/tickets/${ticketData.id}`);
      
      if (resTicket.ok) { // <--- USAR resTicket
        const dataTicket = await resTicket.json(); // <--- USAR resTicket
        setTicketData(dataTicket); 
      }

      // B. Cargar Comentarios (Igual que antes)
      const resComentarios = await fetch(`http://localhost:8080/api/tickets/${ticketData.id}/comentarios`);
      const dataComentarios = await resComentarios.json();
      if (JSON.stringify(dataComentarios) !== JSON.stringify(comentarios)) {
          setComentarios(dataComentarios);
      }

      // C. Cargar Historial (Igual que antes)
      const resHistorial = await fetch(`http://localhost:8080/api/tickets/${ticketData.id}/historial`);
      if (resHistorial.ok) {
        const dataHistorial = await resHistorial.json();
        setHistorial(dataHistorial);
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return;

    const payload = {
      texto: nuevoComentario,
      autorId: usuarioActual.id
    };

    await fetch(`http://localhost:8080/api/tickets/${ticketData.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setNuevoComentario("");
    cargarDatos(true); // Recargar chat inmediatamente
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";
    const fecha = new Date(fechaString);
    return fecha.toLocaleString("es-PE", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const obtenerIconoAccion = (accion) => {
    if (accion === 'CREACIÓN') return '✨';
    if (accion === 'REASIGNACIÓN') return '🔀';
    if (accion === 'ATENCIÓN') return '👨‍🔧';
    if (accion === 'RESOLUCIÓN') return '✅';
    return '📝';
  };

  if (cargando) return <div className="p-10 text-center">Cargando expediente...</div>;

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={alVolver} className="text-gray-500 hover:text-blue-600 font-bold text-xl">← Volver</button>
        <h2 className="text-2xl font-bold text-gray-800">Expediente #{ticketData.id}: {ticketData.titulo}</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Descripción del Problema</h3>
            <p className="text-gray-800 text-lg leading-relaxed">{ticketData.descripcion}</p>
            <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span>📅 Creado: {formatearFecha(ticketData.fechaCreacion)}</span>
                <span>👤 Cliente: {ticketData.usuario?.nombre}</span>
            </div>
          </div>

          {/* CHAT */}
          <div className="bg-white p-6 rounded-lg shadow flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-gray-700 mb-4">💬 Comunicación</h3>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-96 p-2 bg-gray-50 rounded">
              {comentarios.length === 0 && <p className="text-center text-gray-400 mt-10">No hay comentarios aún.</p>}
              
              {comentarios.map((c) => (
                <div key={c.id} className={`flex ${c.autor?.email === usuarioActual.email ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                    c.autor?.email === usuarioActual.email ? 'bg-blue-100 text-blue-900' : 'bg-white text-gray-800 border'
                  }`}>
                    <p className="text-xs font-bold mb-1 opacity-70">{c.autor?.nombre}</p>
                    <p>{c.texto}</p>
                    <p className="text-[10px] text-right mt-1 opacity-50">{formatearFecha(c.fecha)}</p>
                  </div>
                </div>
              ))}
              
              {/* ANCLA PARA SCROLL AUTOMÁTICO */}
              <div ref={mensajesEndRef} />
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border p-2 rounded focus:outline-none focus:border-blue-500"
                placeholder="Escribe una respuesta..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviarComentario()}
              />
              <button onClick={enviarComentario} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Enviar
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (HISTORIAL) */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold text-gray-700 mb-4">Estado Actual</h3>

                <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Estado:</span>
                        <span className="font-bold text-blue-600">{ticketData.estado}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Grupo:</span>
                        <span className="font-bold text-indigo-600">{ticketData.grupoAsignado || "Sin asignar"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Técnico:</span>
                        <span className="font-bold">{ticketData.tecnico?.nombre || "Nadie"}</span>
                    </div>
                </div>
            </div>

            {/* PANEL DE ACCIONES */}
            <div className="mt-4">
                {ticketData.estado === 'EN_PROCESO' ? (
                    /* SI ESTÁ EN PROCESO: MOSTRAR BOTÓN DE RESOLVER */
                    <button 
                        onClick={() => setModalCierreAbierto(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                    >
                        ✅ Resolver Ticket
                    </button>
                ) : ticketData.estado === 'RESUELTO' ? (
                    /* SI YA ESTÁ RESUELTO: MOSTRAR MENSAJE DE ÉXITO */
                    <div className="w-full bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center font-bold">
                        🎉 Ticket Resuelto
                    </div>
                ) : (
                    /* OTROS ESTADOS (NUEVO, CERRADO) */
                    <div className="text-center text-gray-400 italic">
                        El ticket está {ticketData.estado}
                    </div>
                )}
            </div>

            {/* MODAL DE CIERRE (Overlay) */}
            {modalCierreAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-96 max-w-full m-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Finalizar Atención</h3>
                        <p className="text-sm text-gray-500 mb-2">Describe la solución técnica aplicada (requerido para Knowledge Base):</p>
                        
                        <textarea
                            className="w-full border p-2 rounded mb-4 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Ej: Se reinició el servicio de impresión y se actualizó el driver..."
                            value={notaCierre}
                            onChange={(e) => setNotaCierre(e.target.value)}
                        />
                        
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setModalCierreAbierto(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={resolverTicket}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
                            >
                                Confirmar Solución
                            </button>
                        </div>
                    </div>
                </div>
            )}




            <div className="bg-white p-6 rounded-lg shadow flex-1">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    🕵️‍♂️ Auditoría del Ticket
                </h3>
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                    {historial.map((h) => (
                        <div key={h.id} className="relative pl-6">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gray-200 rounded-full border-2 border-white"></div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-mono mb-1">{formatearFecha(h.fecha)}</span>
                                <span className="text-sm font-bold text-gray-700">{obtenerIconoAccion(h.accion)} {h.accion}</span>
                                <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">{h.detalle}</p>
                                <span className="text-[10px] text-gray-400 mt-1 text-right">Por: {h.actor?.nombre}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleTicket;