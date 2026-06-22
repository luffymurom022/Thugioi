import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type NodeTypes,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useListEvolutionPaths, useListCreatures } from "@workspace/api-client-react";

// ─── Element color map ────────────────────────────────────────
const ELEMENT_COLORS: Record<string, { glow: string; border: string; badge: string }> = {
  Hỏa:          { glow: "rgba(239,68,68,0.35)",    border: "#ef4444", badge: "bg-red-600/30 text-red-300 border-red-500/50" },
  "Lôi Hỏa":   { glow: "rgba(251,146,60,0.35)",   border: "#fb923c", badge: "bg-orange-600/30 text-orange-300 border-orange-500/50" },
  "Thần Hỏa":  { glow: "rgba(253,186,116,0.35)",  border: "#fde68a", badge: "bg-yellow-500/30 text-yellow-200 border-yellow-400/50" },
  Lôi:          { glow: "rgba(250,204,21,0.35)",   border: "#facc15", badge: "bg-yellow-600/30 text-yellow-300 border-yellow-500/50" },
  "Phong Lôi":  { glow: "rgba(250,204,21,0.3)",    border: "#fbbf24", badge: "bg-yellow-700/30 text-yellow-200 border-yellow-400/50" },
  Kim:          { glow: "rgba(212,175,55,0.35)",   border: "#d4af37", badge: "bg-yellow-800/30 text-yellow-200 border-yellow-600/50" },
  "Nham Thạch": { glow: "rgba(180,83,9,0.4)",      border: "#b45309", badge: "bg-amber-900/40 text-amber-200 border-amber-700/50" },
  Quang:        { glow: "rgba(253,224,71,0.4)",    border: "#fde047", badge: "bg-yellow-400/20 text-yellow-100 border-yellow-300/50" },
  Ám:           { glow: "rgba(109,40,217,0.4)",    border: "#7c3aed", badge: "bg-violet-900/40 text-violet-200 border-violet-600/50" },
  "Địa Ám":    { glow: "rgba(88,28,135,0.4)",     border: "#6b21a8", badge: "bg-purple-900/40 text-purple-200 border-purple-600/50" },
  "Hư Vô":     { glow: "rgba(67,20,100,0.5)",     border: "#581c87", badge: "bg-purple-950/50 text-purple-100 border-purple-500/50" },
  Băng:         { glow: "rgba(56,189,248,0.35)",   border: "#38bdf8", badge: "bg-sky-700/30 text-sky-200 border-sky-500/50" },
  "Băng Phong": { glow: "rgba(99,179,237,0.35)",   border: "#63b3ed", badge: "bg-blue-700/30 text-blue-200 border-blue-500/50" },
  Thổ:          { glow: "rgba(120,53,15,0.4)",     border: "#92400e", badge: "bg-stone-700/30 text-stone-200 border-stone-500/50" },
};

function getElementColor(element: string) {
  return ELEMENT_COLORS[element] ?? { glow: "rgba(6,182,212,0.25)", border: "#06b6d4", badge: "bg-cyan-900/30 text-cyan-200 border-cyan-600/50" };
}

