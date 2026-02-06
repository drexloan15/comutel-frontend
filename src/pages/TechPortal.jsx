import UserList from '../components/UserList'
import TicketList from '../components/TicketList'
import TicketForm from '../components/TicketForm'
import DashboardStats from '../components/DashboardStats' // <--- Ya lo tienes importado ✅

function TechPortal({ usuario, cerrarSesion }) {
  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#5b7083', minHeight: '100vh', color: 'white' }}>
      
      {/* HEADER TÉCNICO (Oscuro) */}
      <div style={{ backgroundColor: '#202d3a', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #48a3e0' }}>
        <h2 style={{ margin: 0 }}>📡 Comutel Service <span style={{ fontSize: '0.6em', background: '#e74c3c', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span></h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>{usuario.nombre} ({usuario.rol})</span>
          <button onClick={cerrarSesion} style={{ background: '#c0392b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        
        {/* --- AQUÍ AGREGAMOS EL DASHBOARD --- */}
        {/* Se verá arriba de las columnas, ocupando todo el ancho */}
        <DashboardStats />
        {/* ----------------------------------- */}

        {/* PANEL DE CONTROL (Grid de 2 columnas) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px' }}>
          
          {/* BARRA LATERAL (Usuarios y Herramientas) */}
          <div>
            {usuario.rol === 'ADMIN' && (
              <div style={{ backgroundColor: 'white', color: 'black', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                 <UserList />
              </div>
            )}
            
            <div style={{ backgroundColor: '#34495e', padding: '15px', borderRadius: '8px' }}>
              <h4>⚡ Acciones Rápidas</h4>
              <button style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '5px', background: 'none', border: '1px solid gray', color: 'white', cursor: 'pointer' }}>📊 Ver Reportes</button>
              <button style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '5px', background: 'none', border: '1px solid gray', color: 'white', cursor: 'pointer' }}>⚙️ Configuraciones</button>
            </div>
          </div>

          {/* ÁREA CENTRAL (Bandeja de Entrada) */}
          <div>
              {/* Opción para crear ticket interno */}
              <div style={{ marginBottom: '20px' }}>
                 <TicketForm usuarioActual={usuario} />
              </div>

              <TicketList usuarioActual={usuario} />
          </div>

        </div>
        
      </div>
    </div>
  )
}

export default TechPortal