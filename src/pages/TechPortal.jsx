import { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';

import DashboardGraficos from '../components/DashboardGraficos';
import DashboardBI from '../components/DashboardBI';
import TicketTable from '../components/TicketTable';
import DetalleTicket from '../components/DetalleTicket';
import AdminUsers from '../components/AdminUsers';
import AdminGroups from '../components/AdminGroups';
import WorkflowDesigner from '../components/WorkflowDesigner';
import CatalogosTiposCategorias from '../components/CatalogosTiposCategorias';
import GestorKB from '../components/GestorKB';
import RolesPermisos from '../components/RolesPermisos';
import { normalizeRole } from '../constants/permissions';
import PersonalizacionVisual from '../components/PersonalizacionVisual';
import { hydrateBrandingConfig } from '../utils/brandingTheme';

function TechPortal({
  usuario,
  cerrarSesion,
  puedeVerAdmin,
  puedeGestionarRoles,
  esSuperAdmin,
  modoVista,
  onAlternarVista,
  onUsuarioActualizado,
}) {
  const [vista, setVista] = useState('PANEL');
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const rol = normalizeRole(usuario?.rol);
  const puedeVerRolesPermisos = puedeGestionarRoles && (rol === 'ADMIN' || rol === 'TESTERADMIN');

  useEffect(() => {
    hydrateBrandingConfig();
  }, []);

  const renderContenido = () => {
    switch (vista) {
      case 'PANEL':
      case 'DASHBOARD':
      case 'INICIO':
        return <DashboardGraficos usuarioActual={usuario} />;

      case 'METRICAS':
      case 'BI':
        return <DashboardBI />;

      case 'USUARIOS':
      case 'ADMIN_USERS':
        return puedeVerAdmin ? <AdminUsers usuarioActual={usuario} /> : <DashboardGraficos usuarioActual={usuario} />;

      case 'GRUPOS':
      case 'ADMIN_GROUPS':
        return puedeVerAdmin ? <AdminGroups /> : <DashboardGraficos usuarioActual={usuario} />;

      case 'WORKFLOWS':
        return puedeVerAdmin ? <WorkflowDesigner /> : <DashboardGraficos usuarioActual={usuario} />;

      case 'CATALOGOS':
        return puedeVerAdmin ? <CatalogosTiposCategorias /> : <DashboardGraficos usuarioActual={usuario} />;

      case 'PERSONALIZACION':
        return puedeVerAdmin ? <PersonalizacionVisual /> : <DashboardGraficos usuarioActual={usuario} />;

      case 'ADMINISTRACION':
        return puedeVerAdmin ? <AdminUsers usuarioActual={usuario} /> : <DashboardGraficos usuarioActual={usuario} />;

      case 'TICKETS':
      case 'INCIDENCIAS':
        return (
          <TicketTable
            usuarioActual={usuario}
            alSeleccionar={(t) => {
              setTicketSeleccionado(t);
              setVista('DETALLE');
            }}
          />
        );

      case 'DETALLE':
        return (
          <DetalleTicket
            ticket={ticketSeleccionado}
            usuarioActual={usuario}
            alVolver={() => setVista('TICKETS')}
          />
        );

      case 'KB':
      case 'CONOCIMIENTO':
        return <GestorKB usuarioActual={usuario} />;

      case 'ROLES':
        return puedeVerRolesPermisos ? (
          <RolesPermisos
            usuarioActual={usuario}
            onUsuarioActualizado={onUsuarioActualizado}
            puedeGestionarTesterAdmin={esSuperAdmin}
          />
        ) : (
          <DashboardGraficos usuarioActual={usuario} />
        );

      default:
        return <DashboardGraficos usuarioActual={usuario} />;
    }
  };

  const tituloVista =
    ticketSeleccionado
      ? `Ticket #${ticketSeleccionado.id}`
      : vista === 'USUARIOS' || vista === 'ADMINISTRACION'
      ? 'Gestion de Usuarios'
      : vista === 'GRUPOS'
      ? 'Gestion de Grupos'
      : vista === 'WORKFLOWS'
      ? 'Disenador de Flujos'
      : vista === 'CATALOGOS'
      ? 'Tipos y Categorias'
      : vista === 'PERSONALIZACION'
      ? 'Personalizacion Visual'
      : vista === 'ROLES'
      ? 'Roles y Permisos'
      : vista === 'KB'
      ? 'Base de Conocimiento'
      : vista;

  const mostrarHeader = !['PANEL', 'DASHBOARD', 'METRICAS', 'INICIO', 'BI'].includes(vista);

  return (
    <div className="itsm-theme flex h-screen font-sans overflow-hidden" style={{ backgroundColor: 'var(--itsm-app-bg)' }}>
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

      <main className="flex-1 overflow-auto relative flex flex-col">
        {mostrarHeader && (
          <header className="itsm-top-header p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center shrink-0">
            <h1 className="text-lg font-bold uppercase tracking-wide">{tituloVista}</h1>
            <div className="text-sm">
              Usuario: <strong style={{ color: 'var(--itsm-primary)' }}>{usuario.nombre}</strong>
            </div>
          </header>
        )}

        <div className="flex-1 h-full">{renderContenido()}</div>
      </main>
    </div>
  );
}

export default TechPortal;
