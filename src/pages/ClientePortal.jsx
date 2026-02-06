import { useState } from 'react' // Importamos useState para manejar la lectura de artículos
import TicketForm from '../components/TicketForm'
import TicketList from '../components/TicketList'

function ClientPortal({ usuario, cerrarSesion }) {
  
  // --- BASE DE CONOCIMIENTO (Simulada) ---
  const articulos = [
    { id: 1, titulo: "📄 Cómo configurar la VPN", contenido: "Para conectar la VPN, descarga el cliente Cisco y usa tus credenciales de dominio. Servidor: vpn.comutel.com" },
    { id: 2, titulo: "🖨️ La impresora no conecta", contenido: "Verifica que estés en la red Wi-Fi 'Comutel_Oficina'. Si persiste, reinicia la impresora." },
    { id: 3, titulo: "📧 Cambiar firma de correo", contenido: "En Outlook, ve a Archivo > Opciones > Correo > Firmas. Copia el formato oficial de RRHH." },
    { id: 4, titulo: "🔑 Olvidé mi contraseña", contenido: "Ingresa al portal de autogestión o llama al anexo 5050 para restablecerla." }
  ]

  // Estado para saber qué artículo está leyendo el usuario
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null)

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

      <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        
        {/* COLUMNA IZQUIERDA: GESTIÓN */}
        <div>
          <h3 style={{ color: '#34495e' }}>🚀 Crear Solicitud</h3>
          <TicketForm usuarioActual={usuario} />
          
          <h3 style={{ color: '#34495e', marginTop: '30px' }}>📜 Historial</h3>
          <TicketList usuarioActual={usuario} />
        </div>

        {/* COLUMNA DERECHA: KNOWLEDGE BASE INTERACTIVA */}
        <div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#2980b9' }}>📚 Knowledge Base</h3>
            
            {/* Si no hay artículo seleccionado, mostramos la lista */}
            {!articuloSeleccionado ? (
              <>
                <p style={{ fontSize: '14px', color: '#666' }}>Ayuda rápida antes de crear un ticket:</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {articulos.map(art => (
                    <li 
                      key={art.id} 
                      onClick={() => setArticuloSeleccionado(art)}
                      style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: '0.2s' }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {art.titulo}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              // Si seleccionó uno, mostramos el contenido
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <button 
                  onClick={() => setArticuloSeleccionado(null)}
                  style={{ marginBottom: '10px', background: 'none', border: 'none', color: '#2980b9', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ⬅ Volver a la lista
                </button>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{articuloSeleccionado.titulo}</h4>
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#555' }}>
                  {articuloSeleccionado.contenido}
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', backgroundColor: '#e8f8f5', padding: '20px', borderRadius: '10px', border: '1px solid #d1f2eb' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>¿Necesitas algo más?</h4>
            <p style={{ fontSize: '13px' }}>Si es una emergencia crítica, llama al anexo <strong>#5500</strong>.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ClientPortal