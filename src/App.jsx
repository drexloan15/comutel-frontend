import { useState, useEffect } from 'react'
import Login from './components/Login'
import ClientPortal from './pages/ClientePortal'
import TechPortal from './pages/TechPortal'
import {
  canUserViewAdminPanel,
  loadPermissionsConfig,
  normalizeRole,
} from './constants/permissions'

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)
  const [modoVista, setModoVista] = useState('ADMIN')
  const [permissionsConfig, setPermissionsConfig] = useState(loadPermissionsConfig())

  // --- LÓGICA DE LOGIN/LOGOUT ---
  const cerrarSesion = () => {
    setUsuarioLogueado(null)
    setModoVista('ADMIN')
    localStorage.removeItem('sesionComutel')
  }

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('sesionComutel')
    if (sesionGuardada) {
      const datos = JSON.parse(sesionGuardada)
      setUsuarioLogueado(datos.usuario)
      setModoVista(datos.modoVista || 'ADMIN')
    }
  }, [])

  const iniciarSesion = (usuario, recordar) => {
    const role = normalizeRole(usuario?.rol)
    const vistaDefault = role === 'CLIENTE' ? 'CLIENTE' : 'ADMIN'
    setUsuarioLogueado(usuario)
    setModoVista(vistaDefault)
    const datosSesion = { usuario, recordar, modoVista: vistaDefault, ultimoAcceso: Date.now() }
    localStorage.setItem('sesionComutel', JSON.stringify(datosSesion))
  }

  const alternarVistaSuperAdmin = () => {
    const role = normalizeRole(usuarioLogueado?.rol)
    if (role !== 'TESTERADMIN') return

    const next = modoVista === 'ADMIN' ? 'CLIENTE' : 'ADMIN'
    setModoVista(next)
    const sesionGuardada = localStorage.getItem('sesionComutel')
    if (!sesionGuardada) return
    try {
      const datos = JSON.parse(sesionGuardada)
      localStorage.setItem('sesionComutel', JSON.stringify({ ...datos, modoVista: next }))
    } catch {
      // ignore
    }
  }

  // --- EL TRAFICO ---

  // 1. Login
  if (!usuarioLogueado) {
    return <Login alIniciarSesion={iniciarSesion} />
  }

  const role = normalizeRole(usuarioLogueado?.rol)
  const esSuperAdmin = role === 'TESTERADMIN'
  const puedeVerAdmin = canUserViewAdminPanel(usuarioLogueado, permissionsConfig)
  const puedeGestionarRoles = role === 'ADMIN' || role === 'TESTERADMIN'

  // 2. Cliente
  if (role === 'CLIENTE' || (esSuperAdmin && modoVista === 'CLIENTE')) {
    return (
      <ClientPortal
        usuario={usuarioLogueado}
        cerrarSesion={cerrarSesion}
        esSuperAdmin={esSuperAdmin}
        onAlternarVista={alternarVistaSuperAdmin}
      />
    )
  }

  // 3. Técnico (Aquí dentro meteremos los gráficos)
  return (
    <TechPortal
      usuario={usuarioLogueado}
      cerrarSesion={cerrarSesion}
      puedeVerAdmin={puedeVerAdmin}
      esSuperAdmin={esSuperAdmin}
      puedeGestionarRoles={puedeGestionarRoles}
      modoVista={modoVista}
      onAlternarVista={alternarVistaSuperAdmin}
      permissionsConfig={permissionsConfig}
      onChangePermissionsConfig={setPermissionsConfig}
    />
  )
}

export default App
