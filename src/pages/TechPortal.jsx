import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar'; 

// --- IMPORTACIÓN DE COMPONENTES ---
import DashboardGraficos from '../components/DashboardGraficos'; // Para "Inicio (SLA)"
import DashboardBI from '../components/DashboardBI';             // Para "Métricas / BI"
import TicketTable from '../components/TicketTable';             // Para "Incidencias"
import DetalleTicket from '../components/DetalleTicket'; 
import AdminUsers from '../components/AdminUsers';               // Para "Administración -> Usuarios"
import AdminGroups from '../components/AdminGroups';             // Para "Administración -> Grupos"
import GestorKB from '../components/GestorKB';                   // Para "Base Conocimiento"
import RolesPermisos from '../components/RolesPermisos';
import { normalizeRole } from '../constants/permissions';

function TechPortal({
    usuario,
    cerrarSesion,
    puedeVerAdmin,
    esSuperAdmin,
    puedeGestionarRoles,
    modoVista,
    onAlternarVista,
    permissionsConfig,
    onChangePermissionsConfig,
}) {
    // Estado inicial
    const [vista, setVista] = useState('PANEL'); 
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
    const rol = normalizeRole(usuario?.rol);
    const puedeVerRolesPermisos = puedeGestionarRoles && (rol === 'ADMIN' || rol === 'TESTERADMIN');

    // --- FUNCIÓN DE ENRUTAMIENTO (AQUÍ ESTABA EL ERROR) ---
    const renderContenido = () => {
        // Un console.log para que veas en la consola (F12) qué está enviando el Sidebar
        console.log("Vista actual recibida:", vista); 

        switch (vista) {
            // 1. CASO INICIO (Tu Dashboard Operativo Asimétrico)
            case 'PANEL':
            case 'DASHBOARD': 
            case 'INICIO': // Por si tu sidebar manda 'INICIO'
                return <DashboardGraficos usuarioActual={usuario} />;

            // 2. CASO MÉTRICAS (Tu Dashboard BI Avanzado)
            case 'METRICAS': 
            case 'BI':     // Por si tu sidebar manda 'BI'
                return <DashboardBI />; 
            
            // 3. CASO ADMINISTRACIÓN
            // Nota: Si tu sidebar tiene submenús, debe mandar 'USUARIOS' o 'GRUPOS'.
            // Si solo manda 'ADMINISTRACION', mostramos Usuarios por defecto.
            case 'USUARIOS':
            case 'ADMIN_USERS':
                return puedeVerAdmin ? <AdminUsers usuarioActual={usuario} /> : <DashboardGraficos usuarioActual={usuario} />;
                
            case 'GRUPOS':
            case 'ADMIN_GROUPS':
                return puedeVerAdmin ? <AdminGroups /> : <DashboardGraficos usuarioActual={usuario} />;

            case 'ADMINISTRACION': // Caso genérico si hacen clic en el padre
                return puedeVerAdmin ? <AdminUsers usuarioActual={usuario} /> : <DashboardGraficos usuarioActual={usuario} />;

            // 4. CASO GESTIÓN DE TICKETS
            case 'TICKETS':
            case 'INCIDENCIAS':
                return <TicketTable 
                    usuarioActual={usuario} // 👈 ¡ESTO ES LO QUE FALTABA!
                    alSeleccionar={(t) => { 
                        setTicketSeleccionado(t); 
                        setVista('DETALLE'); 
                    }} 
                />;
            
            case 'DETALLE':
                return <DetalleTicket 
                    ticket={ticketSeleccionado} 
                    usuarioActual={usuario} 
                    alVolver={() => setVista('TICKETS')} 
                />;
            
            // 5. BASE DE CONOCIMIENTO
            case 'KB':
            case 'CONOCIMIENTO':
                return <GestorKB usuarioActual={usuario} />;

            case 'ROLES':
                return puedeVerRolesPermisos ? (
                    <RolesPermisos
                        config={permissionsConfig}
                        onChangeConfig={onChangePermissionsConfig}
                        puedeGestionarTesterAdmin={esSuperAdmin}
                    />
                ) : <DashboardGraficos usuarioActual={usuario} />;
                
            // DEFAULT (Por si falla algo, volvemos al inicio)
            default:
                return <DashboardGraficos usuarioActual={usuario} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
            {/* BARRA LATERAL */}
            <Sidebar 
                seccionActual={vista} 
                setSeccionActual={(seccion) => { 
                    setVista(seccion); 
                    setTicketSeleccionado(null); 
                }}
                cerrarSesion={cerrarSesion}
                puedeVerAdmin={puedeVerAdmin}
                esSuperAdmin={esSuperAdmin}
                puedeGestionarRoles={puedeGestionarRoles}
                modoVista={modoVista}
                onAlternarVista={onAlternarVista}
            />

            {/* ÁREA PRINCIPAL */}
            <main className="flex-1 overflow-auto relative flex flex-col">
                
                {/* Header Superior: LO MOSTRAMOS SOLO SI NO ES UN DASHBOARD 
                    (Porque tus Dashboards ya tienen su propio header interno con el saludo) 
                */}
                {vista !== 'PANEL' && vista !== 'DASHBOARD' && vista !== 'METRICAS' && vista !== 'INICIO' && vista !== 'BI' && (
                    <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center shrink-0">
                        <h1 className="text-lg font-bold text-slate-700 uppercase tracking-wide">
                            {ticketSeleccionado ? `Ticket #${ticketSeleccionado.id}` : 
                             (vista === 'USUARIOS' || vista === 'ADMINISTRACION') ? 'Gestión de Usuarios' :
                             vista === 'GRUPOS' ? 'Gestión de Grupos' :
                             vista === 'ROLES' ? 'Roles y Permisos' :
                             vista === 'KB' ? 'Base de Conocimiento' : vista}
                        </h1>
                        <div className="text-sm text-slate-500">
                            Usuario: <strong className="text-teal-600">{usuario.nombre}</strong>
                        </div>
                    </header>
                )}

                {/* Contenido Inyectado */}
                <div className="flex-1 h-full">
                    {renderContenido()}
                </div>
            </main>
        </div>
    );
}

export default TechPortal;
