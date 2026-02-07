import { useState, useEffect } from 'react'
import TicketForm from '../components/TicketForm'
import TicketList from '../components/TicketList'
import DetalleTicket from '../components/DetalleTicket' // <--- 1. IMPORTAR

function ClientPortal({ usuario, cerrarSesion }) {
  
  const [articulos, setArticulos] = useState([])
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null)
  
  // 2. NUEVO ESTADO: Ticket seleccionado
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8080/api/articulos')
      .then(res => res.json())
      .then(data => setArticulos(data))
      .catch(err => console.error("Error cargando KB", err))
  }, [])

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '24px' }}>👋</span>
          <div>
            <h2 style={{ margin: 0, color: '#2c3e50' }}>Hola, {usuario.nombre}</h2>
            <small style={{ color: 'gray' }}>Portal de Usuarios</small>
          </div>
        </div>
        <button onClick={cerrarSesion} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* 3. LÓGICA DE PANTALLAS (SWITCH) */}
        
        {ticketSeleccionado ? (
            // --- VISTA DETALLE (CHAT) ---
            <div style={{ marginTop: '20px' }}>
                <DetalleTicket 
                    ticket={ticketSeleccionado}
                    usuarioActual={usuario}
                    alVolver={() => setTicketSeleccionado(null)} // Botón para regresar
                />
            </div>
        ) : (
            // --- VISTA NORMAL (DASHBOARD) ---
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                
                {/* COLUMNA IZQUIERDA: GESTIÓN */}
                <div>
                  <h3 style={{ color: '#34495e' }}>🚀 Crear Solicitud</h3>
                  <TicketForm usuarioActual={usuario} />
                  
                  <h3 style={{ color: '#34495e', marginTop: '30px' }}>📜 Mis Tickets</h3>
                  {/* Pasamos la función alSeleccionar */}
                  <TicketList 
                      usuarioActual={usuario} 
                      alSeleccionar={(t) => setTicketSeleccionado(t)} 
                  />
                </div>

                {/* COLUMNA DERECHA: KNOWLEDGE BASE */}
                <div>
                  <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#2980b9' }}>📚 Knowledge Base</h3>
                    
                    {!articuloSeleccionado ? (
                      <>
                        <p style={{ fontSize: '14px', color: '#666' }}>Ayuda rápida:</p>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {articulos.map(art => (
                            <li 
                              key={art.id} 
                              onClick={() => setArticuloSeleccionado(art)}
                              style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                            >
                              {art.titulo}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <div style={{ animation: 'fadeIn 0.3s' }}>
                        <button 
                          onClick={() => setArticuloSeleccionado(null)}
                          style={{ marginBottom: '10px', background: 'none', border: 'none', color: '#2980b9', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          ⬅ Volver
                        </button>
                        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{articuloSeleccionado.titulo}</h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#555' }}>
                          {articuloSeleccionado.contenido}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

            </div>
        )}
      </div>
    </div>
  )
}

export default ClientPortal