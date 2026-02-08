import { useState } from 'react';

const Sidebar = ({ seccionActual, setSeccionActual, cerrarSesion, esAdmin }) => {
  const [colapsado, setColapsado] = useState(false);

  const menuItems = [
    { id: 'PANEL', icono: '🏠', label: 'Inicio (SLA)' },
    { id: 'DASHBOARD', icono: '📊', label: 'Métricas / BI' },
    { id: 'TICKETS', icono: '📋', label: 'Incidencias' },
    { id: 'KB', icono: '📚', label: 'Base Conocimiento' },
  ];

  // Solo mostramos esto si el usuario tiene rol ADMIN
  if (esAdmin) {
    menuItems.push({ id: 'ADMIN', icono: '⚙️', label: 'Administración' });
  }

  return (
    <div className={`h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 ${colapsado ? 'w-20' : 'w-64'}`}>
      
      {/* HEADER DEL SIDEBAR */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        {!colapsado && <span className="font-bold text-xl tracking-wider">COMUTEL SERVICES </span>}
        <button onClick={() => setColapsado(!colapsado)} className="p-1 hover:bg-slate-700 rounded text-gray-300">
          {colapsado ? '➡' : '⬅'}
        </button>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <nav className="flex-1 mt-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setSeccionActual(item.id)}
                className={`w-full flex items-center p-3 transition-colors 
                  ${seccionActual === item.id ? 'bg-blue-600 text-white border-l-4 border-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <span className="text-xl">{item.icono}</span>
                {!colapsado && <span className="ml-3 font-medium text-sm">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* FOOTER (Usuario + Logout) */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                U
            </div>
            {!colapsado && (
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Mi Perfil</p>
                    <button onClick={cerrarSesion} className="text-xs text-red-400 hover:text-red-300">
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;