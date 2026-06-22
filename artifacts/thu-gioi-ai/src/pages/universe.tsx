import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postUniverseTick, useGetUniverseSummary } from "@workspace/api-client-react";
import { Globe, Zap, Swords, Shield, Radio, Star, ChevronRight, Activity } from "lucide-react";
import { useState } from "react";

const WORLD_POSITIONS: Record<string, { x: number; y: number }> = {
  "thu-gioi":   { x: 50,  y: 50  },
  "nhan-gioi":  { x: 25,  y: 30  },
  "ma-gioi":    { x: 15,  y: 60  },
  "tien-gioi":  { x: 35,  y: 15  },
  "than-gioi":  { x: 65,  y: 15  },
  "long-gioi":  { x: 75,  y: 40  },
  "linh-gioi":  { x: 55,  y: 75  },
  "minh-gioi":  { x: 30,  y: 75  },
  "thien-gioi": { x: 80,  y: 20  },
};

const PORTAL_CONNECTIONS = [
  ["thu-gioi", "nhan-gioi"],
  ["thu-gioi", "long-gioi"],
  ["nhan-gioi", "ma-gioi"],
  ["nhan-gioi", "tien-gioi"],
  ["ma-gioi", "minh-gioi"],
  ["tien-gioi", "than-gioi"],
  ["tien-gioi", "linh-gioi"],
  ["than-gioi", "thien-gioi"],
  ["long-gioi", "thien-gioi"],
  ["linh-gioi", "minh-gioi"],
];

const SEVERITY_COLORS: Record<string, string> = {
  minor: "text-muted-foreground",
  major: "text-yellow-400",
  catastrophic: "text-orange-400",
  cosmic: "text-purple-400",
};

const SEVERITY_BG: Record<string, string> = {
  minor: "border-white/10",
  major: "border-yellow-400/30",
  catastrophic: "border-orange-400/30",
  cosmic: "border-purple-400/30",
};

function WorldOrb({ world, isSelected, onSelect, portals }: {
  world: { id: number; name: string; displayName: string; colorHex: string; powerLevel: number; totalCreatures: number; status: string };
  isSelected: boolean;
  onSelect: () => void;
  portals: { worldAId: number; worldBId: number; status: string }[];
}) {
  const pos = WORLD_POSITIONS[world.name] ?? { x: 50, y: 50 };
  const hasOpenPortal = portals.some(
    (p) => p.status === "open" && (p.worldAId === world.id || p.worldBId === world.id)
  );

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={onSelect}
      transform={`translate(${pos.x},${pos.y})`}
    >
      <circle r={isSelected ? 5.5 : 4} fill={world.colorHex} opacity={0.2} />
      <circle r={isSelected ? 4 : 3} fill={world.colorHex} opacity={0.6} />
      {hasOpenPortal && (
        <circle r={6} fill="none" stroke={world.colorHex} strokeWidth="0.5" opacity={0.4} strokeDasharray="2,1">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
        </circle>
      )}
      <text
        textAnchor="middle"
        y={-6}
        fontSize="3.5"
        fill={world.colorHex}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {world.displayName}
      </text>
      <text textAnchor="middle" y={7.5} fontSize="2.5" fill="rgba(255,255,255,0.4)" fontFamily="monospace">
        PWR {world.powerLevel.toLocaleString()}
      </text>
    </g>
  );
}

