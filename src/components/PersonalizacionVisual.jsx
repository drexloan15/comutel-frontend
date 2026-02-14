import { useEffect, useMemo, useState } from 'react';
import {
  applyBrandingTheme,
  defaultBrandingConfig,
  hydrateBrandingConfig,
  loadBrandingConfig,
  notifyBrandingUpdated,
  normalizeBrandingConfig,
  resetBrandingConfig,
  saveBrandingConfig,
} from '../utils/brandingTheme';

const shapeOptions = [
  { value: 'square', label: 'Recto' },
  { value: 'rounded', label: 'Redondeado' },
  { value: 'pill', label: 'Pildora' },
];

const styleOptions = [
  { value: 'solid', label: 'Solido' },
  { value: 'outline', label: 'Borde' },
  { value: 'gradient', label: 'Gradiente' },
];

const fontOptions = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
];

const densityOptions = [
  { value: 'compact', label: 'Compacta' },
  { value: 'normal', label: 'Normal' },
  { value: 'comfortable', label: 'Comoda' },
];

const colorGroups = [
  {
    title: 'Marca',
    fields: [
      { key: 'primaryColor', label: 'Primario' },
      { key: 'secondaryColor', label: 'Secundario' },
      { key: 'accentColor', label: 'Acento' },
    ],
  },
  {
    title: 'Aplicacion',
    fields: [
      { key: 'appBackground', label: 'Fondo App' },
      { key: 'textColor', label: 'Texto principal' },
      { key: 'headerBackground', label: 'Fondo header' },
      { key: 'headerTextColor', label: 'Texto header' },
      { key: 'panelColor', label: 'Fondo sidebar' },
      { key: 'panelTextColor', label: 'Texto sidebar' },
      { key: 'panelMutedTextColor', label: 'Texto sidebar secundario' },
    ],
  },
  {
    title: 'Componentes',
    fields: [
      { key: 'cardBackground', label: 'Tarjeta fondo' },
      { key: 'cardBorderColor', label: 'Tarjeta borde' },
      { key: 'inputBackground', label: 'Input fondo' },
      { key: 'inputTextColor', label: 'Input texto' },
      { key: 'inputBorderColor', label: 'Input borde' },
      { key: 'tableHeaderBackground', label: 'Tabla header fondo' },
      { key: 'tableHeaderTextColor', label: 'Tabla header texto' },
    ],
  },
];

const presets = {
  corporativo: {
    primaryColor: '#0f62fe',
    secondaryColor: '#1f2937',
    accentColor: '#0ea5e9',
    panelColor: '#0b1220',
    headerBackground: '#f8fafc',
    cardBackground: '#ffffff',
    appBackground: '#e2e8f0',
  },
  sunset: {
    primaryColor: '#ea580c',
    secondaryColor: '#7c2d12',
    accentColor: '#f59e0b',
    panelColor: '#431407',
    headerBackground: '#fff7ed',
    cardBackground: '#fffbeb',
    appBackground: '#ffedd5',
  },
  emerald: {
    primaryColor: '#047857',
    secondaryColor: '#064e3b',
    accentColor: '#22c55e',
    panelColor: '#022c22',
    headerBackground: '#ecfdf5',
    cardBackground: '#ffffff',
    appBackground: '#d1fae5',
  },
};

function readFileAsDataUrl(file, onDone) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => onDone(reader.result?.toString() || '');
  reader.readAsDataURL(file);
}

