import { useState, useEffect } from 'react'
import Login from './components/Login'
import ClientPortal from './pages/ClientePortal'
import TechPortal from './pages/TechPortal'

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)

  // --- LÓGICA DE LOGIN/LOGOUT ---
  const cerrarSesion = () => {
    setUsuarioLogueado(null)
    localStorage.removeItem('sesionComutel')
  }

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('sesionComutel')
    if (sesionGuardada) {
      const datos = JSON.parse(sesionGuardada)
      setUsuarioLogueado(datos.usuario)
    }
  }, [])

  const iniciarSesion = (usuario, recordar) => {
    setUsuarioLogueado(usuario)
    const datosSesion = { usuario, recordar, ultimoAcceso: Date.now() }
    localStorage.setItem('sesionComutel', JSON.stringify(datosSesion))
  }

  // --- EL TRAFICO ---

  // 1. Login
  if (!usuarioLogueado) {
    return <Login alIniciarSesion={iniciarSesion} />
  }

  // 2. Cliente
  if (usuarioLogueado.rol === 'CLIENTE') {
    return <ClientPortal usuario={usuarioLogueado} cerrarSesion={cerrarSesion} />
  }

  // 3. Técnico (Aquí dentro meteremos los gráficos)
  return <TechPortal usuario={usuarioLogueado} cerrarSesion={cerrarSesion} />
}

export default App