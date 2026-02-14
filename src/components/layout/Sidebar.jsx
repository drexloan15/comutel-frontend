import { useState } from 'react';

const Sidebar = ({
  seccionActual,
  setSeccionActual,
  cerrarSesion,
  puedeVerAdmin,
  esSuperAdmin,
  puedeGestionarRoles,
  modoVista,
  onAlternarVista,
}) => {
  const [colapsado, setColapsado] = useState(false);

  const menuItems = [
    { id: 'PANEL', icono: '🏠', label: 'Inicio' },
    { id: 'METRICAS', icono: '📊', label: 'Metricas' },
    { id: 'TICKETS', icono: '📋', label: 'Incidencias' },
    { id: 'KB', icono: '📚', label: 'Base Conocimiento' },
  ];

  if (puedeVerAdmin) {
    menuItems.push({ type: 'separator', label: 'ADMINISTRACION' });
    menuItems.push({ id: 'USUARIOS', icono: '👥', label: 'Usuarios' });
    menuItems.push({ id: 'GRUPOS', icono: '🏢', label: 'Grupos' });
    menuItems.push({ id: 'WORKFLOWS', icono: '🔗', label: 'Flujos' });
    menuItems.push({ id: 'CATALOGOS', icono: '🧩', label: 'Tipos y Categorias' });
  }

  if (puedeGestionarRoles) {
    menuItems.push({ type: 'separator', label: 'SEGURIDAD' });
    menuItems.push({ id: 'ROLES', icono: '🛡️', label: 'Roles / Permisos' });
  }

  return (
    <div className={`h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 ${colapsado ? 'w-20' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between border-b border-slate-700 h-16 shrink-0">
        {!colapsado && <span className="font-bold text-lg tracking-wider text-teal-400">COMUTEL SERVICES</span>}
        <button onClick={() => setColapsado(!colapsado)} className="p-1 hover:bg-slate-700 rounded text-gray-300 ml-auto">
          {colapsado ? '>' : '<'}
        </button>
      </div>

      <nav className="flex-1 mt-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 px-2">
          {menuItems.map((item, index) => {
            if (item.type === 'separator') {
              return !colapsado ? (
                <li key={`sep-${index}`} className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {item.label}
                </li>
              ) : null;
            }

            return (
              <li key={item.id}>
                <button
                  onClick={() => setSeccionActual(item.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group ${
                    seccionActual === item.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className={`text-xl transition-transform group-hover:scale-110 ${seccionActual === item.id ? 'scale-110' : ''}`}>
                    {item.icono}
                  </span>

                  {!colapsado && <span className="ml-3 font-medium text-sm whitespace-nowrap">{item.label}</span>}

                  {!colapsado && seccionActual === item.id && <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold shadow-lg">
            JP
          </div>
          {!colapsado && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">Mi Perfil</p>
              {esSuperAdmin && (
                <button
                  onClick={onAlternarVista}
                  className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 mt-0.5"
                >
                  {modoVista === 'ADMIN' ? 'Cambiar a vista cliente' : 'Cambiar a vista admin'}
                </button>
              )}
              <button onClick={cerrarSesion} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-0.5">
                Cerrar Sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
