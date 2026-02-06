import { useState, useEffect } from 'react'

function TicketList({ usuarioActual }) { // <--- 1. ¡OJO CON LAS LLAVES AQUÍ!
  const [tickets, setTickets] = useState([])

  const cargarTickets = () => {
    fetch('http://localhost:8080/api/tickets')
      .then(response => response.json())
      .then(data => setTickets(data))
      .catch(error => console.error('Error:', error))
  }

  useEffect(() => {
    cargarTickets()
  }, [])

  // --- ACCIONES ---
  const atenderTicket = (id) => {
    // Usamos el ID real del usuario logueado
    fetch(`http://localhost:8080/api/tickets/${id}/atender/${usuarioActual.id}`, { 
      method: 'PUT'
    }).then(() => {
        alert("¡Ticket asignado a ti!")
        cargarTickets()
    })
  }

  const finalizarTicket = (id) => {
    fetch(`http://localhost:8080/api/tickets/${id}/finalizar`, {
      method: 'PUT'
    }).then(() => {
        alert("¡Ticket resuelto!")
        cargarTickets()
    })
  }

  return (
    <div style={{ backgroundColor: '#8fc2cf', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
      <h2 style={{ color: '#ffffff' }}>
        🎫 Bandeja de Tickets {usuarioActual.rol === 'TECNICO' ? ' ' : '(Vista Cliente)'}
      </h2>
      
      {tickets.filter(t => {
        if (usuarioActual.rol === 'ADMIN' || usuarioActual.rol === 'TECNICO') return true;
        return t.usuario.id === usuarioActual.id;
      }).map(t => (
        
          <div key={t.id} style={{ border: '1px solid #000000', margin: '10px 0', padding: '15px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Información del Ticket */}
            <div style={{ maxWidth: '70%' , color: '#2e2d2d' }}>
              <h3 style={{ margin: '0 0 5px 0' , color: '#000000' }}>{t.titulo}</h3>
              <p style={{ margin: '0 0 5px 0' }}>{t.descripcion}</p>
              <small>
                <strong>Estado:</strong> 
                <span style={{ 
                    backgroundColor: t.estado === 'NUEVO' ? '#f1c40f' : t.estado === 'EN_PROCESO' ? '#3498db' : '#27ae60',
                    color: 'white', padding: '3px 8px', borderRadius: '4px', marginLeft: '5px' 
                }}>
                    {t.estado}
                </span> 
                | <strong>Cliente:</strong> {t.usuario ? t.usuario.nombre : 'Desconocido'}
                {t.tecnico && <span> | <strong>Técnico:</strong> {t.tecnico.nombre}</span>}
              </small>
            </div>

            {/* BOTONES DE ACCIÓN (SOLO SI ERES TÉCNICO) */}
            <div>
              {/* 2. VERIFICACIÓN DE ROL AQUÍ */}
              {usuarioActual.rol === 'TECNICO' && t.estado === 'NUEVO' && (
                <button 
                  onClick={() => atenderTicket(t.id)}
                  style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
                  🙋‍♂️ Atender
                </button>
              )}

              {usuarioActual.rol === 'TECNICO' && t.estado === 'EN_PROCESO' && (
                <button 
                  onClick={() => finalizarTicket(t.id)}
                  style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
                  ✅ Resolver
                </button>
              )}

              {t.estado === 'RESUELTO' && (
                <span style={{ color: 'green', fontWeight: 'bold' }}>Finalizado</span>
              )}
            </div>

          </div>
        ))
      }
    </div>
  )
}

export default TicketList