// ─── Custom Node ──────────────────────────────────────────────
function SpeciesNode({ data }: { data: {
  name: string;
  rank: string;
  rankLevel: number;
  element: string;
  population: number;
  status: string;
  isMutant: boolean;
  isBase: boolean;
  evolutionStage: number;
} }) {
  const clr = getElementColor(data.element);
  const isAlive = data.status === "alive";
  const isExtinct = data.status === "extinct";

  return (
    <div
      className="relative min-w-[160px] max-w-[200px] rounded border select-none"
      style={{
        background: `linear-gradient(135deg, rgba(8,15,30,0.97) 0%, rgba(15,25,50,0.95) 100%)`,
        borderColor: isExtinct ? "#374151" : clr.border,
        boxShadow: isAlive ? `0 0 16px ${clr.glow}, 0 0 4px ${clr.border}55` : "none",
        opacity: isExtinct ? 0.45 : 1,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: clr.border, width: 8, height: 8, border: "none" }} />

      {/* Header bar */}
      <div className="px-3 py-1.5 border-b" style={{ borderColor: `${clr.border}40`, background: `${clr.border}15` }}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-mono" style={{ color: clr.border }}>
            RANK {data.rankLevel}
          </span>
          {data.isMutant && (
            <span className="text-[9px] px-1 border rounded font-bold text-fuchsia-300 border-fuchsia-500/50 bg-fuchsia-900/40">
              DỊ CHỦNG
            </span>
          )}
          {isExtinct && (
            <span className="text-[9px] px-1 border rounded text-gray-400 border-gray-600/50">
              TUYỆT CHỦNG
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-xs font-bold text-white leading-tight mb-1.5" style={{
          textShadow: isAlive ? `0 0 8px ${clr.border}` : "none"
        }}>
          {data.name}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-medium ${getElementColor(data.element).badge}`}>
            {data.element}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-sm border text-slate-300 border-slate-600/40 bg-slate-800/40">
            {data.rank}
          </span>
        </div>

        {/* Population bar */}
        {isAlive && (
          <div className="space-y-0.5">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>DÂN SỐ</span>
              <span style={{ color: clr.border }}>{data.population.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (data.population / 2000) * 100)}%`,
                  background: clr.border,
                  boxShadow: `0 0 4px ${clr.glow}`,
                }}
              />
            </div>
          </div>
        )}
        {isExtinct && (
          <p className="text-[9px] text-gray-500 font-mono">[ ĐÃ TUYỆT CHỦNG ]</p>
        )}
        {data.status === "unknown" && (
          <p className="text-[9px] text-slate-500 font-mono">[ CHƯA XUẤT HIỆN ]</p>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: clr.border, width: 8, height: 8, border: "none" }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { species: SpeciesNode };

// ─── Page ────────────────────────────────────────────────────
export default function EvolutionTreePage() {
  const { data: pathsRaw, isLoading: pathsLoading } = useListEvolutionPaths();
  const { data: creaturesRaw, isLoading: creaturesLoading } = useListCreatures({ status: undefined, zone: undefined, element: undefined });
  const paths = Array.isArray(pathsRaw) ? pathsRaw : [];
  const creatures = Array.isArray(creaturesRaw) ? creaturesRaw : [];

  const creatureMap = useMemo(() => {
    const m = new Map<string, typeof creatures[0]>();
    for (const c of creatures) m.set(c.name, c);
    return m;
  }, [creatures]);

  // Build evolution chains by traversing paths
  const chains = useMemo(() => {
    if (!paths.length) return [];

    // Find root species: those that appear as fromSpecies but NOT as toSpecies
    const toSpeciesSet = new Set(paths.map(p => p.toSpecies));
    const fromSpeciesSet = new Set(paths.map(p => p.fromSpecies));
    const roots = [...fromSpeciesSet].filter(s => !toSpeciesSet.has(s));

    const chains: { species: string; level: number }[][] = [];

    for (const root of roots) {
      const chain: { species: string; level: number }[] = [];
      let current = root;
      let level = 0;
      while (current) {
        chain.push({ species: current, level });
        const next = paths.find(p => p.fromSpecies === current);
        if (!next) break;
        current = next.toSpecies;
        level++;
      }
      chains.push(chain);
    }

    return chains;
  }, [paths]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const CHAIN_GAP_Y = 280;
    const NODE_GAP_X = 250;

    chains.forEach((chain, chainIdx) => {
      const y = chainIdx * CHAIN_GAP_Y;

      chain.forEach(({ species, level }) => {
        const creature = creatureMap.get(species);
        const path = paths.find(p => p.fromSpecies === species);

        nodes.push({
          id: `species-${species}`,
          type: "species",
          position: { x: level * NODE_GAP_X, y },
          data: {
            name: species,
            rank: creature?.rank ?? path?.toRank ?? "Dã Thú",
            rankLevel: creature?.rankLevel ?? path?.toRankLevel ?? 1,
            element: creature?.element ?? path?.toElement ?? "Hỏa",
            population: creature?.population ?? 0,
            status: creature ? creature.status : "unknown",
            isMutant: creature?.isMutant ?? false,
            isBase: level === 0,
            evolutionStage: creature?.evolutionStage ?? 0,
          },
        });

        // Add the end node if this is the last in chain
        const nextPath = paths.find(p => p.fromSpecies === species);
        if (!nextPath) return;

        const nextSpecies = nextPath.toSpecies;
        const nextCreature = creatureMap.get(nextSpecies);

        // Edge with evolution conditions
        const label = [
          `Dân số ≥ ${nextPath.minPopulation}`,
          `Săn mồi ≥ ${nextPath.minHuntSuccesses}`,
          `Tuổi ≥ ${nextPath.minAgeTicks}`,
        ].join(" · ");

        const currentCreature = creatureMap.get(species);
        const conditionsMet = currentCreature
          ? currentCreature.population >= nextPath.minPopulation &&
            currentCreature.huntSuccesses >= nextPath.minHuntSuccesses &&
            currentCreature.ageTicks >= nextPath.minAgeTicks
          : false;

        const clr = getElementColor(nextPath.toElement);
        edges.push({
          id: `edge-${species}-${nextSpecies}`,
          source: `species-${species}`,
          target: `species-${nextSpecies}`,
          label,
          type: "smoothstep",
          animated: conditionsMet,
          style: {
            stroke: conditionsMet ? clr.border : "#374151",
            strokeWidth: conditionsMet ? 2 : 1,
            strokeDasharray: conditionsMet ? undefined : "4 3",
          },
          labelStyle: { fill: "#94a3b8", fontSize: 9, fontFamily: "monospace" },
          labelBgStyle: { fill: "rgba(8,15,30,0.9)", stroke: "#1e293b" },
          labelBgPadding: [4, 6] as [number, number],
        });

        // Add terminal node for the end of chains
        if (!paths.find(p => p.fromSpecies === nextSpecies)) {
          const terminalCreature = creatureMap.get(nextSpecies);
          const termPath = paths.find(p => p.toSpecies === nextSpecies);
          if (!nodes.find(n => n.id === `species-${nextSpecies}`)) {
            nodes.push({
              id: `species-${nextSpecies}`,
              type: "species",
              position: { x: (level + 1) * NODE_GAP_X, y },
              data: {
                name: nextSpecies,
                rank: terminalCreature?.rank ?? termPath?.toRank ?? "Thần Thú",
                rankLevel: terminalCreature?.rankLevel ?? termPath?.toRankLevel ?? 10,
                element: terminalCreature?.element ?? termPath?.toElement ?? "Hỏa",
                population: terminalCreature?.population ?? 0,
                status: terminalCreature ? terminalCreature.status : "unknown",
                isMutant: terminalCreature?.isMutant ?? false,
                isBase: false,
                evolutionStage: terminalCreature?.evolutionStage ?? 0,
              },
            });
          }
        }
      });
    });

    // Also show standalone mutants that don't appear in paths
    const mutants = creatures.filter(c => c.isMutant);
    mutants.forEach((mutant, idx) => {
      const nodeId = `species-${mutant.name}`;
      if (nodes.find(n => n.id === nodeId)) return;
      nodes.push({
        id: nodeId,
        type: "species",
        position: { x: -280, y: idx * 160 },
        data: {
          name: mutant.name,
          rank: mutant.rank,
          rankLevel: mutant.rankLevel,
          element: mutant.element,
          population: mutant.population,
          status: mutant.status,
          isMutant: true,
          isBase: false,
          evolutionStage: mutant.evolutionStage,
        },
      });
    });

    return { nodes, edges };
  }, [chains, paths, creatureMap, creatures]);

  if (pathsLoading || creaturesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-primary font-mono animate-pulse text-lg tracking-widest">
          ĐANG TẢI CÂY TIẾN HÓA...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-widest uppercase hologram-text">
            CÂY TIẾN HÓA
          </h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">
            EVOLUTION ENGINE // {paths.length} CON ĐƯỜNG · {chains.length} NHÁNH TIẾN HÓA
          </p>
        </div>
        <div className="flex gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-cyan-400" />
            <span className="text-slate-400">Đủ điều kiện</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-slate-600 border-dashed" style={{ borderTop: "1px dashed #4b5563" }} />
            <span className="text-slate-500">Chưa đủ</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Đang sống", color: "text-cyan-400", dot: "bg-cyan-400" },
          { label: "Chưa xuất hiện", color: "text-slate-500", dot: "bg-slate-600" },
          { label: "Tuyệt chủng", color: "text-gray-600", dot: "bg-gray-700" },
          { label: "Dị Chủng", color: "text-fuchsia-400", dot: "bg-fuchsia-500" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-[11px] font-mono">
            <div className={`w-2 h-2 rounded-full ${item.dot}`} />
            <span className={item.color}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 rounded border border-primary/20 overflow-hidden" style={{ minHeight: "500px" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: "rgba(4,10,22,0.98)" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1}
            color="rgba(6,182,212,0.12)"
          />
          <Controls
            style={{ background: "rgba(8,15,30,0.9)", border: "1px solid rgba(6,182,212,0.2)" }}
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              const d = node.data as { element?: string; status?: string };
              if (d.status === "extinct") return "#1f2937";
              if (d.status === "unknown") return "#374151";
              return getElementColor(d.element ?? "").border ?? "#06b6d4";
            }}
            style={{ background: "rgba(4,10,22,0.95)", border: "1px solid rgba(6,182,212,0.2)" }}
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>
      </div>

      {/* Path cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {paths.map(path => {
          const fromC = creatureMap.get(path.fromSpecies);
          const clr = getElementColor(path.toElement);
          const condPop = fromC ? fromC.population >= path.minPopulation : false;
          const condHunt = fromC ? fromC.huntSuccesses >= path.minHuntSuccesses : false;
          const condAge = fromC ? fromC.ageTicks >= path.minAgeTicks : false;
          const allMet = condPop && condHunt && condAge;

          return (
            <div
              key={path.id}
              className="p-3 rounded border bg-card/50"
              style={{ borderColor: allMet ? clr.border : "#1e293b", boxShadow: allMet ? `0 0 8px ${clr.glow}` : "none" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400">
                  {path.fromSpecies} → <span style={{ color: clr.border }}>{path.toSpecies}</span>
                </span>
                {allMet && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-green-300 bg-green-900/40 border border-green-600/40 animate-pulse">
                    SẴN SÀNG
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <ConditionRow label="Dân số" current={fromC?.population ?? 0} required={path.minPopulation} met={condPop} />
                <ConditionRow label="Săn mồi" current={fromC?.huntSuccesses ?? 0} required={path.minHuntSuccesses} met={condHunt} />
                <ConditionRow label="Tuổi" current={fromC?.ageTicks ?? 0} required={path.minAgeTicks} met={condAge} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConditionRow({ label, current, required, met }: {
  label: string; current: number; required: number; met: boolean;
}) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <div>
      <div className="flex justify-between text-[9px] font-mono mb-0.5">
        <span className="text-slate-500">{label}</span>
        <span className={met ? "text-green-400" : "text-slate-400"}>
          {current.toLocaleString()} / {required.toLocaleString()}
        </span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: met ? "#22c55e" : "#3b82f6",
          }}
        />
      </div>
    </div>
  );
}
