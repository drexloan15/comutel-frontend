import React, { useState, useEffect, useRef } from 'react';
import { ticketService } from '../services/ticketService';
import { kbService } from '../services/kbService'; 
import { catalogoService } from '../services/catalogoService';

// --- UTILIDAD: Limpieza profunda de texto ---
const stripHtml = (html) => {
    if (!html) return "";
    // 1. Reemplazar &nbsp; por espacios normales para permitir saltos de línea
    let text = html.replace(/&nbsp;/g, ' ');
    // 2. Extraer solo texto
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.body.textContent || "";
};

// --- COMPONENTE: CHAT ---
const ClienteChat = ({ ticket, usuario, onVolver, onEnviarMensaje }) => {
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const endRef = useRef(null);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        cargarMensajes();
        const intervalo = setInterval(cargarMensajes, 3000);
        return () => clearInterval(intervalo);
    }, [ticket.id]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

    const cargarMensajes = async () => {
        try {
            const data = await ticketService.listarComentarios(ticket.id);
            setMensajes(data || []);
        } catch (e) { console.error("Error chat", e); }
    };

    const enviar = async (e) => {
        e.preventDefault();
        if(!nuevoMensaje.trim()) return;
        setEnviando(true);
        try {
            await onEnviarMensaje(ticket.id, nuevoMensaje);
            setNuevoMensaje("");
            await cargarMensajes(); 
        } finally { setEnviando(false); }
    };

    return (
        <div className="max-w-4xl mx-auto mt-8 h-[80vh] flex flex-col animate-fade-in-up px-4 w-full">
            <button onClick={onVolver} className="mb-4 text-slate-500 hover:text-blue-600 font-bold flex items-center gap-2 text-sm w-fit">
                ← Volver
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col flex-1 w-full">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                    <div className="overflow-hidden">
                        <span className="text-xs font-mono text-slate-400 block mb-1">TICKET #{ticket.id}</span>
                        <h2 className="font-bold text-slate-800 text-lg leading-tight truncate">{ticket.titulo}</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${ticket.estado === 'RESUELTO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ticket.estado}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    {(mensajes || []).map((m) => {
                        const esMio = m.autor?.id === usuario.id;
                        return (
                            <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm relative break-words ${esMio ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}`}>
                                    <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                                    <span className="text-[10px] block mt-2 opacity-70 text-right">
                                        {new Date(m.fechaCreacion).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={endRef} />
                </div>

                {ticket.estado !== 'CERRADO' && (
                    <form onSubmit={enviar} className="p-4 bg-white border-t border-slate-100 flex gap-3">
                        <input className="flex-1 bg-slate-100 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 transition w-full" placeholder="Escribe un mensaje..." value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} />
                        <button type="submit" disabled={enviando} className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-700 shrink-0">➤</button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
function ClientePortal({ usuario, cerrarSesion, esSuperAdmin = false, onAlternarVista }) {
    const [vista, setVista] = useState('HOME'); 
    const [tickets, setTickets] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [articuloLeido, setArticuloLeido] = useState(null);
    const [ticketActivo, setTicketActivo] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [tiposTicket, setTiposTicket] = useState([]);
    const [categoriasTicket, setCategoriasTicket] = useState([]);
    const [nuevoTicket, setNuevoTicket] = useState({
        titulo: "",
        descripcion: "",
        prioridad: "MEDIA",
        processType: "",
        workflowKey: "",
        categoriaId: "",
    });
    const articulosFiltrados = articulos.filter((a) =>
        a.titulo.toLowerCase().includes(busqueda.toLowerCase())
    );

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
            const [dataTickets, dataKb, tiposData, categoriasData] = await Promise.all([
                ticketService.listar(),
                kbService.listar(),
                catalogoService.listarTipos(),
                catalogoService.listarCategorias()
            ]);
            setTickets(dataTickets.filter(t => t.usuario?.id === usuario.id).sort((a,b) => b.id - a.id));
            setArticulos(dataKb);
            setTiposTicket(Array.isArray(tiposData) ? tiposData : []);
            setCategoriasTicket(Array.isArray(categoriasData) ? categoriasData : []);
        } catch (e) { console.error(e); }
    };

    const handleCrear = async (e) => {
        e.preventDefault();
        try {
            await ticketService.crear({ ...nuevoTicket, usuarioId: usuario.id });
            alert("✅ Solicitud enviada");
            setNuevoTicket({
                titulo: "",
                descripcion: "",
                prioridad: "MEDIA",
                processType: "",
                workflowKey: "",
                categoriaId: "",
            });
            setVista('HOME');
            cargarDatos();
        } catch (e) { alert("Error al crear ticket"); }
    };

    const categoriasFiltradas = !nuevoTicket.processType
        ? categoriasTicket
        : categoriasTicket.filter((c) => String(c.processType || "").toUpperCase() === nuevoTicket.processType);

    const handleEnviarMensajeChat = async (ticketId, texto) => {
        await ticketService.agregarComentario(ticketId, { texto, autorId: usuario.id });
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] font-sans text-slate-800 overflow-x-hidden">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setVista('HOME')}>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                        <span className="font-bold text-lg hidden md:block">Centro de Ayuda</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-700">{usuario.nombre}</span>
                            <span className="text-[10px] text-slate-400 uppercase">Cliente Corporativo</span>
                        </div>
                        {esSuperAdmin && (
                            <button
                                onClick={onAlternarVista}
                                className="text-sm text-amber-600 font-bold border border-amber-200 px-3 py-1 rounded-full hover:bg-amber-50 transition"
                            >
                                Vista Admin
                            </button>
                        )}
                        
                        <button onClick={cerrarSesion} className="text-sm text-red-500 font-bold border border-red-100 px-3 py-1 rounded-full hover:bg-red-50 transition">Salir</button>
                    </div>
                </div>
            </header>

            {vista === 'HOME' && (
                <>
                    <div className="bg-[#0F172A] py-16 text-center px-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">¿En qué podemos ayudarte?</h1>
                        <div className="max-w-2xl mx-auto relative">
                            <input 
                                type="text" 
                                className="w-full py-4 pl-12 pr-4 rounded-xl text-slate-800 shadow-xl outline-none focus:ring-4 focus:ring-blue-500/40 transition"
                                placeholder="Buscar..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                            />
                            <span className="absolute left-4 top-4 text-gray-400 text-xl">🔍</span>
                        </div>
                    </div>

                    <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                                                {/* COLUMNA KB (8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">KB</span>
                                    Articulos Recomendados
                                </h3>
                                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
                                    {articulosFiltrados.length} resultado(s)
                                </span>
                            </div>

                            {articulosFiltrados.length === 0 ? (
                                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center shadow-sm">
                                    <p className="text-slate-700 font-bold mb-1">No encontramos articulos para esta busqueda</p>
                                    <p className="text-sm text-slate-500">Prueba con otra palabra clave o crea un ticket.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {articulosFiltrados.map((art) => (
                                        <article
                                            key={art.id}
                                            onClick={() => { setArticuloLeido(art); setVista('LEER'); }}
                                            className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                                        >
                                            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400" />

                                            <div className="p-6 flex flex-col h-full min-h-[230px]">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                                        {art.categoria || "General"}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">
                                                        {art.fechaCreacion ? new Date(art.fechaCreacion).toLocaleDateString() : ""}
                                                    </span>
                                                </div>

                                                <h4 className="font-extrabold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                                    {art.titulo}
                                                </h4>
                                                <p className="text-sm text-slate-500 line-clamp-4 mb-5 break-words whitespace-normal overflow-hidden">
                                                    {stripHtml(art.contenido)}
                                                </p>

                                                <div className="mt-auto flex items-center justify-between">
                                                    <span className="text-xs text-slate-400">Base de conocimiento</span>
                                                    <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">
                                                        Leer articulo
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* COLUMNA SIDEBAR (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-blue-600 rounded-xl p-6 text-white text-center shadow-lg">
                                <h3 className="font-bold text-lg mb-2">¿Necesitas Ayuda?</h3>
                                <button onClick={() => setVista('NUEVO')} className="bg-white text-blue-700 w-full py-2.5 rounded-lg font-bold mt-4 hover:bg-blue-50 transition">
                                    + Crear Ticket
                                </button>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-slate-700">Mis Tickets</div>
                                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                                    {tickets.map(t => (
                                        <div key={t.id} className="p-4 hover:bg-slate-50 transition">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs text-gray-400">#{t.id}</span>
                                                <span className={`text-[10px] font-bold px-2 rounded ${t.estado==='RESUELTO'?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>{t.estado}</span>
                                            </div>
                                            <h5 className="font-bold text-sm text-slate-800 truncate mb-2">{t.titulo}</h5>
                                            {t.estado !== 'CERRADO' && (
                                                <button onClick={() => { setTicketActivo(t); setVista('CHAT'); }} className="text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded w-full hover:bg-blue-50 font-bold">Abrir Chat</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
                </>
            )}

            {/* VISTA LEER ARTÍCULO */}
            {vista === 'LEER' && articuloLeido && (
                <div className="max-w-5xl mx-auto py-10 px-4 animate-fade-in-up w-full">
                    <button
                        onClick={() => setVista('HOME')}
                        className="mb-6 text-slate-500 hover:text-blue-600 font-bold text-sm"
                    >
                        Volver
                    </button>

                    <article className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 px-7 py-8 md:px-10 md:py-10 text-white">
                            <span className="bg-white/15 text-white px-3 py-1 rounded-full text-xs font-bold uppercase inline-block mb-5">
                                {articuloLeido.categoria || "General"}
                            </span>
                            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight break-words">
                                {articuloLeido.titulo}
                            </h1>
                            <div className="mt-6 flex flex-wrap gap-3 text-xs md:text-sm">
                                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">
                                    Autor: {articuloLeido.autorNombre || "Soporte"}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">
                                    {new Date(articuloLeido.fechaCreacion).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="px-7 py-8 md:px-10 md:py-10">
                            <div
                                className="prose prose-slate prose-headings:text-slate-900 prose-a:text-blue-700 max-w-none w-full break-words whitespace-normal overflow-hidden leading-7 md:leading-8"
                                dangerouslySetInnerHTML={{ __html: articuloLeido.contenido }}
                            />
                        </div>
                    </article>
                </div>
            )}

            {vista === 'NUEVO' && (
                <div className="max-w-2xl mx-auto py-10 px-4">
                    <button onClick={() => setVista('HOME')} className="mb-4 text-slate-500 font-bold text-sm">← Volver</button>
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Nuevo Ticket</h2>
                        <form onSubmit={handleCrear} className="space-y-4">
                            <input required className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Asunto" value={nuevoTicket.titulo} onChange={e => setNuevoTicket({...nuevoTicket, titulo: e.target.value})} />
                            <textarea required rows="5" className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descripción" value={nuevoTicket.descripcion} onChange={e => setNuevoTicket({...nuevoTicket, descripcion: e.target.value})} />
                            <select className="w-full border rounded-lg p-3" value={nuevoTicket.prioridad} onChange={e => setNuevoTicket({...nuevoTicket, prioridad: e.target.value})}>
                                <option value="MEDIA">Prioridad Media</option>
                                <option value="ALTA">Prioridad Alta</option>
                                <option value="BAJA">Prioridad Baja</option>
                            </select>
                            <select className="w-full border rounded-lg p-3" value={nuevoTicket.processType} onChange={e => {
                                const processType = e.target.value;
                                const tipo = tiposTicket.find((t) => t.clave === processType);
                                setNuevoTicket({
                                    ...nuevoTicket,
                                    processType,
                                    workflowKey: tipo?.workflowKey || "",
                                    categoriaId: "",
                                });
                            }}>
                                <option value="">Tipo de ticket (opcional)</option>
                                {tiposTicket.map((tipo) => (
                                    <option key={tipo.id} value={tipo.clave}>{tipo.nombre} ({tipo.clave})</option>
                                ))}
                            </select>
                            <select className="w-full border rounded-lg p-3" value={nuevoTicket.categoriaId} onChange={e => setNuevoTicket({...nuevoTicket, categoriaId: e.target.value})}>
                                <option value="">Categoria (opcional)</option>
                                {categoriasFiltradas.map((categoria) => (
                                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                                ))}
                            </select>
                            <input className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Workflow key (opcional)" value={nuevoTicket.workflowKey} onChange={e => setNuevoTicket({...nuevoTicket, workflowKey: e.target.value})} />
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">Enviar</button>
                        </form>
                    </div>
                </div>
            )}

            {vista === 'CHAT' && ticketActivo && (
                <ClienteChat ticket={ticketActivo} usuario={usuario} onVolver={() => setVista('HOME')} onEnviarMensaje={handleEnviarMensajeChat} />
            )}
        </div>
    );
}

export default ClientePortal;

