import { useEffect, useState } from 'react';
import {
  BRANDING_EVENT,
  getButtonRadius,
  loadBrandingConfig,
} from '../../utils/brandingTheme';

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
  const [branding, setBranding] = useState(() => loadBrandingConfig());

  useEffect(() => {
    const syncBranding = () => setBranding(loadBrandingConfig());
    window.addEventListener(BRANDING_EVENT, syncBranding);
    return () => {
      window.removeEventListener(BRANDING_EVENT, syncBranding);
    };
  }, []);

  const menuItems = [
    { id: 'PANEL', icono: 'IN', label: 'Inicio' },
    { id: 'METRICAS', icono: 'BI', label: 'Metricas' },
    { id: 'TICKETS', icono: 'TK', label: 'Incidencias' },
    { id: 'KB', icono: 'KB', label: 'Base Conocimiento' },
  ];

  if (puedeVerAdmin) {
    menuItems.push({ type: 'separator', label: 'ADMINISTRACION' });
    menuItems.push({ id: 'USUARIOS', icono: 'US', label: 'Usuarios' });
    menuItems.push({ id: 'GRUPOS', icono: 'GR', label: 'Grupos' });
    menuItems.push({ id: 'WORKFLOWS', icono: 'WF', label: 'Flujos' });
    menuItems.push({ id: 'CATALOGOS', icono: 'CT', label: 'Tipos y Categorias' });
    menuItems.push({ id: 'PERSONALIZACION', icono: 'BR', label: 'Personalizacion Visual' });
  }

  if (puedeGestionarRoles) {
    menuItems.push({ type: 'separator', label: 'SEGURIDAD' });
    menuItems.push({ id: 'ROLES', icono: 'RP', label: 'Roles / Permisos' });
  }

  return (
    <div
      className={`h-screen flex flex-col transition-all duration-300 ${colapsado ? 'w-20' : branding.navCompact ? 'w-56' : 'w-64'}`}
      style={{ backgroundColor: branding.panelColor, color: 'var(--itsm-panel-text)' }}
    >
      <div className="p-4 flex items-center justify-between border-b border-slate-700 h-16 shrink-0">
        {!colapsado && (
          <div className="flex items-center gap-2 min-w-0">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="logo empresa" className="h-8 w-8 rounded object-cover bg-white" />
            ) : null}
            <span className="font-bold text-sm tracking-wider truncate" style={{ color: branding.accentColor }}>
              {branding.companyName}
            </span>
          </div>
        )}
        <button
          onClick={() => setColapsado(!colapsado)}
          className="p-1 hover:bg-white/10 rounded ml-auto"
          data-itsm-role="panel-text"
        >
          {colapsado ? '>' : '<'}
        </button>
      </div>

      <nav className="flex-1 mt-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 px-2">
          {menuItems.map((item, index) => {
            if (item.type === 'separator') {
              return !colapsado ? (
                <li key={`sep-${index}`} className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest" data-itsm-role="panel-muted">
                  {item.label}
                </li>
              ) : null;
            }

            return (
              <li key={item.id}>
                <button
                  onClick={() => setSeccionActual(item.id)}
                  style={{
                    borderRadius: getButtonRadius(branding.buttonShape),
                    ...(seccionActual === item.id
                      ? {
                          background:
                            branding.buttonStyle === 'gradient'
                              ? `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})`
                              : branding.primaryColor,
                          boxShadow: branding.buttonShadow ? '0 8px 18px -12px rgba(15, 23, 42, 0.9)' : 'none',
                        }
                      : {}),
                  }}
                  className={`w-full flex items-center p-3 transition-all duration-200 group ${
                    seccionActual === item.id
                      ? 'text-white'
                      : 'hover:bg-white/10'
                  }`}
                  data-itsm-role={seccionActual === item.id ? 'panel-text' : 'panel-muted'}
                >
                  <span className={`text-xs font-bold transition-transform group-hover:scale-110 ${seccionActual === item.id ? 'scale-110' : ''}`}>
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
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
            style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})` }}
          >
            JP
          </div>
          {!colapsado && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-itsm-role="panel-text">Mi Perfil</p>
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