export default function UniversePage() {
  const qc = useQueryClient();
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);

  const { data, isLoading } = useGetUniverseSummary({
    query: { refetchInterval: 15000 },
  });

  const tick = useMutation({
    mutationFn: () => postUniverseTick(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/universe/summary"] }),
  });

  const worlds = data?.worlds ?? [];
  const portals = data?.portals ?? [];
  const events = data?.events ?? [];
  const wars = data?.wars ?? [];
  const summary = data?.summary;

  const selectedWorldData = worlds.find((w) => w.name === selectedWorld);

  const activePortalPairs = new Set(
    portals.filter((p) => p.status === "open").map((p) => `${Math.min(p.worldAId, p.worldBId)}-${Math.max(p.worldAId, p.worldBId)}`)
  );

  const worldById = new Map(worlds.map((w) => [w.id, w]));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono text-purple-400/50 tracking-widest mb-1">V8 · HỖN NGUYÊN VŨ TRỤ CORE</div>
          <h1 className="text-4xl font-bold tracking-widest uppercase hologram-text flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary animate-pulse" />
            HỖN NGUYÊN VŨ TRỤ
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-2">
            Hỗn Nguyên → Thái Cực → Cửu Giới · {worlds.length} thế giới đang vận hành
          </p>
        </div>
        <button
          onClick={() => tick.mutate()}
          disabled={tick.isPending}
          className="hologram-border px-5 py-2.5 text-xs font-mono text-primary hover:bg-primary/10 transition-all flex items-center gap-2"
        >
          <Activity className="w-3.5 h-3.5" />
          {tick.isPending ? "ĐANG CHẠY..." : "VŨ TRỤ TICK"}
        </button>
      </div>

      {/* Universe Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Tổng Giới", value: summary?.totalWorlds ?? 0, color: "#00ffcc", icon: Globe },
          { label: "Tổng Loài", value: (summary?.totalSpecies ?? 0).toLocaleString(), color: "#60a5fa", icon: Star },
          { label: "Vương Quốc", value: (summary?.totalKingdoms ?? 0).toLocaleString(), color: "#fbbf24", icon: Shield },
          { label: "Sinh Vật", value: (summary?.totalCreatures ?? 0).toLocaleString(), color: "#4ade80", icon: Activity },
          { label: "Cổng Mở", value: summary?.openPortals ?? 0, color: "#a78bfa", icon: Radio },
          { label: "Chiến Tranh", value: summary?.activeWars ?? 0, color: "#f43f5e", icon: Swords },
          { label: "Giới Mạnh Nhất", value: summary?.strongestWorldName ?? "—", color: "#fb923c", icon: Zap },
        ].map((stat) => (
          <div key={stat.label} className="hologram-border bg-card/50 p-4 flex flex-col gap-1">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
              {stat.label}
            </div>
            <div className="text-base font-bold font-mono" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main layout: Map + World Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Universe Map */}
        <div className="lg:col-span-3 hologram-border bg-card/30 p-4">
          <div className="text-[10px] font-mono text-primary/50 tracking-widest mb-3 flex items-center gap-2">
            <Globe className="w-3 h-3" /> BẢN ĐỒ VŨ TRỤ · CỬU GIỚI
          </div>
          <div className="relative w-full" style={{ paddingBottom: "65%" }}>
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 65"
              style={{ background: "radial-gradient(ellipse at center, rgba(0,255,204,0.03) 0%, transparent 70%)" }}
            >
              {/* Connection lines */}
              {PORTAL_CONNECTIONS.map(([a, b]) => {
                const posA = WORLD_POSITIONS[a];
                const posB = WORLD_POSITIONS[b];
                if (!posA || !posB) return null;
                const worldA = worlds.find((w) => w.name === a);
                const worldB = worlds.find((w) => w.name === b);
                if (!worldA || !worldB) return null;
                const pairKey = `${Math.min(worldA.id, worldB.id)}-${Math.max(worldA.id, worldB.id)}`;
                const isActive = activePortalPairs.has(pairKey);
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={posA.x} y1={posA.y}
                    x2={posB.x} y2={posB.y}
                    stroke={isActive ? "#a78bfa" : "rgba(255,255,255,0.08)"}
                    strokeWidth={isActive ? 0.5 : 0.3}
                    strokeDasharray={isActive ? "2,1" : "1,2"}
                  />
                );
              })}
              {/* World orbs */}
              {worlds.map((world) => (
                <WorldOrb
                  key={world.id}
                  world={world}
                  isSelected={selectedWorld === world.name}
                  onSelect={() => setSelectedWorld(selectedWorld === world.name ? null : world.name)}
                  portals={portals}
                />
              ))}
            </svg>
          </div>
          <div className="mt-2 flex gap-4 text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 border-t border-purple-400/60 border-dashed" /> Cổng mở</span>
            <span className="flex items-center gap-1"><span className="w-3 border-t border-white/15 border-dashed" /> Liền kề</span>
            <span className="text-purple-400/60">● Nhấn vào giới để xem chi tiết</span>
          </div>
        </div>

        {/* World List / Detail */}
        <div className="lg:col-span-2 space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="text-muted-foreground text-sm font-mono p-4">Đang tải dữ liệu vũ trụ...</div>
          ) : (
            worlds.map((world) => {
              const isSelected = selectedWorld === world.name;
              const hasPortal = portals.some((p) => p.status === "open" && (p.worldAId === world.id || p.worldBId === world.id));
              return (
                <div
                  key={world.id}
                  className={`border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-card/80 border-opacity-80"
                      : "bg-card/20 border-white/10 hover:border-white/20 hover:bg-card/40"
                  }`}
                  style={{ borderColor: isSelected ? world.colorHex + "80" : undefined }}
                  onClick={() => setSelectedWorld(isSelected ? null : world.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: world.colorHex, boxShadow: `0 0 6px ${world.colorHex}` }} />
                      <span className="font-bold text-sm" style={{ color: world.colorHex }}>{world.displayName}</span>
                      {hasPortal && <Radio className="w-3 h-3 text-purple-400 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <span>PWR {world.powerLevel.toLocaleString()}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-white/10">
                      <p className="text-xs text-foreground/60 leading-relaxed">{world.description}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { label: "Sinh Vật", value: world.totalCreatures.toLocaleString() },
                          { label: "Vương Quốc", value: world.totalKingdoms },
                          { label: "Loài", value: world.totalSpecies },
                          { label: "Linh Lực", value: world.spiritualEnergy },
                          { label: "Ngày TG", value: world.worldDay },
                          { label: "Nguy Hiểm", value: `Cấp ${world.dangerLevel}` },
                        ].map((item) => (
                          <div key={item.label} className="bg-black/20 p-1.5">
                            <div className="text-[9px] font-mono text-muted-foreground">{item.label}</div>
                            <div className="text-xs font-bold font-mono" style={{ color: world.colorHex }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom: Events + Wars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Universe Events */}
        <div className="hologram-border bg-card/30 p-5">
          <div className="text-[10px] font-mono text-primary/50 tracking-widest mb-4 flex items-center gap-2">
            <Radio className="w-3 h-3" /> SỰ KIỆN VŨ TRỤ
          </div>
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8 font-mono">
              Chưa có sự kiện — nhấn Vũ Trụ Tick để kích hoạt
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
              {events.map((ev) => (
                <div key={ev.id} className={`border p-3 ${SEVERITY_BG[ev.severity] ?? "border-white/10"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${SEVERITY_COLORS[ev.severity] ?? "text-foreground"}`}>{ev.title}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">Ngày {ev.universeDay}</span>
                  </div>
                  <p className="text-[11px] text-foreground/60 leading-relaxed">{ev.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interworld Wars */}
        <div className="hologram-border bg-card/30 p-5">
          <div className="text-[10px] font-mono text-red-400/50 tracking-widest mb-4 flex items-center gap-2">
            <Swords className="w-3 h-3 text-red-400" /> CHIẾN TRANH LIÊN GIỚI
          </div>
          {wars.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8 font-mono">
              Chưa có chiến tranh liên giới — vũ trụ đang trong thời bình
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
              {wars.map((war) => {
                const attacker = worldById.get(war.attackerWorldId);
                const defender = worldById.get(war.defenderWorldId);
                return (
                  <div key={war.id} className="border border-red-500/20 bg-red-950/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs" style={{ color: attacker?.colorHex ?? "#fff" }}>
                        {attacker?.displayName ?? "Giới không rõ"}
                      </span>
                      <Swords className="w-3 h-3 text-red-400" />
                      <span className="font-bold text-xs" style={{ color: defender?.colorHex ?? "#fff" }}>
                        {defender?.displayName ?? "Giới không rõ"}
                      </span>
                      <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 border ${
                        war.status === "ongoing" ? "border-red-400/40 text-red-400" : "border-green-400/40 text-green-400"
                      }`}>
                        {war.status === "ongoing" ? "ĐANG DIỄN RA" : "KẾT THÚC"}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/60">{war.description}</p>
                    <div className="text-[9px] font-mono text-muted-foreground mt-1">
                      {war.attackerKingdom} vs {war.defenderKingdom} · Ngày {war.startDay}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
