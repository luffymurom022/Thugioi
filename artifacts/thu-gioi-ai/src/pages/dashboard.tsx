import { useEffect } from "react";
import { useGetDashboard, useSimulationTick, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Skull, Globe2, Sparkles, AlertTriangle, Crown, Swords, Star, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_LABEL: Record<string, string> = {
  war_declared:        "chiến tranh",
  war_won:             "chiến thắng",
  kingdom_founded:     "lập quốc",
  kingdom_collapsed:   "sụp đổ",
  hero_born:           "anh hùng",
  hero_fallen:         "hi sinh",
  rebellion:           "nổi loạn",
  territory_expansion: "mở rộng",
  diplomacy:           "ngoại giao",
  migration:           "di cư",
  evolution:           "tiến hóa",
  extinction:          "tuyệt chủng",
  birth:               "ra đời",
  new_species:         "loài mới",
  battle:              "chiến đấu",
  disaster:            "thảm họa",
  conquest:            "chinh phục",
  info:                "ghi chú",
};

const EVENT_ICON: Record<string, string> = {
  war_declared:     "⚔️",
  war_won:          "🏆",
  kingdom_founded:  "🏰",
  kingdom_collapsed:"💀",
  hero_born:        "⭐",
  hero_fallen:      "💔",
  rebellion:        "🔥",
  territory_expansion: "🗺️",
  diplomacy:        "🤝",
  migration:        "🚶",
  evolution:        "🧬",
};

export default function Dashboard() {
  const { data, isLoading } = useGetDashboard();
  const tick = useSimulationTick();
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      tick.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [tick, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-primary/10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 bg-primary/5" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-4xl font-bold tracking-widest text-foreground uppercase">Hệ Thống Phân Tích</h1>
          <p className="text-primary/70 font-mono mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" />
            NĂM THẾ GIỚI: <span className="text-xl font-bold text-primary">{data.worldDay}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-mono">TRẠNG THÁI HỆ THỐNG</div>
          <div className="text-green-400 font-mono tracking-widest flex items-center gap-2 justify-end">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            ĐANG CHẠY
          </div>
        </div>
      </header>

      {/* Creature stats row */}
      <section>
        <div className="text-[10px] font-mono text-primary/50 tracking-widest mb-3 border-b border-primary/10 pb-1">
          SINH VẬT
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Tổng Sinh Vật"    value={data.totalPopulation} icon={Globe2}    color="text-primary" />
          <StatCard title="Loài Đang Sống"   value={data.livingSpecies}   icon={Sparkles}  color="text-green-400" />
          <StatCard title="Loài Tuyệt Chủng" value={data.extinctSpecies}  icon={Skull}     color="text-destructive" />
          <StatCard title="Tổng Số Loài"     value={data.totalSpecies}    icon={DnaIcon}   color="text-secondary" />
        </div>
      </section>

      {/* Kingdom stats row */}
      <section>
        <div className="text-[10px] font-mono text-amber-400/50 tracking-widest mb-3 border-b border-amber-400/10 pb-1">
          VƯƠNG QUỐC
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Quốc Gia Hoạt Động" value={data.totalKingdoms ?? 0}      icon={Crown}   color="text-amber-400" />
          <StatCard title="Anh Hùng Hiện Tại"  value={data.activeHeroesCount ?? 0}  icon={Star}    color="text-yellow-300" />
          <InfoCard title="Mạnh Nhất"          value={data.strongestKingdomName ?? "—"} color="#ef4444" />
          <InfoCard title="Giàu Nhất"          value={data.richestKingdomName ?? "—"}   color="#22c55e" />
        </div>
      </section>

      {/* War stats row */}
      <section>
        <div className="text-[10px] font-mono text-red-400/50 tracking-widest mb-3 border-b border-red-400/10 pb-1">
          CHIẾN TRANH & CHINH PHỤC
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Chiến Tranh Đang Diễn Ra"
            value={data.activeWarsCount ?? 0}
            icon={Swords}
            color={data.activeWarsCount && data.activeWarsCount > 0 ? "text-red-400" : "text-slate-500"}
            pulse={!!data.activeWarsCount && data.activeWarsCount > 0}
          />
          <StatCard
            title="Lãnh Thổ Bị Chiếm"
            value={data.totalTerritoriesConquered ?? 0}
            icon={Shield}
            color="text-orange-400"
          />
          <InfoCard
            title="Hiếu Chiến Nhất"
            value={data.mostAggressiveKingdom ?? "—"}
            color="#f97316"
          />
          <InfoCard
            title="Đế Quốc Lớn Nhất"
            value={data.largestKingdomName ?? "—"}
            color="#a855f7"
          />
        </div>
      </section>

      {/* Zone stats + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="hologram-border bg-card/30 p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2 uppercase tracking-widest">
            <MapIcon className="w-5 h-5" />
            Trạng Thái Khu Vực
          </h2>
          <div className="space-y-4 flex-1">
            {(data.zoneStats ?? []).map((zone) => (
              <div key={zone.zoneId} className="border border-primary/10 bg-black/40 p-4 relative overflow-hidden group hover:border-primary/40 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{zone.zoneName}</span>
                  <span className="text-xs font-mono text-muted-foreground">{zone.speciesCount} loài</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  <div className="text-muted-foreground">Dân số: <span className="text-foreground">{zone.population.toLocaleString()}</span></div>
                  <div className="text-muted-foreground col-span-2 mt-1">
                    Sức chứa: {zone.population.toLocaleString()} / {zone.capacity.toLocaleString()}
                    <div className="h-1.5 w-full bg-black mt-1 overflow-hidden">
                      <div
                        className={`h-full ${zone.population / zone.capacity > 0.8 ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(100, (zone.population / zone.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="hologram-border bg-card/30 p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2 uppercase tracking-widest">
            <AlertTriangle className="w-5 h-5" />
            Biên Niên Sử Thế Giới
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
            {(data.recentEvents ?? []).map((event) => {
              const icon = EVENT_ICON[event.eventType] ?? "📜";
              const isWar = event.eventType.startsWith("war") || event.eventType === "rebellion";
              return (
                <div key={event.id} className={`border-l-2 pl-4 py-2 relative ${isWar ? "border-red-500/60" : "border-primary/40"}`}>
                  <div className="absolute w-2 h-2 rounded-full -left-[5px] top-3" style={{ background: isWar ? "#ef4444" : "" }} />
                  <div className="text-xs font-mono text-primary/70 mb-1 flex items-center gap-1">
                    <span>{icon}</span>
                    <span>NGÀY {event.worldDay}</span>
                    <span className={`px-1 rounded text-[9px] ${isWar ? "bg-red-900/40 text-red-400" : "bg-primary/10"}`}>
                      {EVENT_LABEL[event.eventType] ?? event.eventType}
                    </span>
                  </div>
                  <div className="text-sm text-foreground/90">{event.description}</div>
                </div>
              );
            })}
            {(data.recentEvents ?? []).length === 0 && (
              <div className="text-center text-muted-foreground font-mono py-8">CHƯA CÓ SỰ KIỆN</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon: Icon, color, pulse = false
}: {
  title: string; value: number; icon: React.ElementType; color: string; pulse?: boolean;
}) {
  return (
    <div className="hologram-border bg-card/50 p-5 flex items-start justify-between relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div>
        <div className="text-[11px] font-mono text-muted-foreground mb-2 uppercase tracking-wide">{title}</div>
        <div className={`text-3xl font-bold font-mono ${color} hologram-text ${pulse ? "animate-pulse" : ""}`}>
          {value.toLocaleString()}
        </div>
      </div>
      <Icon className={`w-7 h-7 ${color} opacity-80 shrink-0`} />
    </div>
  );
}

function InfoCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="hologram-border bg-card/50 p-5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-[11px] font-mono text-muted-foreground mb-2 uppercase tracking-wide">{title}</div>
      <div className="text-sm font-bold font-mono truncate" style={{ color, textShadow: `0 0 8px ${color}88` }}>
        {value}
      </div>
    </div>
  );
}

function DnaIcon(props: React.ComponentProps<"svg">) { return <Activity {...props} />; }
function MapIcon(props: React.ComponentProps<"svg">) { return <Globe2 {...props} />; }
