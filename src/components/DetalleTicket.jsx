import { useEffect, useState, useRef } from "react";
import { ticketService } from '../services/ticketService';
import { groupService } from '../services/groupService';
import { buildApiUrl } from "../constants/api";
import ContadorSLA from './ContadorSLA'; 

// --- FLECHAS WORKFLOW ---
const WorkflowStep = ({ label, date, active, completed, isFirst, isLast }) => {
    let bgClass = "bg-gray-200 text-gray-400"; 
    if (completed) bgClass = "bg-[#5dbea3] text-white"; 
    if (active) bgClass = "bg-[#2bdebc] text-white";    
    const zIndex = active ? "z-20" : completed ? "z-10" : "z-0";

    return (
      <div className={`relative flex-1 h-16 flex flex-col justify-center items-center px-8 transition-all duration-300 ${bgClass} ${zIndex} chevron-step`}>
          <span className="font-bold text-sm uppercase tracking-wide">{label}</span>
          {date && <span className="text-[10px] font-medium opacity-90 mt-1">{date}</span>}
      </div>
    );
};

function DetalleTicket({ ticket, usuarioActual, alVolver }) {
  // --- ESTADOS ---
  const [ticketData, setTicketData] = useState(ticket);
  const [comentarios, setComentarios] = useState([]);
  const [adjuntos, setAdjuntos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [grupos, setGrupos] = useState([]); 
  
  // Estados para Activos
  const [activosVinculados, setActivosVinculados] = useState([]); 
  const [inventarioActivos, setInventarioActivos] = useState([]); 

  // --- UI ---
  const [activeTab, setActiveTab] = useState('PROGRESO'); 
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  // --- MODALES ---
  const [modalResolverOpen, setModalResolverOpen] = useState(false);
  const [modalEscalarOpen, setModalEscalarOpen] = useState(false);
  const [modalCorreoOpen, setModalCorreoOpen] = useState(false);
  const [modalActivosOpen, setModalActivosOpen] = useState(false);
  const [modalCrearActivoOpen, setModalCrearActivoOpen] = useState(false); // <--- NUEVO
  
  // Inputs Formularios
  const [notaCierre, setNotaCierre] = useState("");
  const [grupoEscalar, setGrupoEscalar] = useState("");
  const [asuntoCorreo, setAsuntoCorreo] = useState("");
  const [cuerpoCorreo, setCuerpoCorreo] = useState("");
  
  // Inputs Nuevo Activo
  const [nuevoActivo, setNuevoActivo] = useState({ nombre: "", codigo: "", tipo: "HARDWARE" });

  const mensajesEndRef = useRef(null);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => cargarDatos(true), 5000);
    return () => clearInterval(interval);
  }, [ticket.id]);

  const cargarDatos = async (silencioso = false) => {
    try {
      const tData = await ticketService.obtenerPorId(ticket.id);
      
      const [cData, aData, hData, gData] = await Promise.all([
        ticketService.listarComentarios(ticket.id),
        ticketService.listarAdjuntos(ticket.id),
        ticketService.listarHistorial(ticket.id),
        groupService.listar()
      ]);

      setTicketData(tData);
      // 👇 CORRECCIÓN: Leemos "activos" (que viene del nuevo DTO), si es null ponemos array vacío
      setActivosVinculados(tData.activos || []); 
      
      if (JSON.stringify(cData) !== JSON.stringify(comentarios)) setComentarios(cData);
      if (JSON.stringify(aData) !== JSON.stringify(adjuntos)) setAdjuntos(aData);
      setHistorial(hData);
      setGrupos(gData);
    } catch (error) { console.error(error); } 
  };

  // --- ACCIONES GENERALES ---
  const handleEscalar = async () => { /* ... igual que antes ... */ 
      if(!grupoEscalar) return alert("Selecciona grupo");
      try {
        await ticketService.asignarGrupo(ticketData.id, grupoEscalar, usuarioActual.id);
        setModalEscalarOpen(false);
        setGrupoEscalar("");
        cargarDatos();
        alert("Ticket escalado correctamente.");
      } catch (e) {
        console.error(e);
        alert("No se pudo escalar el ticket.");
      }
  };
  const handleResolver = async () => { /* ... igual que antes ... */ 
      if(!notaCierre.trim()) return;
      try {
        await ticketService.resolver(ticketData.id, notaCierre);
        setModalResolverOpen(false);
        setNotaCierre("");
        cargarDatos();
        alert("Ticket resuelto correctamente.");
      } catch (e) {
        console.error(e);
        alert("No se pudo resolver el ticket.");
      }
  };
  const handleEnviarCorreo = async () => { /* ... igual que antes ... */ 
       if(!asuntoCorreo.trim()) return alert("Ingresa un asunto");
       try {
         await ticketService.enviarCorreoManual(ticketData.id, asuntoCorreo, cuerpoCorreo);
         setModalCorreoOpen(false);
         setAsuntoCorreo("");
         setCuerpoCorreo("");
         alert("Correo enviado correctamente.");
       } catch (e) {
         console.error(e);
         alert("No se pudo enviar el correo.");
       }
  };
  const handleIniciarChat = async () => { 
      try {
        await ticketService.iniciarChat(ticketData.id, usuarioActual.id);
        alert("Notificado");
      } catch (e) {
        console.error(e);
        alert("No se pudo iniciar chat.");
      }
  };

  // --- LÓGICA ACTIVOS ---
  const abrirModalActivos = async () => {
      const lista = await ticketService.listarActivosInventario();
      setInventarioActivos(lista);
      setModalActivosOpen(true);
  };

  const vincularActivo = async (activoId) => {
      await ticketService.vincularActivo(ticketData.id, activoId);
      // Cerramos modal y recargamos para ver el cambio
      setModalActivosOpen(false);
      cargarDatos(); 
  };

  const handleCrearActivo = async () => {
      if (!nuevoActivo.nombre || !nuevoActivo.codigo) return alert("Completa los datos");
      
      // 1. Crear en Backend
      await ticketService.crearActivo(nuevoActivo);
      
      // 2. Limpiar form
      setNuevoActivo({ nombre: "", codigo: "", tipo: "HARDWARE" });
      setModalCrearActivoOpen(false);
      
      // 3. Volver a abrir el modal de selección para vincular el nuevo
      abrirModalActivos();
  };

  // --- CHAT ---
  const enviarMensaje = async () => {
    if (!nuevoComentario.trim() && !archivoSeleccionado) return;
    let imgUrl = null;
    try {
        if (archivoSeleccionado) {
           const res = await ticketService.subirAdjunto(ticketData.id, archivoSeleccionado, usuarioActual.id);
           imgUrl = res.url;
           setArchivoSeleccionado(null);
        }
        await ticketService.agregarComentario(ticketData.id, { 
            texto: nuevoComentario || (imgUrl ? "Adjuntó archivo" : "."), 
            autorId: usuarioActual.id,
            imagen: imgUrl 
        });
        setNuevoComentario("");
        cargarDatos(true);
    } catch(e) { alert("Error enviando mensaje"); }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 font-sans">
        
        {/* HEADER Y WORKFLOW (IGUAL QUE ANTES) */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center border border-gray-100">
             <div className="flex items-center gap-4">
                <button onClick={alVolver} className="w-8 h-8 rounded-full bg-gray-100 font-bold text-gray-600">←</button>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span className="bg-orange-100 text-orange-600 p-1 rounded text-sm">#{ticketData.id}</span> {ticketData.titulo}</h1>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setModalEscalarOpen(true)} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-bold text-sm shadow-sm">⬆ Escalar</button>
                <button onClick={() => setModalCorreoOpen(true)} className="px-4 py-2 bg-white border border-gray-200 text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-sm shadow-sm">📧 Enviar Correo</button>
                {ticketData.estado !== 'RESUELTO' && ticketData.estado !== 'CERRADO' && (
                    <button onClick={() => setModalResolverOpen(true)} className="px-4 py-2 bg-white border border-gray-200 text-green-600 rounded-lg hover:bg-green-50 font-bold text-sm shadow-sm">✅ Resolver</button>
                )}
            </div>
        </div>

        <div className="flex w-full mb-8 filter drop-shadow-md px-1">
            <WorkflowStep label="Clasificación" date={new Date(ticketData.fechaCreacion).toLocaleDateString()} completed={true} isFirst={true} />
            <WorkflowStep label="En Progreso" date={ticketData.estado === 'EN_PROCESO' ? 'En atención' : ''} active={ticketData.estado === 'EN_PROCESO'} completed={ticketData.estado === 'RESUELTO' || ticketData.estado === 'CERRADO'} />
            <WorkflowStep label="Resuelto" active={ticketData.estado === 'RESUELTO'} completed={ticketData.estado === 'CERRADO'} isLast={true} />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="flex border-b">
                    {['PROGRESO', 'ANEXOS', 'ACTIVOS', 'LOG'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-bold border-b-2 transition ${activeTab === tab ? 'border-teal-500 text-teal-600 bg-teal-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {tab === 'PROGRESO' ? 'Progreso' : tab === 'ANEXOS' ? `Anexos` : tab === 'ACTIVOS' ? `Activos` : 'Log'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 relative">
                    {activeTab === 'PROGRESO' && (
                        /* CHAT CODE (Sin cambios) */
                        <>
                             <div className="flex items-start gap-4 mb-8">
                                <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-lg">{ticketData.usuario?.nombre.charAt(0)}</div>
                                <div>
                                    <p className="font-bold text-gray-800">{ticketData.usuario?.nombre}</p>
                                    <p className="text-gray-600 mt-1">{ticketData.descripcion}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6 pb-20">
                                {comentarios.map((c) => (
                                    <div key={c.id} className={`flex gap-3 w-full ${c.autor?.id === usuarioActual.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-4 shadow-sm border text-sm break-words w-fit ${c.autor?.id === usuarioActual.id ? 'bg-teal-50 border-teal-100 text-gray-800 rounded-2xl rounded-tr-none' : 'bg-white border-gray-200 text-gray-700 rounded-2xl rounded-tl-none'}`}>
                                            {c.imagenUrl && <a href={buildApiUrl(`/adjuntos/ver/${c.imagenUrl}`)} target="_blank"><img src={buildApiUrl(`/adjuntos/ver/${c.imagenUrl}`)} className="rounded-lg max-h-48 mb-2 border"/></a>}
                                            <p>{c.texto}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={mensajesEndRef} />
                            </div>
                        </>
                    )}

                    {/* --- PESTAÑA ANEXOS (MEJORADA) --- */}
                    {activeTab === 'ANEXOS' && (
                        <div className="p-2 animate-fade-in">
                            {/* Cabecera con Acción Rápida */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Galería de Adjuntos</h3>
                                    <p className="text-xs text-gray-500">Documentos e imágenes compartidos en este ticket.</p>
                                </div>
                                <label className="bg-teal-50 text-teal-700 border border-teal-200 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-teal-100 flex items-center gap-2 transition shadow-sm">
                                    <span>☁️ Subir Archivo</span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            if(e.target.files[0]) {
                                                // Subida directa desde esta pestaña
                                                ticketService.subirAdjunto(ticketData.id, e.target.files[0], usuarioActual.id)
                                                    .then(() => cargarDatos());
                                            }
                                        }} 
                                    />
                                </label>
                            </div>

                            {/* Grid de Archivos */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                
                                {/* 1. Tarjeta "Subir Nuevo" (Placeholder) */}
                                <label className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 hover:bg-teal-50/30 transition cursor-pointer bg-gray-50 h-56 group">
                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition">
                                        <span className="text-2xl text-teal-500">+</span>
                                    </div>
                                    <span className="text-sm font-bold">Agregar nuevo</span>
                                    <span className="text-[10px] mt-1 text-center px-4">Arrastra o haz clic para subir</span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            if(e.target.files[0]) {
                                                ticketService.subirAdjunto(ticketData.id, e.target.files[0], usuarioActual.id)
                                                    .then(() => cargarDatos());
                                            }
                                        }} 
                                    />
                                </label>

                                {/* 2. Lista de Archivos */}
                                {adjuntos.map(a => {
                                    const esImagen = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(a.nombreArchivo);
                                    const extension = a.nombreArchivo.split('.').pop().toUpperCase();
                                    
                                    return (
                                        <div key={a.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-56">
                                            
                                            {/* Zona de Previsualización */}
                                            <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                                {esImagen ? (
                                                    <img 
                                                        src={buildApiUrl(`/adjuntos/ver/${a.url}`)} 
                                                        alt={a.nombreArchivo} 
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    // Icono genérico bonito según tipo
                                                    <div className={`text-5xl ${extension === 'PDF' ? 'text-red-500' : extension.includes('XLS') ? 'text-green-600' : 'text-blue-500'}`}>
                                                        {extension === 'PDF' ? '📄' : '📁'}
                                                    </div>
                                                )}

                                                {/* Overlay (Capa oscura al pasar mouse) */}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                                                    <a 
                                                        href={buildApiUrl(`/adjuntos/ver/${a.url}`)} 
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="bg-white text-gray-800 p-3 rounded-full hover:bg-teal-500 hover:text-white transition shadow-lg transform hover:scale-110 flex items-center justify-center"
                                                        title="Descargar / Ver"
                                                    >
                                                        ⬇️
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Info del Archivo */}
                                            <div className="p-4 flex flex-col justify-between flex-1 bg-white relative">
                                                <div className="absolute -top-3 right-3 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded border border-gray-200 shadow-sm uppercase">
                                                    {extension}
                                                </div>
                                                
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700 truncate mb-1" title={a.nombreArchivo}>
                                                        {a.nombreArchivo}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        📅 {new Date(a.fechaSubida).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                
                                                <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                                     <div className="h-full bg-teal-400 w-full opacity-30"></div> {/* Barra decorativa */}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- PESTAÑA ACTIVOS (FIXED) --- */}
                    {activeTab === 'ACTIVOS' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-700">Hardware/Software Vinculado</h3>
                                <button onClick={abrirModalActivos} className="text-blue-600 text-sm font-bold hover:underline bg-blue-50 px-3 py-1 rounded">+ Vincular Activo</button>
                            </div>
                            {activosVinculados.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                                    <p className="text-gray-400">No hay activos vinculados.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activosVinculados.map(activo => (
                                        <div key={activo.id} className="bg-white p-4 rounded border flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{activo.tipo === 'HARDWARE' ? '💻' : '💿'}</span>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{activo.nombre}</p>
                                                    <p className="text-xs text-gray-500">{activo.codigo}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Vinculado</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'LOG' && (
                        <div className="border-l-2 border-gray-200 ml-4 space-y-6">
                            {historial.map(h => <div key={h.id} className="pl-6"><span className="text-xs text-gray-400">{new Date(h.fecha).toLocaleString()}</span><p className="font-bold text-sm">{h.accion}</p><p className="text-sm bg-white p-2 border rounded">{h.detalle}</p></div>)}
                        </div>
                    )}
                </div>

                {activeTab === 'PROGRESO' && (
                    <div className="p-4 bg-white border-t sticky bottom-0 z-30 flex gap-2">
                        <input className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 outline-none" placeholder="Escribe..." value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()} />
                        <button onClick={enviarMensaje} className="bg-teal-500 text-white w-10 h-10 rounded-full font-bold">➤</button>
                    </div>
                )}
            </div>
            
            {/* SIDEBAR DERECHO (RESTAURADO) */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                
                {/* 1. TARJETA SLA */}
                <div className="bg-orange-500 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl">⏱</div>
                    <p className="text-xs font-bold uppercase opacity-90 mb-1">Ticket SLA</p>
                    <p className="text-sm opacity-90 mb-2">{ticketData.prioridad}</p>
                    <div className="bg-white/20 rounded p-2 text-center backdrop-blur-sm">
                        <ContadorSLA fechaCreacion={ticketData.fechaCreacion} prioridad={ticketData.prioridad} estado={ticketData.estado} />
                    </div>
                    {/* Fecha objetivo opcional */}
                    <div className="mt-3 text-[10px] opacity-80 text-center">
                        Vence: {new Date(new Date(ticketData.fechaCreacion).getTime() + (ticketData.prioridad==='ALTA'?8:24)*3600000).toLocaleString()}
                    </div>
                </div>

                {/* 2. TARJETA INFORMACIÓN DETALLADA */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h3 className="font-bold text-gray-800 text-lg border-b pb-2">Información</h3>
                    
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Fecha Informe</p>
                        <p className="text-sm font-medium text-gray-700">{new Date(ticketData.fechaCreacion).toLocaleString()}</p>
                    </div>

                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Creado por</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                👤
                            </div>
                            <p className="text-sm font-medium text-gray-700">{ticketData.usuario?.nombre}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Estado Actual</p>
                        <span className={`px-2 py-1 rounded text-xs font-bold inline-block mt-1
                            ${ticketData.estado==='NUEVO'?'bg-blue-100 text-blue-700':
                              ticketData.estado==='RESUELTO'?'bg-green-100 text-green-700':
                              'bg-purple-100 text-purple-700'}`}>
                            {ticketData.estado}
                        </span>
                    </div>

                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Agente Asignado</p>
                        <div className="flex items-center gap-3 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs border border-teal-200">
                                {ticketData.tecnico?.nombre ? ticketData.tecnico.nombre.charAt(0) : '?'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-teal-700 truncate">{ticketData.tecnico?.nombre || "Sin Asignar"}</p>
                                <p className="text-[10px] text-gray-500 truncate">{ticketData.grupoAsignado || "Mesa de Ayuda"}</p>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleIniciarChat} 
                        className="w-full border border-gray-200 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 flex items-center justify-center gap-2 transition duration-200"
                    >
                        💬 Iniciar Chat
                    </button>
                </div>
            </div>
          </div>

        {/* --- MODALES --- */}
        {modalEscalarOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl w-96">
                    <h3 className="font-bold mb-3">Escalar Ticket</h3>
                    <p className="text-sm text-gray-500 mb-3">Selecciona el grupo al que se derivara el caso.</p>
                    <select
                        className="w-full border border-gray-200 rounded p-2 mb-4"
                        value={grupoEscalar}
                        onChange={(e) => setGrupoEscalar(e.target.value)}
                    >
                        <option value="">Selecciona un grupo</option>
                        {grupos.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.nombre}
                            </option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setModalEscalarOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                        <button onClick={handleEscalar} className="bg-blue-600 text-white px-4 py-2 rounded">Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {modalCorreoOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl w-[480px] max-w-[95vw]">
                    <h3 className="font-bold mb-3">Enviar Correo Manual</h3>
                    <input
                        className="w-full border border-gray-200 rounded p-2 mb-3"
                        placeholder="Asunto"
                        value={asuntoCorreo}
                        onChange={(e) => setAsuntoCorreo(e.target.value)}
                    />
                    <textarea
                        className="w-full border border-gray-200 rounded p-2 mb-4 min-h-32"
                        placeholder="Mensaje"
                        value={cuerpoCorreo}
                        onChange={(e) => setCuerpoCorreo(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setModalCorreoOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                        <button onClick={handleEnviarCorreo} className="bg-blue-600 text-white px-4 py-2 rounded">Enviar</button>
                    </div>
                </div>
            </div>
        )}

        {modalResolverOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl w-96"><h3 className="font-bold mb-2">Resolver</h3><textarea className="w-full border p-2 mb-2" onChange={e=>setNotaCierre(e.target.value)}/><button onClick={handleResolver} className="bg-green-600 text-white px-4 py-2 rounded">Confirmar</button></div>
            </div>
        )}

        {modalEscalarOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl w-96">
                    <h3 className="font-bold mb-4">Escalar Ticket</h3>
                    <select
                        className="w-full border p-2 mb-4 rounded"
                        value={grupoEscalar}
                        onChange={(e) => setGrupoEscalar(e.target.value)}
                    >
                        <option value="">Selecciona un grupo</option>
                        {grupos.map((g) => (
                            <option key={g.id} value={g.id}>{g.nombre}</option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setModalEscalarOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                        <button onClick={handleEscalar} className="px-4 py-2 bg-blue-600 text-white rounded">Escalar</button>
                    </div>
                </div>
            </div>
        )}

        {modalCorreoOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl w-[520px]">
                    <h3 className="font-bold mb-4">Enviar Correo</h3>
                    <input
                        className="w-full border p-2 mb-3 rounded"
                        placeholder="Asunto"
                        value={asuntoCorreo}
                        onChange={(e) => setAsuntoCorreo(e.target.value)}
                    />
                    <textarea
                        className="w-full border p-2 mb-4 rounded"
                        rows={5}
                        placeholder="Mensaje"
                        value={cuerpoCorreo}
                        onChange={(e) => setCuerpoCorreo(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setModalCorreoOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                        <button onClick={handleEnviarCorreo} className="px-4 py-2 bg-blue-600 text-white rounded">Enviar</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* MODAL SELECCIONAR ACTIVO */}
        {modalActivosOpen && (
             <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white p-8 rounded-xl w-[500px] shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800">🔗 Vincular Activo</h3>
                        <button onClick={() => setModalCrearActivoOpen(true)} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">+ Nuevo</button>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto border rounded divide-y mb-6">
                        {inventarioActivos.length === 0 ? <p className="p-4 text-center text-gray-400">Inventario vacío.</p> : (
                            inventarioActivos.map(activo => (
                                <div key={activo.id} className="p-3 hover:bg-gray-50 flex justify-between items-center cursor-pointer" onClick={() => vincularActivo(activo.id)}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{activo.tipo === 'HARDWARE' ? '💻' : '💿'}</span>
                                        <div><p className="font-bold text-sm">{activo.nombre}</p><p className="text-xs text-gray-500">{activo.codigo}</p></div>
                                    </div>
                                    <button className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Vincular</button>
                                </div>
                            ))
                        )}
                    </div>
                    <button onClick={()=>setModalActivosOpen(false)} className="text-gray-500 underline text-sm">Cerrar</button>
                </div>
            </div>
        )}

        {/* MODAL CREAR NUEVO ACTIVO (FORMULARIO REAL) */}
        {modalCrearActivoOpen && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
                <div className="bg-white p-8 rounded-xl w-96 shadow-2xl border-2 border-green-100">
                    <h3 className="font-bold text-xl mb-4 text-gray-800">✨ Crear Nuevo Activo</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Equipo</label>
                            <input className="w-full border p-2 rounded outline-none focus:border-green-500" placeholder="Ej: Laptop HP ProBook" value={nuevoActivo.nombre} onChange={e=>setNuevoActivo({...nuevoActivo, nombre: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Código / Serie</label>
                            <input className="w-full border p-2 rounded outline-none focus:border-green-500" placeholder="Ej: NB-2024-001" value={nuevoActivo.codigo} onChange={e=>setNuevoActivo({...nuevoActivo, codigo: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                            <select className="w-full border p-2 rounded outline-none" value={nuevoActivo.tipo} onChange={e=>setNuevoActivo({...nuevoActivo, tipo: e.target.value})}>
                                <option value="HARDWARE">💻 Hardware</option>
                                <option value="SOFTWARE">💿 Software</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={()=>setModalCrearActivoOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                        <button onClick={handleCrearActivo} className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">Guardar</button>
                    </div>
                </div>
            </div>
        )}

        <style>{`.chevron-step { clip-path: polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%); margin-right: -1.5rem; } .chevron-step:first-child { clip-path: polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%); } .chevron-step:last-child { margin-right: 0; padding-right: 2rem; }`}</style>
    </div>
  );
}

export default DetalleTicket;
