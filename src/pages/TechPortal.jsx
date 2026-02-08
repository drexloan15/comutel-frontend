import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar'; 
import PanelSLA from './PanelSLA';                
import DashboardGraficos from '../components/DashboardGraficos';
import TicketTable from '../components/TicketTable';
import DetalleTicket from '../components/DetalleTicket'; 
import AdminUsers from '../components/AdminUsers';

// Placeholders para futuras secciones
const AdminPanel = () => <div className="p-10 text-xl text-center">⚙️ Panel de Configuración (Próximamente)</div>;
const KnowledgeBase = () => <div className="p-10 text-xl text-center">📚 Base de Conocimiento (Próximamente)</div>;

function TechPortal({ usuario, cerrarSesion }) {
    const [seccionActual, setSeccionActual] = useState('PANEL');
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

    // Función para manejar el contenido dinámico
    const renderContenido = () => {
        // 1. Si hay un ticket seleccionado, mostramos el DETALLE (ocupa toda la pantalla)
        if (ticketSeleccionado) {
            return (
                <DetalleTicket 
                    ticket={ticketSeleccionado} 
                    usuarioActual={usuario}
                    alVolver={() => setTicketSeleccionado(null)} 
                />
            );
        }

        // 2. Si no, mostramos la sección elegida en el menú
        switch (seccionActual) {
            case 'PANEL':
                return (
                    <div className="flex flex-col gap-8 p-6">
                        {/* A. Tarjetas de SLA (Rojo/Amarillo/Verde) */}
                        <PanelSLA />

                        {/* B. Gráficos Resumidos */}
                        <div>
                           <h3 className="text-gray-500 font-bold mb-2 uppercase text-sm">📊 Métricas en Vivo</h3>
                           <DashboardGraficos />
                        </div>

                        {/* C. Tabla de Gestión Rápida */}
                        <div>
                           <h3 className="text-gray-500 font-bold mb-2 uppercase text-sm">🚨 Gestión de Tickets</h3>
                           {/* ¡AQUÍ PASAMOS LA FUNCIÓN PARA ABRIR EL TICKET! */}
                           <TicketTable alSeleccionar={setTicketSeleccionado} />
                        </div>
                    </div>
                );

            case 'DASHBOARD':
                return (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Business Intelligence</h2>
                        <DashboardGraficos />
                    </div>
                );

            case 'TICKETS':
                return (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Bandeja de Entrada</h2>
                        <TicketTable alSeleccionar={setTicketSeleccionado} /> 
                    </div>
                );

            case 'KB':
                return <KnowledgeBase />;

            case 'ADMIN':
                // Si es admin, mostramos la gestión de usuarios
                return (usuario.rol === 'ADMIN' || usuario.rol === 'TECNICO') ?(
                    <div className="p-6">
                        <AdminUsers />
                        {/* Aquí luego pondremos AdminGroups también */}
                    </div>
                ) : (
                    <p className="p-6 text-red-500">Acceso Denegado ⛔</p>
                );

            default:
                return <PanelSLA />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
            {/* BARRA LATERAL IZQUIERDA */}
            <Sidebar 
                seccionActual={seccionActual} 
                setSeccionActual={(seccion) => { setSeccionActual(seccion); setTicketSeleccionado(null); }}
                cerrarSesion={cerrarSesion}
                esAdmin={usuario.rol === 'ADMIN'}
            />

            {/* ÁREA PRINCIPAL DERECHA */}
            <main className="flex-1 overflow-auto relative">
                {/* Header Superior */}
                <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-slate-700">
                        {ticketSeleccionado ? `Visualizando Ticket #${ticketSeleccionado.id}` : 
                         seccionActual === 'PANEL' ? 'Centro de Control SLA' : seccionActual}
                    </h1>
                    <div className="text-sm text-slate-500">
                        Usuario: <strong>{usuario.nombre}</strong>
                    </div>
                </header>

                {/* Contenido Variable */}
                <div className="min-h-full">
                    {renderContenido()}
                </div>
            </main>
        </div>
    );
}

export default TechPortal;