import React, { useState, useEffect, useMemo } from 'react';
import { ticketService } from '../services/ticketService';
import { 
    BarChart, Bar, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

// --- UTILIDADES ---
const obtenerNombreDia = (fecha) => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return dias[fecha.getDay()];
};

const restarDias = (fecha, dias) => {
    const result = new Date(fecha);
    result.setDate(result.getDate() - dias);
    return result;
};

// --- COMPONENTE PRINCIPAL ---
function DashboardBI() {
    const [tickets, setTickets] = useState([]);
    const [rango, setRango] = useState('7d'); // '7d' o '30d'
    const [cargando, setCargando] = useState(true);
    
    // Configuración de visualización
    const [layout, setLayout] = useState({ verTendencia: true, verDistribucion: true, verRendimiento: true });

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await ticketService.listar();
                setTickets(data);
            } catch (e) { console.error(e); }
            finally { setCargando(false); }
        };
        fetch();
    }, []);

    // --- CÁLCULOS BI REALES (MEMORIZADOS) ---
    const { dataEstado, dataTendencia, dataTecnicos, kpisGenerales } = useMemo(() => {
        if (tickets.length === 0) return { dataEstado: [], dataTendencia: [], dataTecnicos: [], kpisGenerales: {} };

        // 1. DISTRIBUCIÓN DE ESTADOS
        const estado = [
            { name: 'Abiertos', value: tickets.filter(t => t.estado === 'NUEVO').length, color: '#3b82f6' },
            { name: 'En Proceso', value: tickets.filter(t => t.estado === 'EN_PROCESO').length, color: '#f59e0b' },
            { name: 'Resueltos', value: tickets.filter(t => t.estado === 'RESUELTO').length, color: '#10b981' },
            { name: 'Cerrados', value: tickets.filter(t => t.estado === 'CERRADO').length, color: '#6b7280' },
        ].filter(d => d.value > 0);

        // 2. TENDENCIA DE VOLUMEN (POR FECHA)
        const diasAtras = rango === '7d' ? 7 : 30;
        const tendencia = [];
        
        for (let i = diasAtras - 1; i >= 0; i--) {
            const fechaRef = restarDias(new Date(), i);
            const fechaString = fechaRef.toLocaleDateString(); // Clave para comparar solo día/mes/año
            
            // Filtramos tickets creados en ese día específico
            const creadosHoy = tickets.filter(t => new Date(t.fechaCreacion).toLocaleDateString() === fechaString).length;
            
            // Filtramos tickets resueltos en ese día (Simulamos fechaResolucion si no existe, o usamos fechaCreacion si está resuelto)
            // *Nota: Para mayor precisión, tu Backend debería devolver 'fechaResolucion'. Aquí usamos una aproximación.
            const resueltosHoy = tickets.filter(t => 
                (t.estado === 'RESUELTO' || t.estado === 'CERRADO') && 
                new Date(t.fechaCreacion).toLocaleDateString() === fechaString // Usamos fechaCreacion como proxy temporal
            ).length;

            tendencia.push({
                dia: obtenerNombreDia(fechaRef), // Ej: "Lun"
                fecha: fechaRef.getDate(),       // Ej: 10
                tickets: creadosHoy,
                resueltos: resueltosHoy
            });
        }

        // 3. RENDIMIENTO POR TÉCNICO
        const tecnicosMap = {};
        tickets.forEach(t => { 
            if(t.tecnico) {
                // Solo contamos tickets cerrados o resueltos como "Logro"
                const esResuelto = t.estado === 'RESUELTO' || t.estado === 'CERRADO';
                if (!tecnicosMap[t.tecnico.nombre]) {
                    tecnicosMap[t.tecnico.nombre] = { total: 0, resueltos: 0 };
                }
                tecnicosMap[t.tecnico.nombre].total += 1;
                if (esResuelto) tecnicosMap[t.tecnico.nombre].resueltos += 1;
            }
        });
        // Convertimos a array y ordenamos por mayor número de resueltos
        const tecnicos = Object.keys(tecnicosMap)
            .map(k => ({ name: k, cantidad: tecnicosMap[k].resueltos, total: tecnicosMap[k].total }))
            .sort((a,b) => b.cantidad - a.cantidad)
            .slice(0, 5); // Top 5

        // ... dentro de useMemo ...
        
        // 4. KPIs GENERALES (CORREGIDO PARA LEER GRUPOS)
        const totalTickets = tickets.length;
        const totalResueltos = tickets.filter(t => t.estado === 'RESUELTO' || t.estado === 'CERRADO').length;
        const cumplimientoSLA = totalTickets > 0 ? Math.round((totalResueltos / totalTickets) * 100) : 0;
        
        // --- AQUÍ ESTABA EL DETALLE ---
        const gruposCarga = {};
        tickets.forEach(t => {
            // Solo contamos tickets PENDIENTES (ni resueltos ni cerrados)
            if (t.estado !== 'RESUELTO' && t.estado !== 'CERRADO') {
                
                // Leemos el nombre del grupo. Si es null, lo ignoramos para no ensuciar la métrica
                // OJO: Asegúrate que tu backend devuelve el nombre en 't.grupoAsignado' 
                // Si tu backend devuelve un objeto, sería t.grupoAsignado?.nombre
                const nombreGrupo = t.grupoAsignado || "Mesa de Ayuda (General)"; 
                
                gruposCarga[nombreGrupo] = (gruposCarga[nombreGrupo] || 0) + 1;
            }
        });
        
        // Encontrar el grupo con MÁS tickets pendientes
        let grupoMasCargado = { nombre: "Todo al día", cantidad: 0 };
        
        Object.entries(gruposCarga).forEach(([nombre, cant]) => {
            if (cant > grupoMasCargado.cantidad) {
                grupoMasCargado = { nombre, cantidad: cant };
            }
        });

        return { 
            dataEstado: estado, 
            dataTendencia: tendencia, 
            dataTecnicos: tecnicos,
            kpisGenerales: { cumplimientoSLA, grupoMasCargado } 
        };
    }, [tickets, rango]);

    return (
        <div className="h-full bg-slate-50 p-8 overflow-y-auto">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">📊 Reportes & Analytics</h1>
                    <p className="text-sm text-slate-500">Datos en tiempo real del periodo seleccionado.</p>
                </div>
                
                <div className="flex gap-3">
                    <select 
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50"
                        value={rango}
                        onChange={(e) => setRango(e.target.value)}
                    >
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                    </select>
                    
                    <button onClick={() => setLayout({...layout, verTendencia: !layout.verTendencia})} className={`px-3 py-2 rounded-lg text-sm font-bold border transition ${layout.verTendencia ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400'}`}>📈 Tendencia</button>
                    <button onClick={() => setLayout({...layout, verDistribucion: !layout.verDistribucion})} className={`px-3 py-2 rounded-lg text-sm font-bold border transition ${layout.verDistribucion ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-400'}`}>🍰 Estados</button>
                </div>
            </div>

            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* 1. GRÁFICO DE ÁREA (TENDENCIA) */}
                {layout.verTendencia && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 xl:col-span-2 h-[380px] animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-700">📈 Volumen de Tickets ({rango === '7d' ? 'Semanal' : 'Mensual'})</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Total Entrantes: {dataTendencia.reduce((a,b)=>a+b.tickets,0)}</span>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={dataTendencia}>
                                <defs>
                                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="dia" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                <Legend verticalAlign="top" height={36}/>
                                <Area type="monotone" dataKey="tickets" name="Creados" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTickets)" />
                                <Area type="monotone" dataKey="resueltos" name="Resueltos" stroke="#10b981" fillOpacity={1} fill="url(#colorRes)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* 2. GRÁFICO DE TORTA (ESTADOS) */}
                {layout.verDistribucion && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[380px] animate-fade-in">
                        <h3 className="font-bold text-gray-700 mb-2">🍰 Estado Actual</h3>
                        {dataEstado.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie data={dataEstado} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {dataEstado.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
                        )}
                    </div>
                )}

                {/* 3. BARRAS (TOP TÉCNICOS) */}
                {layout.verRendimiento && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 xl:col-span-1 h-[350px] animate-fade-in">
                        <h3 className="font-bold text-gray-700 mb-4">🏆 Top Resolutores</h3>
                        {dataTecnicos.length > 0 ? (
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={dataTecnicos} layout="vertical" margin={{left: 10}}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11}} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20} fill="#6366f1" name="Tickets Resueltos" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                <span className="text-2xl mb-2">😴</span>
                                Nadie ha resuelto tickets aún
                            </div>
                        )}
                    </div>
                )}

                
                {/* 4. TARJETAS KPI FINALES (KPIs REALES) */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white lg:col-span-2 h-[150px] flex items-center justify-between shadow-lg animate-fade-in relative overflow-hidden">
                    
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                    {/* IZQUIERDA: Eficiencia Global */}
                    <div className="z-10">
                        <p className="text-slate-400 font-bold uppercase text-xs mb-1 tracking-widest">Tasa de Resolución Global</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-5xl font-bold text-emerald-400">{kpisGenerales.cumplimientoSLA}%</h2>
                            <span className="text-xs text-slate-400">de eficiencia</span>
                        </div>
                        <p className="text-xs mt-2 text-slate-300">
                            {dataEstado.find(e=>e.name==='Resueltos')?.value || 0} tickets resueltos de {tickets.length} totales
                        </p>
                    </div>

                    {/* DERECHA: Cuello de Botella (Grupo más cargado) */}
                    <div className="text-right z-10 pl-4"> {/* Agregamos pl-4 para separar de la izq */}
                         <p className="text-slate-400 font-bold uppercase text-xs mb-1 tracking-widest">Área con Mayor Carga</p>
                         
                         {/* CAMBIO AQUÍ: 
                             1. Quitamos 'truncate' y 'max-w'
                             2. Bajamos de text-4xl a text-2xl/3xl para que quepan nombres largos 
                             3. Agregamos 'leading-tight' para que si se baja a 2 líneas se vea bien
                         */}
                         <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            {kpisGenerales.grupoMasCargado?.nombre || "Todo al día"}
                         </h2>
                         
                         <p className="text-xs mt-2 text-orange-300 font-bold flex items-center justify-end gap-1">
                            ⚠️ {kpisGenerales.grupoMasCargado?.cantidad || 0} tickets pendientes
                         </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default DashboardBI;