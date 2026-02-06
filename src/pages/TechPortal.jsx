import { useState, useEffect } from 'react'
import PanelInicial from '../components/PanelInicial'
import TablaIncidencias from '../components/TablaIncidencias'
import DetalleTicket from '../components/DetalleTicket'
import GestorKB from '../components/GestorKB'
import DashboardGraficos from '../components/DashboardGraficos'

function TechPortal({ usuario, cerrarSesion }) {
  const [seccionActual, setSeccionActual] = useState('PANEL')
  const [metricas, setMetricas] = useState({ total: 0, nuevos: 0, proceso: 0, resueltos: 0 })
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)

  // Cargar métricas
  useEffect(() => {
    fetch('http://192.168.1.173:8080/api/tickets/metricas')
      .then(res => res.json())
      .then(data => setMetricas(data))
  }, [])

  // --- ESTILOS ---
  const layoutStyle = { display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }
  const sidebarStyle = { width: '250px', backgroundColor: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 } // flexShrink: 0 evita que se aplaste
  const mainStyle = { flex: 1, backgroundColor: '#ecf0f1', padding: '20px', overflowX: 'hidden' } // overflowX evita scroll horizontal innecesario
  
  const menuItemStyle = (activo) => ({
    padding: '15px 20px',
    cursor: 'pointer',
    backgroundColor: activo ? '#34495e' : 'transparent',
    borderLeft: activo ? '4px solid #3498db' : '4px solid transparent',
    transition: '0.2s',
    display: 'flex', alignItems: 'center', gap: '10px'
  })

  return (
    <div style={layoutStyle}>
      
      {/* 1. SIDEBAR IZQUIERDO */}
      <div style={sidebarStyle}>
        <div style={{ padding: '20px', borderBottom: '1px solid #34495e' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>📡 Comutel Service</h2>
          <small style={{ color: '#bdc3c7' }}>Portal Técnico</small>
        </div>

        <nav style={{ flex: 1, marginTop: '20px' }}>
          <div style={menuItemStyle(seccionActual === 'PANEL')} onClick={() => {setSeccionActual('PANEL'); setTicketSeleccionado(null)}}>
            <span>🏠</span> Panel Inicial
          </div>
          <div style={menuItemStyle(seccionActual === 'DASHBOARD')} onClick={() => {setSeccionActual('DASHBOARD'); setTicketSeleccionado(null)}}>
             <span>📊</span> Dashboards
          </div>
          <div style={menuItemStyle(seccionActual === 'TICKETS')} onClick={() => {setSeccionActual('TICKETS'); setTicketSeleccionado(null)}}>
             <span>📋</span> Incidencias / Peticiones
          </div>
          <div style={menuItemStyle(seccionActual === 'KB')} onClick={() => {setSeccionActual('KB'); setTicketSeleccionado(null)}}>
             <span>📚</span> Knowledge Base
          </div>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #34495e' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>👤 {usuario.nombre}</p>
          <button onClick={cerrarSesion} style={{ width: '100%', padding: '8px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL DERECHA */}
      <div style={mainStyle}>
        
        {/* Header Dinámico */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>
            {ticketSeleccionado ? `Atendiendo Ticket #${ticketSeleccionado.id}` : 
              (seccionActual === 'PANEL' ? 'Panel de Control' : 
               seccionActual === 'DASHBOARD' ? 'Indicadores de Rendimiento' :
               seccionActual === 'TICKETS' ? 'Gestión de Incidencias' : 
               'Base de Conocimiento')}
          </h2>
        </div>

        {/* CONTENIDO CAMBIANTE */}
        {ticketSeleccionado ? (
            <DetalleTicket 
                ticket={ticketSeleccionado} 
                usuarioActual={usuario}
                alVolver={() => setTicketSeleccionado(null)} 
            />
        ) : (
            <>
                {seccionActual === 'PANEL' && <PanelInicial metricas={metricas} />}
                {seccionActual === 'DASHBOARD' && <DashboardGraficos />}
                {seccionActual === 'TICKETS' && (
                    <TablaIncidencias 
                        usuarioActual={usuario} 
                        alSeleccionar={(t) => setTicketSeleccionado(t)} 
                    />
                )}
                {seccionActual === 'KB' && <GestorKB />}
            </>
        )}

      </div>
    </div>
  )
}

export default TechPortal