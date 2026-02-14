import { useEffect, useMemo, useRef, useState } from "react";
import { workflowService } from "../services/workflowService";

const PROCESS_TYPES = ["INCIDENCIA", "REQUERIMIENTO", "CAMBIO", "APROBACION"];
const STATE_TYPES = ["START", "NORMAL", "END"];

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;
const STORAGE_PREFIX = "workflow-layout";

const sortStates = (states = []) => {
  const orderMap = { START: 0, NORMAL: 1, END: 2 };
  return [...states].sort((a, b) => {
    const orderA = orderMap[a.stateType] ?? 10;
    const orderB = orderMap[b.stateType] ?? 10;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.stateKey || "").localeCompare(String(b.stateKey || ""));
  });
};

const getTypeGradient = (stateType) => {
  if (stateType === "START") return "from-blue-600 to-cyan-500";
  if (stateType === "END") return "from-rose-600 to-orange-500";
  return "from-slate-800 to-slate-600";
};

const getStorageKey = (definitionId) => `${STORAGE_PREFIX}-${definitionId}`;

function WorkflowDesigner() {
  const [definitions, setDefinitions] = useState([]);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nodePositions, setNodePositions] = useState({});
  const [selectedStateKey, setSelectedStateKey] = useState(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [quickTransitionOpen, setQuickTransitionOpen] = useState(false);

  const canvasRef = useRef(null);

  const [newDefinition, setNewDefinition] = useState({
    key: "",
    name: "",
    processType: "INCIDENCIA",
    version: 1,
  });

  const [newState, setNewState] = useState({
    stateKey: "",
    name: "",
    stateType: "NORMAL",
    externalStatus: "",
    uiColor: "",
  });

  const [newTransition, setNewTransition] = useState({
    fromStateKey: "",
    toStateKey: "",
    eventKey: "",
    name: "",
    priority: 100,
    conditionExpression: "",
  });

  const [quickTransition, setQuickTransition] = useState({
    fromStateKey: "",
    toStateKey: "",
    eventKey: "",
    name: "",
    priority: 100,
    conditionExpression: "",
  });

  const states = sortStates(detail?.states || []);
  const transitions = detail?.transitions || [];

  const selectedState = useMemo(
    () => states.find((state) => state.stateKey === selectedStateKey) || null,
    [states, selectedStateKey]
  );

  const selectedTransition = useMemo(
    () => transitions.find((transition) => transition.id === selectedTransitionId) || null,
    [transitions, selectedTransitionId]
  );

  const loadDefinitions = async () => {
    try {
      setLoading(true);
      const data = await workflowService.listarDefiniciones();
      const normalized = Array.isArray(data) ? data : [data].filter(Boolean);
      setDefinitions(normalized);
      if (!selectedDefinitionId && normalized.length > 0) {
        setSelectedDefinitionId(normalized[0].id);
      }
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudieron cargar los workflows");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (definitionId) => {
    if (!definitionId) {
      setDetail(null);
      return;
    }

    try {
      setLoading(true);
      const data = await workflowService.obtenerDefinicion(definitionId);
      setDetail(data);
      const firstState = data?.states?.[0]?.stateKey || "";
      setNewTransition((prev) => ({
        ...prev,
        fromStateKey: firstState,
        toStateKey: firstState,
      }));
      setSelectedStateKey(firstState || null);
      setSelectedTransitionId(null);
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo cargar el detalle del workflow");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefinitions();
  }, []);

  useEffect(() => {
    loadDetail(selectedDefinitionId);
  }, [selectedDefinitionId]);

  useEffect(() => {
    if (!selectedDefinitionId) {
      setNodePositions({});
      return;
    }

    const key = getStorageKey(selectedDefinitionId);
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      stored = {};
    }

    const next = {};
    states.forEach((state, index) => {
      const saved = stored[state.stateKey];
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        next[state.stateKey] = saved;
      } else {
        const col = index % 3;
        const row = Math.floor(index / 3);
        next[state.stateKey] = {
          x: 70 + col * 290,
          y: 80 + row * 210,
        };
      }
    });

    setNodePositions(next);
  }, [selectedDefinitionId, detail?.id, states.length]);

  useEffect(() => {
    if (!selectedDefinitionId || !Object.keys(nodePositions).length) return;
    localStorage.setItem(getStorageKey(selectedDefinitionId), JSON.stringify(nodePositions));
  }, [selectedDefinitionId, nodePositions]);

  const getCanvasPoint = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  useEffect(() => {
    if (!dragging && !connecting) return;

    const onMouseMove = (event) => {
      if (dragging) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const maxX = Math.max(24, rect.width - NODE_WIDTH - 24);
        const maxY = Math.max(24, rect.height - NODE_HEIGHT - 24);

        const x = Math.min(maxX, Math.max(24, event.clientX - rect.left - dragging.offsetX));
        const y = Math.min(maxY, Math.max(24, event.clientY - rect.top - dragging.offsetY));

        setNodePositions((prev) => ({
          ...prev,
          [dragging.stateKey]: { x, y },
        }));
      }

      if (connecting) {
        const point = getCanvasPoint(event.clientX, event.clientY);
        setConnecting((prev) => (prev ? { ...prev, x: point.x, y: point.y } : prev));
      }
    };

    const onMouseUp = () => {
      setDragging(null);
      if (connecting) {
        setConnecting(null);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, connecting]);

  const transitionLines = useMemo(() => {
    return transitions
      .map((transition) => {
        const from = nodePositions[transition.fromStateKey];
        const to = nodePositions[transition.toStateKey];
        if (!from || !to) return null;

        const x1 = from.x + NODE_WIDTH;
        const y1 = from.y + NODE_HEIGHT / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_HEIGHT / 2;
        const controlOffset = Math.max(80, Math.abs(x2 - x1) * 0.35);
        const path = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

        return {
          id: transition.id,
          path,
          labelX: (x1 + x2) / 2,
          labelY: (y1 + y2) / 2,
          eventKey: transition.eventKey,
          fromStateKey: transition.fromStateKey,
        };
      })
      .filter(Boolean);
  }, [nodePositions, transitions]);

  const connectionPreviewPath = useMemo(() => {
    if (!connecting) return null;
    const from = nodePositions[connecting.fromStateKey];
    if (!from) return null;

    const x1 = from.x + NODE_WIDTH;
    const y1 = from.y + NODE_HEIGHT / 2;
    const x2 = connecting.x;
    const y2 = connecting.y;
    const controlOffset = Math.max(80, Math.abs(x2 - x1) * 0.35);

    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  }, [connecting, nodePositions]);

  const openQuickTransitionModal = (fromStateKey, toStateKey) => {
    setQuickTransition({
      fromStateKey,
      toStateKey,
      eventKey: "",
      name: "",
      priority: 100,
      conditionExpression: "",
    });
    setQuickTransitionOpen(true);
  };

  const saveTransition = async (payload) => {
    if (!selectedDefinitionId) return;
    await workflowService.agregarTransicion(selectedDefinitionId, {
      ...payload,
      fromStateKey: payload.fromStateKey.trim(),
      toStateKey: payload.toStateKey.trim(),
      eventKey: payload.eventKey.trim(),
      name: payload.name.trim(),
      priority: Number(payload.priority) || 100,
      conditionExpression: payload.conditionExpression?.trim() || null,
    });
  };

  const handleCreateDefinition = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await workflowService.crearDefinicion({
        ...newDefinition,
        key: newDefinition.key.trim(),
        name: newDefinition.name.trim(),
        version: Number(newDefinition.version) || 1,
      });
      setNewDefinition({ key: "", name: "", processType: "INCIDENCIA", version: 1 });
      await loadDefinitions();
      alert("Workflow creado");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo crear el workflow");
    } finally {
      setSaving(false);
    }
  };

  const handleAddState = async (event) => {
    event.preventDefault();
    if (!selectedDefinitionId) return;

    try {
      setSaving(true);
      await workflowService.agregarEstado(selectedDefinitionId, {
        ...newState,
        stateKey: newState.stateKey.trim(),
        name: newState.name.trim(),
        externalStatus: newState.externalStatus.trim() || null,
        uiColor: newState.uiColor.trim() || null,
      });
      setNewState({ stateKey: "", name: "", stateType: "NORMAL", externalStatus: "", uiColor: "" });
      await loadDetail(selectedDefinitionId);
      alert("Estado agregado");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo agregar el estado");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransition = async (event) => {
    event.preventDefault();
    if (!selectedDefinitionId) return;

    try {
      setSaving(true);
      await saveTransition(newTransition);
      setNewTransition((prev) => ({
        ...prev,
        eventKey: "",
        name: "",
        conditionExpression: "",
        priority: 100,
      }));
      await loadDetail(selectedDefinitionId);
      alert("Transicion agregada");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo agregar la transicion");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickTransitionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedDefinitionId) return;

    try {
      setSaving(true);
      await saveTransition(quickTransition);
      setQuickTransitionOpen(false);
      await loadDetail(selectedDefinitionId);
      alert("Transicion creada desde el lienzo");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo crear la transicion");
    } finally {
      setSaving(false);
    }
  };

  const handleActivateDefinition = async () => {
    if (!selectedDefinitionId) return;
    try {
      setSaving(true);
      await workflowService.activarDefinicion(selectedDefinitionId);
      await Promise.all([loadDefinitions(), loadDetail(selectedDefinitionId)]);
      alert("Workflow activado");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo activar el workflow");
    } finally {
      setSaving(false);
    }
  };

  const handleTransitionSelect = (line) => {
    setSelectedTransitionId(line.id);
    setSelectedStateKey(null);
  };

  const duplicateTransitionToForm = () => {
    if (!selectedTransition) return;
    setNewTransition({
      fromStateKey: selectedTransition.fromStateKey || "",
      toStateKey: selectedTransition.toStateKey || "",
      eventKey: selectedTransition.eventKey || "",
      name: selectedTransition.name || "",
      priority: selectedTransition.priority || 100,
      conditionExpression: selectedTransition.conditionExpression || "",
    });
  };

  return (
    <div className="h-full bg-slate-100 p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_360px] gap-6 h-full">
        <aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 overflow-y-auto">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Workflows</h2>
          <div className="space-y-2">
            {definitions.map((def) => (
              <button
                key={def.id}
                onClick={() => setSelectedDefinitionId(def.id)}
                className={`w-full text-left p-3 rounded-xl border transition ${selectedDefinitionId === def.id ? "border-cyan-300 bg-cyan-50" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <p className="font-bold text-slate-800 text-sm">{def.name}</p>
                <p className="text-xs text-slate-500">{def.key} v{def.version}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{def.processType}</span>
                  <span className={`px-2 py-0.5 rounded ${def.active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {def.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </button>
            ))}
            {!loading && definitions.length === 0 && <p className="text-sm text-slate-400">Sin workflows</p>}
          </div>
        </aside>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-black text-slate-800">Workflow Designer</h1>
              <p className="text-sm text-slate-500">Drag nodos y conecta estados arrastrando desde el puerto derecho</p>
            </div>
            <button
              onClick={handleActivateDefinition}
              disabled={!selectedDefinitionId || saving}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              Activar workflow
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-3 text-xs font-semibold text-slate-600 flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded bg-white border border-slate-200">Estado seleccionado: {selectedStateKey || "Ninguno"}</span>
            <span className="px-2 py-1 rounded bg-white border border-slate-200">Arista seleccionada: {selectedTransitionId || "Ninguna"}</span>
            <span className="px-2 py-1 rounded bg-white border border-slate-200">Estados: {states.length}</span>
            <span className="px-2 py-1 rounded bg-white border border-slate-200">Transiciones: {transitions.length}</span>
          </div>

          <div
            ref={canvasRef}
            className="relative flex-1 min-h-[560px] rounded-2xl border border-slate-200 bg-[radial-gradient(#dbeafe_1px,transparent_1px)] [background-size:22px_22px] overflow-hidden"
          >
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
                </marker>
                <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#0f766e" />
                </marker>
              </defs>
              {transitionLines.map((line) => {
                const highlighted = selectedStateKey && line.fromStateKey === selectedStateKey;
                const selected = line.id === selectedTransitionId;
                return (
                  <g key={line.id}>
                    <path
                      d={line.path}
                      fill="none"
                      stroke={selected ? "#0f766e" : highlighted ? "#0f766e" : "#64748b"}
                      strokeWidth={selected ? 3.4 : highlighted ? 2.8 : 2}
                      markerEnd={selected || highlighted ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                      opacity={selected || highlighted ? 1 : 0.7}
                      onClick={() => handleTransitionSelect(line)}
                      style={{ cursor: "pointer" }}
                    />
                    <text
                      x={line.labelX}
                      y={line.labelY - 6}
                      textAnchor="middle"
                      className="fill-slate-700 text-[10px] font-bold"
                    >
                      {line.eventKey}
                    </text>
                  </g>
                );
              })}

              {connectionPreviewPath && (
                <path
                  d={connectionPreviewPath}
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  markerEnd="url(#arrowhead-active)"
                />
              )}
            </svg>

            {states.map((state) => {
              const pos = nodePositions[state.stateKey] || { x: 40, y: 40 };
              const selected = selectedStateKey === state.stateKey;
              return (
                <div
                  key={state.stateKey}
                  className={`absolute select-none rounded-2xl shadow-lg border ${selected ? "border-cyan-300 ring-2 ring-cyan-200" : "border-slate-200"}`}
                  style={{
                    width: `${NODE_WIDTH}px`,
                    height: `${NODE_HEIGHT}px`,
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                  }}
                  onMouseDown={(event) => {
                    if (event.button !== 0) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    setSelectedStateKey(state.stateKey);
                    setSelectedTransitionId(null);
                    setDragging({
                      stateKey: state.stateKey,
                      offsetX: event.clientX - rect.left,
                      offsetY: event.clientY - rect.top,
                    });
                  }}
                  onMouseUp={(event) => {
                    if (!connecting) return;
                    event.stopPropagation();
                    if (connecting.fromStateKey === state.stateKey) {
                      setConnecting(null);
                      return;
                    }
                    const fromStateKey = connecting.fromStateKey;
                    setConnecting(null);
                    openQuickTransitionModal(fromStateKey, state.stateKey);
                  }}
                >
                  <div className={`h-full rounded-2xl p-3 text-white bg-gradient-to-r ${getTypeGradient(state.stateType)} cursor-grab active:cursor-grabbing`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] uppercase font-bold opacity-80">{state.stateType}</p>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">{state.stateKey}</span>
                    </div>
                    <h3 className="font-black text-base mt-1 leading-tight">{state.name}</h3>
                    <p className="text-xs opacity-90 mt-2">Estado externo: {state.externalStatus || "N/A"}</p>
                    <p className="text-[11px] opacity-80 mt-2">Drag para mover</p>
                  </div>

                  <button
                    type="button"
                    title="Arrastra para crear transicion"
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      const point = getCanvasPoint(event.clientX, event.clientY);
                      setConnecting({
                        fromStateKey: state.stateKey,
                        x: point.x,
                        y: point.y,
                      });
                    }}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-cyan-500 border-2 border-white shadow text-white text-xs font-black"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <p className="font-bold text-slate-700 mb-1">Nodo seleccionado</p>
              {!selectedState ? (
                <p className="text-slate-400">Haz click en un nodo para ver detalles.</p>
              ) : (
                <>
                  <p className="text-slate-700">{selectedState.name} ({selectedState.stateKey})</p>
                  <button
                    type="button"
                    className="mt-2 px-3 py-1.5 rounded bg-cyan-600 text-white font-bold"
                    onClick={() => setNewTransition((prev) => ({ ...prev, fromStateKey: selectedState.stateKey }))}
                  >
                    Usar como FROM en formulario
                  </button>
                </>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <p className="font-bold text-slate-700 mb-1">Arista seleccionada</p>
              {!selectedTransition ? (
                <p className="text-slate-400">Haz click en una linea para ver acciones.</p>
              ) : (
                <>
                  <p className="text-slate-700">{selectedTransition.eventKey}: {selectedTransition.fromStateKey} -&gt; {selectedTransition.toStateKey}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-indigo-600 text-white font-bold"
                      onClick={duplicateTransitionToForm}
                    >
                      Clonar a formulario
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-slate-200 text-slate-500 font-bold"
                      onClick={() => alert("Editar/eliminar transiciones requiere endpoint PUT/DELETE en backend")}
                    >
                      Editar/Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 overflow-y-auto space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Nueva definicion</h3>
            <form className="space-y-2" onSubmit={handleCreateDefinition}>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Key" value={newDefinition.key} onChange={(e) => setNewDefinition((prev) => ({ ...prev, key: e.target.value }))} required />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={newDefinition.name} onChange={(e) => setNewDefinition((prev) => ({ ...prev, name: e.target.value }))} required />
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newDefinition.processType} onChange={(e) => setNewDefinition((prev) => ({ ...prev, processType: e.target.value }))}>
                {PROCESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input type="number" min="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newDefinition.version} onChange={(e) => setNewDefinition((prev) => ({ ...prev, version: e.target.value }))} />
              <button disabled={saving} className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-bold hover:bg-slate-800 disabled:opacity-50">Crear</button>
            </form>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Nuevo estado</h3>
            <form className="space-y-2" onSubmit={handleAddState}>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="stateKey" value={newState.stateKey} onChange={(e) => setNewState((prev) => ({ ...prev, stateKey: e.target.value }))} required />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={newState.name} onChange={(e) => setNewState((prev) => ({ ...prev, name: e.target.value }))} required />
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newState.stateType} onChange={(e) => setNewState((prev) => ({ ...prev, stateType: e.target.value }))}>
                {STATE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="externalStatus (opcional)" value={newState.externalStatus} onChange={(e) => setNewState((prev) => ({ ...prev, externalStatus: e.target.value }))} />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="uiColor (opcional)" value={newState.uiColor} onChange={(e) => setNewState((prev) => ({ ...prev, uiColor: e.target.value }))} />
              <button disabled={saving || !selectedDefinitionId} className="w-full rounded-lg bg-cyan-600 text-white py-2 text-sm font-bold hover:bg-cyan-700 disabled:opacity-50">Agregar estado</button>
            </form>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Nueva transicion</h3>
            <form className="space-y-2" onSubmit={handleAddTransition}>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newTransition.fromStateKey} onChange={(e) => setNewTransition((prev) => ({ ...prev, fromStateKey: e.target.value }))} required>
                <option value="">Desde estado</option>
                {states.map((state) => <option key={`from-${state.stateKey}`} value={state.stateKey}>{state.name} ({state.stateKey})</option>)}
              </select>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newTransition.toStateKey} onChange={(e) => setNewTransition((prev) => ({ ...prev, toStateKey: e.target.value }))} required>
                <option value="">Hacia estado</option>
                {states.map((state) => <option key={`to-${state.stateKey}`} value={state.stateKey}>{state.name} ({state.stateKey})</option>)}
              </select>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="eventKey" value={newTransition.eventKey} onChange={(e) => setNewTransition((prev) => ({ ...prev, eventKey: e.target.value }))} required />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={newTransition.name} onChange={(e) => setNewTransition((prev) => ({ ...prev, name: e.target.value }))} required />
              <input type="number" min="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Prioridad" value={newTransition.priority} onChange={(e) => setNewTransition((prev) => ({ ...prev, priority: e.target.value }))} />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="conditionExpression (opcional)" value={newTransition.conditionExpression} onChange={(e) => setNewTransition((prev) => ({ ...prev, conditionExpression: e.target.value }))} />
              <button disabled={saving || !selectedDefinitionId} className="w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">Agregar transicion</button>
            </form>
          </div>
        </aside>
      </div>

      {quickTransitionOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-black text-slate-800 mb-1">Nueva transicion desde lienzo</h3>
            <p className="text-sm text-slate-500 mb-4">
              {quickTransition.fromStateKey} -&gt; {quickTransition.toStateKey}
            </p>
            <form className="space-y-2" onSubmit={handleQuickTransitionSubmit}>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="eventKey" value={quickTransition.eventKey} onChange={(e) => setQuickTransition((prev) => ({ ...prev, eventKey: e.target.value }))} required />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={quickTransition.name} onChange={(e) => setQuickTransition((prev) => ({ ...prev, name: e.target.value }))} required />
              <input type="number" min="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Prioridad" value={quickTransition.priority} onChange={(e) => setQuickTransition((prev) => ({ ...prev, priority: e.target.value }))} />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="conditionExpression (opcional)" value={quickTransition.conditionExpression} onChange={(e) => setQuickTransition((prev) => ({ ...prev, conditionExpression: e.target.value }))} />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600"
                  onClick={() => setQuickTransitionOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-2 rounded-lg bg-cyan-600 text-white font-bold disabled:opacity-50"
                >
                  Guardar transicion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowDesigner;
