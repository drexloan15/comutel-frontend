import { useState, useEffect } from 'react'
import Login from './components/Login'
import ClientPortal from './pages/ClientePortal' // <--- Importamos Pagina 1
import TechPortal from './pages/TechPortal'     // <--- Importamos Pagina 2

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)

  // --- LÓGICA DE LOGIN/LOGOUT (Igual que antes) ---
  const cerrarSesion = () => {
    setUsuarioLogueado(null)
    localStorage.removeItem('sesionComutel')
  }

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('sesionComutel')
    if (sesionGuardada) {
      const datos = JSON.parse(sesionGuardada)
      // (Aquí va tu lógica de 10 minutos si la quieres mantener)
      setUsuarioLogueado(datos.usuario)
    }
  }, [])

  const iniciarSesion = (usuario, recordar) => {
    setUsuarioLogueado(usuario)
    const datosSesion = { usuario, recordar, ultimoAcceso: Date.now() }
    localStorage.setItem('sesionComutel', JSON.stringify(datosSesion))
  }

  // --- EL TRAFICO ---

  // 1. Si no hay nadie -> LOGIN
  if (!usuarioLogueado) {
    return <Login alIniciarSesion={iniciarSesion} />
  }

  // 2. Si es CLIENTE -> PORTAL USUARIO
  if (usuarioLogueado.rol === 'CLIENTE') {
    return <ClientPortal usuario={usuarioLogueado} cerrarSesion={cerrarSesion} />
  }

  // 3. Si es TECNICO o ADMIN -> COMUTEL SERVICE
  return <TechPortal usuario={usuarioLogueado} cerrarSesion={cerrarSesion} />
}

export default App