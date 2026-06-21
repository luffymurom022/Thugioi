import { useListZones, useListTerritories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Database, Users, ShieldAlert, Crown, Flame } from "lucide-react";

const CLIMATE_ICONS: Record<string, string> = {
  volcanic: "🌋", frozen: "❄️", forest: "🌲", storm: "⛈️", dark: "🌑", temperate: "🌿",
};
const CLIMATE_COLORS: Record<string, string> = {
  volcanic: "#f97316", frozen: "#06b6d4", forest: "#22c55e",
  storm: "#8b5cf6", dark: "#64748b", temperate: "#10b981",
};

function ResourceMiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-mono text-slate-500 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono w-5 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function MapPage() {
  const { data: zones, isLoading } = useListZones();
  const { data: territories } = useListTerritories();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => <Skeleton key={i} className="h-96 bg-primary/10 hologram-border" />)}
      </div>
    );
  }

  if (!zones) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="border-b border-primary/20 pb-4">
        <h1 className="text-4xl font-bold tracking-widest text-foreground uppercase hologram-text">Bản Đồ Vực Giới</h1>
        <p className="text-primary/70 font-mono mt-2">KHU VỰC SINH THÁI · LÃNH THỔ · QUỐC GIA THÚ</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {zones.map((zone) => {
          const occupancy = (zone.currentPopulation / zone.capacity) * 100;
          const territory = territories?.find(t => t.zoneName === zone.name);
          const climate = territory?.climate ?? "temperate";
          const climateColor = CLIMATE_COLORS[climate] ?? "#10b981";
          const climateIcon = CLIMATE_ICONS[climate] ?? "🌿";
          const isResourceLow = territory && (territory.food < territory.foodMax * 0.25 || territory.water < territory.waterMax * 0.25);

          return (
            <div key={zone.id} className="hologram-border bg-card/40 relative overflow-hidden flex flex-col"
              style={{ borderColor: `${climateColor}30`, boxShadow: `0 0 15px ${climateColor}10` }}>
              <div className={`absolute top-0 left-0 w-full h-1 ${occupancy > 90 ? "bg-destructive" : ""}`}
                style={{ background: occupancy <= 90 ? climateColor : undefined }} />

              <div className="p-6 flex-1 flex flex-col">
                {/* Title */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{climateIcon}</span>
                      <h2 className="text-xl font-bold text-white">{zone.name}</h2>
                    </div>
                    {isResourceLow && (
                      <span className="text-[9px] font-mono text-red-400 border border-red-500/30 rounded px-1 mt-1 inline-block animate-pulse">
                        ⚠ THIẾU TÀI NGUYÊN
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{zone.description}</p>

                {/* Kingdom control */}
                {territory?.controllingKingdom && (
                  <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded border border-amber-500/30 bg-amber-900/10">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span className="text-[11px] font-mono text-amber-400 font-bold">{territory.controllingKingdom}</span>
                  </div>
                )}

                {/* Dominant species */}
                {territory?.dominantSpecies && (
                  <div className="flex items-center gap-1.5 mb-3 text-[11px] font-mono text-slate-400">
                    <Flame className="w-3 h-3" style={{ color: climateColor }} />
                    <span>Ưu thế: <span className="text-cyan-400">{territory.dominantSpecies}</span></span>
                  </div>
                )}

                {/* Resources */}
                {territory && (
                  <div className="space-y-1.5 mb-4 p-2 rounded border border-slate-700/40 bg-slate-900/20">
                    <div className="text-[9px] font-mono text-slate-600 tracking-widest mb-1">TÀI NGUYÊN</div>
                    <ResourceMiniBar label="Thức Ăn" value={territory.food} max={territory.foodMax} color="#22c55e" />
                    <ResourceMiniBar label="Nước" value={territory.water} max={territory.waterMax} color="#3b82f6" />
                    <ResourceMiniBar label="Khoáng" value={territory.mineral} max={territory.mineralMax} color="#f59e0b" />
                    <ResourceMiniBar label="Linh Khí" value={territory.spirit} max={territory.spiritMax} color="#a855f7" />
                  </div>
                )}

                <div className="space-y-3 font-mono text-sm mt-auto">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-primary/80"><Thermometer className="w-4 h-4" /> Nhiệt độ</span>
                    <span className="text-foreground">{zone.temperature}°C</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-primary/80"><Users className="w-4 h-4" /> Dân số</span>
                    <span className="text-foreground">{zone.currentPopulation.toLocaleString()}</span>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Sức chứa
                      </span>
                      <span className={occupancy > 90 ? "text-destructive" : "text-primary"}>
                        {Math.round(occupancy)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-black/50 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${occupancy > 90 ? "bg-destructive shadow-[0_0_10px_rgba(var(--destructive),0.8)]" : ""}`}
                        style={{
                          width: `${Math.min(100, occupancy)}%`,
                          background: occupancy <= 90 ? climateColor : undefined,
                          boxShadow: occupancy <= 90 ? `0 0 8px ${climateColor}66` : undefined,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-black/40 border-t border-primary/10 text-center text-[10px] font-mono text-primary/40 tracking-widest">
                ZONE_ID // {zone.id.toString().padStart(4, "0")} · {climate.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