function downloadJson(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function PersonalizacionVisual() {
  const [draft, setDraft] = useState(() => loadBrandingConfig());
  const [guardado, setGuardado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;
    hydrateBrandingConfig()
      .then((config) => {
        if (!activo) return;
        setDraft(normalizeBrandingConfig(config));
      })
      .catch(() => {
        // ignore and keep default cache
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    applyBrandingTheme(draft);
    notifyBrandingUpdated();
  }, [draft]);

  const buttonPreviewStyle = useMemo(() => {
    const base = {
      borderRadius: draft.buttonShape === 'pill' ? '999px' : draft.buttonShape === 'square' ? '6px' : '12px',
      textTransform: draft.buttonTextUppercase ? 'uppercase' : 'none',
    };

    if (draft.buttonStyle === 'outline') {
      return {
        ...base,
        background: 'transparent',
        color: draft.primaryColor,
        border: `1px solid ${draft.primaryColor}`,
      };
    }

    if (draft.buttonStyle === 'gradient') {
      return {
        ...base,
        background: `linear-gradient(135deg, ${draft.primaryColor}, ${draft.accentColor})`,
        color: '#fff',
        border: '1px solid transparent',
      };
    }

    return {
      ...base,
      background: draft.primaryColor,
      color: '#fff',
      border: '1px solid transparent',
    };
  }, [draft]);

  const actualizar = (campo, valor) => {
    setGuardado(false);
    setMensaje('');
    setDraft((prev) => normalizeBrandingConfig({ ...prev, [campo]: valor }));
  };

  const aplicarPreset = (key) => {
    const selected = presets[key];
    if (!selected) return;
    setDraft((prev) => normalizeBrandingConfig({ ...prev, ...selected }));
    setMensaje(`Preset aplicado: ${key}`);
  };

  const guardar = async () => {
    try {
      const finalConfig = await saveBrandingConfig(draft);
      setDraft(finalConfig);
      setGuardado(true);
      setMensaje('Personalizacion guardada en backend');
      setTimeout(() => setGuardado(false), 1800);
    } catch (error) {
      setMensaje(error?.message || 'No se pudo guardar la personalizacion');
    }
  };

  const restaurar = async () => {
    try {
      const defaults = await resetBrandingConfig();
      setDraft(defaults);
      setGuardado(false);
      setMensaje('Se restauraron valores por defecto en backend');
    } catch (error) {
      setMensaje(error?.message || 'No se pudo restaurar la personalizacion');
    }
  };

  const exportar = () => {
    downloadJson('itsm-branding-theme.json', JSON.stringify(normalizeBrandingConfig(draft), null, 2));
    setMensaje('Tema exportado');
  };

  const importar = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result?.toString() || '{}');
        const normalized = normalizeBrandingConfig(parsed);
        setDraft(normalized);
        setMensaje('Tema importado');
      } catch {
        setMensaje('No se pudo importar el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto itsm-theme">
      <div className="itsm-card p-6 border">
        <h2 className="text-2xl font-bold">Personalizacion Total de la Plataforma</h2>
        <p className="text-sm mt-1 opacity-80">
          Personaliza identidad, colores, header, sidebar, formularios, tablas, tipografia, densidad, radios, sombras y CSS avanzado.
        </p>
      </div>

      <div className="itsm-card p-4 border flex flex-wrap gap-2 items-center">
        <button onClick={() => aplicarPreset('corporativo')} className="px-3 py-2 itsm-primary-btn">Preset Corporativo</button>
        <button onClick={() => aplicarPreset('sunset')} className="px-3 py-2 border">Preset Sunset</button>
        <button onClick={() => aplicarPreset('emerald')} className="px-3 py-2 border">Preset Emerald</button>
        <button onClick={exportar} className="px-3 py-2 border">Exportar JSON</button>
        <label className="px-3 py-2 border cursor-pointer">
          Importar JSON
          <input type="file" accept="application/json" onChange={(e) => importar(e.target.files?.[0])} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-6">
          <div className="itsm-card p-6 border">
            <h3 className="text-lg font-semibold">Identidad corporativa</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <label className="space-y-1">
                <span className="text-sm">Nombre empresa</span>
                <input type="text" value={draft.companyName} onChange={(e) => actualizar('companyName', e.target.value)} className="w-full px-3" />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Slogan</span>
                <input type="text" value={draft.slogan} onChange={(e) => actualizar('slogan', e.target.value)} className="w-full px-3" />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Logo URL</span>
                <input type="text" value={draft.logoUrl} onChange={(e) => actualizar('logoUrl', e.target.value)} className="w-full px-3" />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Favicon URL</span>
                <input type="text" value={draft.faviconUrl} onChange={(e) => actualizar('faviconUrl', e.target.value)} className="w-full px-3" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm">Imagen fondo URL</span>
                <input type="text" value={draft.backgroundImageUrl} onChange={(e) => actualizar('backgroundImageUrl', e.target.value)} className="w-full px-3" />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Subir logo</span>
                <input type="file" accept="image/*" onChange={(e) => readFileAsDataUrl(e.target.files?.[0], (data) => actualizar('logoUrl', data))} className="w-full px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Subir fondo</span>
                <input type="file" accept="image/*" onChange={(e) => readFileAsDataUrl(e.target.files?.[0], (data) => actualizar('backgroundImageUrl', data))} className="w-full px-3 py-2" />
              </label>
            </div>
          </div>

          {colorGroups.map((group) => (
            <div key={group.title} className="itsm-card p-6 border">
              <h3 className="text-lg font-semibold">{group.title}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {group.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <span className="text-sm">{field.label}</span>
                    <div className="flex items-center gap-2">
                      <input type="color" value={draft[field.key]} onChange={(e) => actualizar(field.key, e.target.value)} className="w-12 h-10 p-1" />
                      <input type="text" value={draft[field.key]} onChange={(e) => actualizar(field.key, e.target.value)} className="flex-1 px-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="itsm-card p-6 border">
            <h3 className="text-lg font-semibold">Tipografia y layout</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <label className="space-y-1">
                <span className="text-sm">Fuente base</span>
                <select value={draft.fontFamily} onChange={(e) => actualizar('fontFamily', e.target.value)} className="w-full px-3">
                  {fontOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm">Densidad UI</span>
                <select value={draft.density} onChange={(e) => actualizar('density', e.target.value)} className="w-full px-3">
                  {densityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm">Tamano fuente: {draft.baseFontSize}px</span>
                <input type="range" min="12" max="18" value={draft.baseFontSize} onChange={(e) => actualizar('baseFontSize', Number(e.target.value))} className="w-full" />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Radio global: {draft.globalRadius}px</span>
                <input type="range" min="4" max="24" value={draft.globalRadius} onChange={(e) => actualizar('globalRadius', Number(e.target.value))} className="w-full" />
              </label>

              <label className="space-y-1">
                <span className="text-sm">Fuerza sombra: {draft.shadowStrength}</span>
                <input type="range" min="0" max="3" value={draft.shadowStrength} onChange={(e) => actualizar('shadowStrength', Number(e.target.value))} className="w-full" />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Overlay fondo: {draft.appOverlayOpacity.toFixed(2)}</span>
                <input type="range" min="0" max="1" step="0.05" value={draft.appOverlayOpacity} onChange={(e) => actualizar('appOverlayOpacity', Number(e.target.value))} className="w-full" />
              </label>
            </div>
          </div>

          <div className="itsm-card p-6 border">
            <h3 className="text-lg font-semibold">Botones, sidebar y header</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <label className="space-y-1">
                <span className="text-sm">Forma boton</span>
                <select value={draft.buttonShape} onChange={(e) => actualizar('buttonShape', e.target.value)} className="w-full px-3">
                  {shapeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm">Estilo boton</span>
                <select value={draft.buttonStyle} onChange={(e) => actualizar('buttonStyle', e.target.value)} className="w-full px-3">
                  {styleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={draft.buttonShadow} onChange={(e) => actualizar('buttonShadow', e.target.checked)} />
                <span className="text-sm">Sombra en botones</span>
              </label>
              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={draft.buttonTextUppercase} onChange={(e) => actualizar('buttonTextUppercase', e.target.checked)} />
                <span className="text-sm">Texto botones en mayusculas</span>
              </label>
              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={draft.navCompact} onChange={(e) => actualizar('navCompact', e.target.checked)} />
                <span className="text-sm">Sidebar compacto</span>
              </label>
              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={draft.hideTopHeader} onChange={(e) => actualizar('hideTopHeader', e.target.checked)} />
                <span className="text-sm">Ocultar header superior</span>
              </label>
              <label className="inline-flex items-center gap-2 mt-2 md:col-span-2">
                <input type="checkbox" checked={draft.glassHeader} onChange={(e) => actualizar('glassHeader', e.target.checked)} />
                <span className="text-sm">Header efecto glass</span>
              </label>
            </div>
          </div>

          <div className="itsm-card p-6 border">
            <h3 className="text-lg font-semibold">CSS avanzado (opcional)</h3>
            <textarea
              value={draft.customCss}
              onChange={(e) => actualizar('customCss', e.target.value)}
              className="w-full min-h-36 px-3 py-2"
              placeholder=".mi-clase { border-radius: 18px; }"
            />
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <button onClick={guardar} className="px-5 py-2.5 font-semibold itsm-primary-btn">Guardar personalizacion</button>
            <button onClick={restaurar} className="px-5 py-2.5 border font-semibold">Restaurar defaults</button>
            {guardado && <span className="text-sm font-medium text-emerald-600">Guardado</span>}
            {mensaje && <span className="text-sm opacity-80">{mensaje}</span>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="itsm-card p-5 border">
            <h4 className="font-semibold">Vista previa live</h4>
            <p className="text-xs mt-1 opacity-70">Se aplica en tiempo real sobre toda la plataforma.</p>

            <div className="mt-4 rounded-xl overflow-hidden border" style={{ backgroundColor: draft.panelColor }}>
              <div className="p-3 border-b border-white/20 flex items-center gap-2" style={{ color: draft.panelTextColor }}>
                {draft.logoUrl ? (
                  <img src={draft.logoUrl} alt="logo" className="h-8 w-8 rounded object-cover bg-white" />
                ) : (
                  <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center text-xs">LOGO</div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{draft.companyName || defaultBrandingConfig.companyName}</p>
                  <p className="text-[10px] truncate" style={{ color: draft.panelMutedTextColor }}>{draft.slogan || defaultBrandingConfig.slogan}</p>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <button className="w-full px-3 py-2 text-sm" style={buttonPreviewStyle}>Crear incidencia</button>
                <button className="w-full px-3 py-2 text-sm border" style={{ color: draft.accentColor, borderColor: draft.accentColor }}>Ver reportes</button>
              </div>
            </div>

            <div
              className="mt-4 rounded-xl p-4 border"
              style={{
                backgroundColor: draft.cardBackground,
                color: draft.textColor,
                borderColor: draft.cardBorderColor,
                borderRadius: `${draft.globalRadius}px`,
              }}
            >
              <div className="text-sm font-semibold">Cabecera y tablas</div>
              <div className="mt-2 rounded p-2 text-xs" style={{ backgroundColor: draft.headerBackground, color: draft.headerTextColor }}>
                Header ejemplo
              </div>
              <div className="mt-2 rounded p-2 text-xs" style={{ backgroundColor: draft.tableHeaderBackground, color: draft.tableHeaderTextColor }}>
                Tabla header ejemplo
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PersonalizacionVisual;
