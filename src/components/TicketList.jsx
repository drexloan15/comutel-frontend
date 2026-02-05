import { useState, useEffect } from 'react'

function TicketList() {
  const [tickets, setTickets] = useState([])

  // Función para recargar la lista
  const cargarTickets = () => {
    fetch('http://localhost:8080/api/tickets')
      .then(response => response.json())
      .then(data => setTickets(data))
      .catch(error => console.error('Error:', error))
  }

  // Cargar al inicio
  useEffect(() => {
    cargarTickets()
  }, [])

  // --- ACCIONES ---
  
  // 1. Función para Atender (Simulamos que somos el Técnico con ID 2)
  const atenderTicket = (id) => {
    fetch(`http://localhost:8080/api/tickets/${id}/atender/2`, { // <--- OJO: El "2" es el ID de Pedro
      method: 'PUT'
    }).then(() => {
        alert("¡Ticket asignado a ti!")
        cargarTickets() // Recargamos para ver el cambio
    })
  }

  // 2. Función para Finalizar
  const finalizarTicket = (id) => {
    fetch(`http://localhost:8080/api/tickets/${id}/finalizar`, {
      method: 'PUT'
    }).then(() => {
        alert("¡Ticket resuelto!")
        cargarTickets()
    })
  }

  return (
    <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
      <h2 style={{ color: '#e74c3c' }}>🎫 Bandeja de Entrada (Técnico)</h2>
      
      {tickets.length === 0 ? <p>No hay tickets.</p> : tickets.map(t => (
          <div key={t.id} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '15px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Información del Ticket */}
            <div style={{ maxWidth: '70%' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>{t.titulo}</h3>
              <p style={{ margin: '0 0 5px 0', color: '#555' }}>{t.descripcion}</p>
              <small>
                <strong>Estado:</strong> 
                <span style={{ 
                    backgroundColor: t.estado === 'NUEVO' ? '#f1c40f' : t.estado === 'EN_PROCESO' ? '#3498db' : '#27ae60',
                    color: 'white', padding: '3px 8px', borderRadius: '4px', marginLeft: '5px' 
                }}>
                    {t.estado}
                </span> 
                | <strong>Cliente:</strong> {t.usuario.nombre}
                {t.tecnico && <span> | <strong>Técnico:</strong> {t.tecnico.nombre}</span>}
              </small>
            </div>

            {/* BOTONES DE ACCIÓN (Dependen del estado) */}
            <div>
              {t.estado === 'NUEVO' && (
                <button 
                  onClick={() => atenderTicket(t.id)}
                  style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
                  🙋‍♂️ Atender
                </button>
              )}

              {t.estado === 'EN_PROCESO' && (
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