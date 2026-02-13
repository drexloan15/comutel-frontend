import { useState, useEffect } from 'react'
import Login from './components/Login'
import ClientPortal from './pages/ClientePortal'
import TechPortal from './pages/TechPortal'
import { userService } from './services/userService'
import {
  canAccessAdminPanel,
  canManageRoles,
  normalizeRole,
} from './constants/permissions'

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)
  const [modoVista, setModoVista] = useState('ADMIN')

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

  const actualizarUsuarioSesion = (usuarioActualizado) => {
    if (!usuarioActualizado?.id) return;
    setUsuarioLogueado(usuarioActualizado);
    const sesionGuardada = localStorage.getItem('sesionComutel');
    if (!sesionGuardada) return;
    try {
      const datos = JSON.parse(sesionGuardada);
      localStorage.setItem('sesionComutel', JSON.stringify({ ...datos, usuario: usuarioActualizado }));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!usuarioLogueado?.id) return;

    const sincronizarUsuario = async () => {
      try {
        const usuarios = await userService.listar();
        const actual = (usuarios || []).find((u) => String(u.id) === String(usuarioLogueado.id));
        if (!actual) return;

        const rolSesion = normalizeRole(usuarioLogueado.rol);
        const rolActual = normalizeRole(actual.rol);
        if (rolSesion !== rolActual) {
          actualizarUsuarioSesion(actual);
        }
      } catch (error) {
        console.error("No se pudo sincronizar rol de sesion", error);
      }
    };

    sincronizarUsuario();
    const interval = setInterval(sincronizarUsuario, 15000);
    return () => clearInterval(interval);
  }, [usuarioLogueado?.id, usuarioLogueado?.rol]);

  // --- EL TRAFICO ---

  // 1. Login
  if (!usuarioLogueado) {
    return <Login alIniciarSesion={iniciarSesion} />
  }

  const role = normalizeRole(usuarioLogueado?.rol)
  const esSuperAdmin = role === 'TESTERADMIN'
  const puedeVerAdmin = canAccessAdminPanel(role)
  const puedeGestionarRoles = canManageRoles(role)

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
      puedeGestionarRoles={puedeGestionarRoles}
      esSuperAdmin={esSuperAdmin}
      modoVista={modoVista}
      onAlternarVista={alternarVistaSuperAdmin}
      onUsuarioActualizado={actualizarUsuarioSesion}
    />
  )
}

export default App
