import { useEffect, useMemo, useRef, useState } from "react";
import { workflowService } from "../services/workflowService";

const PROCESS_TYPES = ["INCIDENCIA", "REQUERIMIENTO", "CAMBIO", "APROBACION"];
const STATE_TYPES = ["START", "NORMAL", "END"];

const NODE_WIDTH = 180;
const NODE_HEIGHT = 102;
const STORAGE_PREFIX = "workflow-layout";
const EVENT_LABELS = {
  ASSIGN_TECHNICIAN: "Asignar técnico",
  TAKE_OWNERSHIP: "Tomar caso",
  START_WORK: "Iniciar trabajo",
  RESOLVE: "Resolver",
  CLOSE: "Cerrar",
  ESCALATE: "Escalar",
  NEXT: "Siguiente",
};

const STATE_TYPE_LABELS = {
  START: "INICIO",
  NORMAL: "NORMAL",
  END: "FIN",
};

const STATE_KEY_LABELS = {
  NEW: "Nuevo",
  ASSIGNED: "Asignado",
  IN_PROGRESS: "En proceso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

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
const formatStateType = (stateType) => STATE_TYPE_LABELS[stateType] || stateType || "No aplica";
const formatStateKey = (stateKey) => STATE_KEY_LABELS[stateKey] || stateKey || "No aplica";
const formatEventKey = (eventKey) => EVENT_LABELS[eventKey] || eventKey || "No aplica";

function WorkflowDesigner() {
  const [definitions, setDefinitions] = useState([]);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nodePositions, setNodePositions] = useState({});
  const [selectedStateKey, setSelectedStateKey] = useState(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState(null);
  const [editingStateId, setEditingStateId] = useState(null);
  const [editingTransitionId, setEditingTransitionId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [quickTransitionOpen, setQuickTransitionOpen] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [nodeSize, setNodeSize] = useState({ width: 180, height: 102 });

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
    slaPolicyId: "",
  });

  const [newTransition, setNewTransition] = useState({
    fromStateKey: "",
    toStateKey: "",
    eventKey: "",
    name: "",
    priority: 100,
    active: true,
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
  const selectedDefinition = useMemo(
    () => definitions.find((item) => item.id === selectedDefinitionId) || null,
    [definitions, selectedDefinitionId]
  );
  const NODE_WIDTH = nodeSize.width;
  const NODE_HEIGHT = nodeSize.height;

  const selectedState = useMemo(
    () => states.find((state) => state.stateKey === selectedStateKey) || null,
    [states, selectedStateKey]
  );

  const selectedTransition = useMemo(
    () => transitions.find((transition) => transition.id === selectedTransitionId) || null,
    [transitions, selectedTransitionId]
  );

  const resetStateForm = () => {
    setEditingStateId(null);
    setNewState({
      stateKey: "",
      name: "",
      stateType: "NORMAL",
      externalStatus: "",
      uiColor: "",
      slaPolicyId: "",
    });
  };

  const resetTransitionForm = () => {
    setEditingTransitionId(null);
    setNewTransition((prev) => ({
      ...prev,
      eventKey: "",
      name: "",
      conditionExpression: "",
      priority: 100,
      active: true,
    }));
  };

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
      alert(error?.message || "No se pudieron cargar los flujos");
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
      resetStateForm();
      setEditingTransitionId(null);
      setSelectedStateKey(firstState || null);
      setSelectedTransitionId(null);
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo cargar el detalle del flujo");
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
    const updateNodeSize = () => {
      const width = window.innerWidth;
      if (width < 1200) {
        setNodeSize({ width: 152, height: 92 });
      } else if (width < 1500) {
        setNodeSize({ width: 168, height: 98 });
      } else {
        setNodeSize({ width: 180, height: 102 });
      }
    };

    updateNodeSize();
    window.addEventListener("resize", updateNodeSize);
    return () => window.removeEventListener("resize", updateNodeSize);
  }, []);

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

  const saveTransition = async (payload, transitionId = null) => {
    if (!selectedDefinitionId) return;
    const body = {
      ...payload,
      fromStateKey: payload.fromStateKey.trim(),
      toStateKey: payload.toStateKey.trim(),
      eventKey: payload.eventKey.trim(),
      name: payload.name.trim(),
      priority: Number(payload.priority) || 100,
      active: payload.active !== false,
      conditionExpression: payload.conditionExpression?.trim() || null,
    };
    if (transitionId) {
      await workflowService.actualizarTransicion(selectedDefinitionId, transitionId, body);
      return;
    }
    await workflowService.agregarTransicion(selectedDefinitionId, body);
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
      alert("Flujo creado");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo crear el flujo");
    } finally {
      setSaving(false);
    }
  };

  const handleAddState = async (event) => {
    event.preventDefault();
    if (!selectedDefinitionId) return;

    try {
      setSaving(true);
      const payload = {
        ...newState,
        stateKey: newState.stateKey.trim(),
        name: newState.name.trim(),
        externalStatus: newState.externalStatus.trim() || null,
        uiColor: newState.uiColor.trim() || null,
        slaPolicyId: newState.slaPolicyId === "" ? null : Number(newState.slaPolicyId),
      };
      if (editingStateId) {
        await workflowService.actualizarEstado(selectedDefinitionId, editingStateId, payload);
      } else {
        await workflowService.agregarEstado(selectedDefinitionId, payload);
      }
      resetStateForm();
      await loadDetail(selectedDefinitionId);
      alert(editingStateId ? "Estado actualizado" : "Estado agregado");
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
      await saveTransition(newTransition, editingTransitionId);
      resetTransitionForm();
      await loadDetail(selectedDefinitionId);
      alert(editingTransitionId ? "Transición actualizada" : "Transición agregada");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo agregar la transición");
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
      alert("Transición creada desde el lienzo");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo crear la transición");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDefinition = async () => {
    if (!selectedDefinitionId) return;
    try {
      setSaving(true);
      if (selectedDefinition?.active) {
        await workflowService.desactivarDefinicion(selectedDefinitionId);
      } else {
        await workflowService.activarDefinicion(selectedDefinitionId);
      }
      await Promise.all([loadDefinitions(), loadDetail(selectedDefinitionId)]);
      alert(selectedDefinition?.active ? "Flujo desactivado" : "Flujo activado");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo actualizar el estado del flujo");
    } finally {
      setSaving(false);
    }
  };

  const handleTransitionSelect = (line) => {
    setSelectedTransitionId(line.id);
    setSelectedStateKey(null);
  };

  const loadTransitionInForm = () => {
    if (!selectedTransition) return;
    setEditingTransitionId(selectedTransition.id);
    setNewTransition({
      fromStateKey: selectedTransition.fromStateKey || "",
      toStateKey: selectedTransition.toStateKey || "",
      eventKey: selectedTransition.eventKey || "",
      name: selectedTransition.name || "",
      priority: selectedTransition.priority || 100,
      active: selectedTransition.active !== false,
      conditionExpression: selectedTransition.conditionExpression || "",
    });
  };

  const loadStateInForm = () => {
    if (!selectedState) return;
    setEditingStateId(selectedState.id);
    setNewState({
      stateKey: selectedState.stateKey || "",
      name: selectedState.name || "",
      stateType: selectedState.stateType || "NORMAL",
      externalStatus: selectedState.externalStatus || "",
      uiColor: selectedState.uiColor || "",
      slaPolicyId: selectedState.slaPolicyId ?? "",
    });
  };

  const handleDeleteTransition = async () => {
    if (!selectedDefinitionId || !selectedTransition) return;
    if (!confirm(`Eliminar transición ${selectedTransition.eventKey}?`)) return;
    try {
      setSaving(true);
      await workflowService.eliminarTransicion(selectedDefinitionId, selectedTransition.id);
      setSelectedTransitionId(null);
      if (editingTransitionId === selectedTransition.id) {
        resetTransitionForm();
      }
      await loadDetail(selectedDefinitionId);
      alert("Transición eliminada");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo eliminar la transición");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteState = async () => {
    if (!selectedDefinitionId || !selectedState) return;
    if (!confirm(`Eliminar estado ${selectedState.stateKey}?`)) return;
    try {
      setSaving(true);
      await workflowService.eliminarEstado(selectedDefinitionId, selectedState.id);
      setSelectedStateKey(null);
      if (editingStateId === selectedState.id) {
        resetStateForm();
      }
      await loadDetail(selectedDefinitionId);
      alert("Estado eliminado");
    } catch (error) {
      console.error(error);
      alert(error?.message || "No se pudo eliminar el estado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full bg-slate-100 p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_360px] gap-6 h-full">
        <aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 overflow-y-auto">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Flujos</h2>
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
            {!loading && definitions.length === 0 && <p className="text-sm text-slate-400">Sin flujos</p>}
          </div>
        </aside>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-black text-slate-800">Diseñador de Flujos</h1>
              <p className="text-sm text-slate-500">Arrastra nodos y conecta estados desde el puerto derecho</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAyudaAbierta(true)}
                className="h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-600 font-black hover:bg-slate-50"
                title="Ayuda para crear flujos"
              >
                ?
              </button>
              <button
                onClick={handleToggleDefinition}
                disabled={!selectedDefinitionId || saving}
                className={`px-4 py-2 rounded-xl text-white font-bold text-sm disabled:opacity-50 ${
                  selectedDefinition?.active ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {selectedDefinition?.active ? "Desactivar flujo" : "Activar flujo"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-3 text-xs font-semibold text-slate-600 flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded bg-white border border-slate-200">Estado seleccionado: {formatStateKey(selectedStateKey) || "Ninguno"}</span>
            <span className="px-2 py-1 rounded bg-white border border-slate-200">Arista seleccionada: {selectedTransitionId || "Ninguna"}</span>
            <span className="px-2 py-1 rounded bg-white border border-slate-200">Estados: {states.length}</span>
            <span className="px-2 py-1 rounded bg-white border border-slate-200">Transiciones: {transitions.length}</span>
          </div>

          <div
            ref={canvasRef}
            className="relative flex-1 min-h-[430px] rounded-2xl border border-slate-200 bg-[radial-gradient(#dbeafe_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden"
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
                      {formatEventKey(line.eventKey)}
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
                      <p className="text-[10px] uppercase font-bold opacity-80">{formatStateType(state.stateType)}</p>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">{formatStateKey(state.stateKey)}</span>
                    </div>
                    <h3 className="font-black text-base mt-1 leading-tight">{state.name}</h3>
                    <p className="text-xs opacity-90 mt-2">Estado externo: {state.externalStatus || "No aplica"}</p>
                    <p className="text-[11px] opacity-80 mt-2">Arrastra para mover</p>
                  </div>

                  <button
                    type="button"
                    title="Arrastra para crear transición"
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
                  <p className="text-slate-700">{selectedState.name} ({formatStateKey(selectedState.stateKey)})</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-cyan-600 text-white font-bold"
                      onClick={() => setNewTransition((prev) => ({ ...prev, fromStateKey: selectedState.stateKey }))}
                    >
                      Usar como ORIGEN
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-indigo-600 text-white font-bold"
                      onClick={loadStateInForm}
                    >
                      Editar estado
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-rose-600 text-white font-bold"
                      onClick={handleDeleteState}
                    >
                      Eliminar estado
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <p className="font-bold text-slate-700 mb-1">Arista seleccionada</p>
              {!selectedTransition ? (
                <p className="text-slate-400">Haz click en una linea para ver acciones.</p>
              ) : (
                <>
                  <p className="text-slate-700">
                    {formatEventKey(selectedTransition.eventKey)}: {formatStateKey(selectedTransition.fromStateKey)} -&gt; {formatStateKey(selectedTransition.toStateKey)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-indigo-600 text-white font-bold"
                      onClick={loadTransitionInForm}
                    >
                      Editar transición
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-rose-600 text-white font-bold"
                      onClick={handleDeleteTransition}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 overflow-y-auto space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Nueva definición</h3>
            <form className="space-y-2" onSubmit={handleCreateDefinition}>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Clave del flujo" value={newDefinition.key} onChange={(e) => setNewDefinition((prev) => ({ ...prev, key: e.target.value }))} required />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={newDefinition.name} onChange={(e) => setNewDefinition((prev) => ({ ...prev, name: e.target.value }))} required />
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newDefinition.processType} onChange={(e) => setNewDefinition((prev) => ({ ...prev, processType: e.target.value }))}>
                {PROCESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input type="number" min="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newDefinition.version} onChange={(e) => setNewDefinition((prev) => ({ ...prev, version: e.target.value }))} />
              <button disabled={saving} className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-bold hover:bg-slate-800 disabled:opacity-50">Crear</button>
            </form>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">{editingStateId ? "Editar estado" : "Nuevo estado"}</h3>
            <form className="space-y-2" onSubmit={handleAddState}>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Clave de estado" value={newState.stateKey} onChange={(e) => setNewState((prev) => ({ ...prev, stateKey: e.target.value }))} required />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={newState.name} onChange={(e) => setNewState((prev) => ({ ...prev, name: e.target.value }))} required />
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newState.stateType} onChange={(e) => setNewState((prev) => ({ ...prev, stateType: e.target.value }))}>
                {STATE_TYPES.map((type) => <option key={type} value={type}>{formatStateType(type)}</option>)}
              </select>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Estado externo (opcional)" value={newState.externalStatus} onChange={(e) => setNewState((prev) => ({ ...prev, externalStatus: e.target.value }))} />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Color UI (opcional)" value={newState.uiColor} onChange={(e) => setNewState((prev) => ({ ...prev, uiColor: e.target.value }))} />
              <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="ID de política SLA (opcional)" value={newState.slaPolicyId} onChange={(e) => setNewState((prev) => ({ ...prev, slaPolicyId: e.target.value }))} />
              <button disabled={saving || !selectedDefinitionId} className="w-full rounded-lg bg-cyan-600 text-white py-2 text-sm font-bold hover:bg-cyan-700 disabled:opacity-50">{editingStateId ? "Actualizar estado" : "Agregar estado"}</button>
              {editingStateId && (
                <button type="button" onClick={resetStateForm} className="w-full rounded-lg bg-slate-200 text-slate-700 py-2 text-sm font-bold">
                  Cancelar edición
                </button>
              )}
            </form>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">{editingTransitionId ? "Editar transición" : "Nueva transición"}</h3>
            <form className="space-y-2" onSubmit={handleAddTransition}>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newTransition.fromStateKey} onChange={(e) => setNewTransition((prev) => ({ ...prev, fromStateKey: e.target.value }))} required>
                <option value="">Desde estado</option>
                {states.map((state) => <option key={`from-${state.stateKey}`} value={state.stateKey}>{state.name} ({formatStateKey(state.stateKey)})</option>)}
              </select>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newTransition.toStateKey} onChange={(e) => setNewTransition((prev) => ({ ...prev, toStateKey: e.target.value }))} required>
                <option value="">Hacia estado</option>
                {states.map((state) => <option key={`to-${state.stateKey}`} value={state.stateKey}>{state.name} ({formatStateKey(state.stateKey)})</option>)}
              </select>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Clave del evento" value={newTransition.eventKey} onChange={(e) => setNewTransition((prev) => ({ ...prev, eventKey: e.target.value }))} required />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={newTransition.name} onChange={(e) => setNewTransition((prev) => ({ ...prev, name: e.target.value }))} required />
              <input type="number" min="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Prioridad" value={newTransition.priority} onChange={(e) => setNewTransition((prev) => ({ ...prev, priority: e.target.value }))} />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Expresión de condición (opcional)" value={newTransition.conditionExpression} onChange={(e) => setNewTransition((prev) => ({ ...prev, conditionExpression: e.target.value }))} />
              <label className="flex items-center gap-2 text-xs text-slate-600 px-1">
                <input type="checkbox" checked={newTransition.active} onChange={(e) => setNewTransition((prev) => ({ ...prev, active: e.target.checked }))} />
                Activa
              </label>
              <button disabled={saving || !selectedDefinitionId} className="w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">{editingTransitionId ? "Actualizar transición" : "Agregar transición"}</button>
              {editingTransitionId && (
                <button type="button" onClick={resetTransitionForm} className="w-full rounded-lg bg-slate-200 text-slate-700 py-2 text-sm font-bold">
                  Cancelar edición
                </button>
              )}
            </form>
          </div>
        </aside>
      </div>

      {quickTransitionOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-black text-slate-800 mb-1">Nueva transición desde lienzo</h3>
            <p className="text-sm text-slate-500 mb-4">
              {formatStateKey(quickTransition.fromStateKey)} -&gt; {formatStateKey(quickTransition.toStateKey)}
            </p>
            <form className="space-y-2" onSubmit={handleQuickTransitionSubmit}>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Clave del evento" value={quickTransition.eventKey} onChange={(e) => setQuickTransition((prev) => ({ ...prev, eventKey: e.target.value }))} required />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={quickTransition.name} onChange={(e) => setQuickTransition((prev) => ({ ...prev, name: e.target.value }))} required />
              <input type="number" min="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Prioridad" value={quickTransition.priority} onChange={(e) => setQuickTransition((prev) => ({ ...prev, priority: e.target.value }))} />
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Expresión de condición (opcional)" value={quickTransition.conditionExpression} onChange={(e) => setQuickTransition((prev) => ({ ...prev, conditionExpression: e.target.value }))} />
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
                  Guardar transición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ayudaAbierta && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-black text-slate-800">Cómo usar el diseñador de flujos</h3>
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-600" onClick={() => setAyudaAbierta(false)}>x</button>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <p><strong>1.</strong> Crea una <strong>definición</strong> (nombre, clave, tipo de proceso y versión).</p>
              <p><strong>2.</strong> Agrega los <strong>estados</strong> del flujo (ejemplo: Nuevo, En proceso, Resuelto, Cerrado).</p>
              <p><strong>3.</strong> Organiza el diagrama arrastrando los nodos en el lienzo.</p>
              <p><strong>4.</strong> Crea una transición arrastrando desde el botón <strong>+</strong> del nodo origen al nodo destino.</p>
              <p><strong>5.</strong> Haz clic en una línea para editar/eliminar una transición.</p>
              <p><strong>6.</strong> Haz clic en un nodo para editar/eliminar un estado.</p>
              <p><strong>7.</strong> Cuando valides el diagrama, pulsa <strong>Activar flujo</strong> o <strong>Desactivar flujo</strong>.</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-bold" onClick={() => setAyudaAbierta(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowDesigner;
