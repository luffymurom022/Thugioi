import { useEffect } from "react";
import { useGetDashboard, useSimulationTick, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Skull, Globe2, Sparkles, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data, isLoading } = useGetDashboard();
  const tick = useSimulationTick();
  const queryClient = useQueryClient();

  // Auto-simulate world engine
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
          <Skeleton className="h-32 bg-primary/5" />
          <Skeleton className="h-32 bg-primary/5" />
          <Skeleton className="h-32 bg-primary/5" />
          <Skeleton className="h-32 bg-primary/5" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-4xl font-bold tracking-widest text-foreground uppercase">Hệ Thống Phân Tích</h1>
          <p className="text-primary/70 font-mono mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" />
            WORLD DAY: <span className="text-xl font-bold text-primary">{data.worldDay}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-mono">SIMULATION STATUS</div>
          <div className="text-green-400 font-mono tracking-widest flex items-center gap-2 justify-end">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            ACTIVE
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng Sinh Vật" value={data.totalPopulation} icon={Globe2} color="text-primary" />
        <StatCard title="Loài Đang Sống" value={data.livingSpecies} icon={Sparkles} color="text-green-400" />
        <StatCard title="Loài Tuyệt Chủng" value={data.extinctSpecies} icon={Skull} color="text-destructive" />
        <StatCard title="Tổng Số Loài" value={data.totalSpecies} icon={DnaIcon} color="text-secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="hologram-border bg-card/30 p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2 uppercase tracking-widest">
            <MapIcon className="w-5 h-5" />
            Trạng Thái Khu Vực
          </h2>
          <div className="space-y-4 flex-1">
            {data.zoneStats.map((zone) => (
              <div key={zone.zoneId} className="border border-primary/10 bg-black/40 p-4 relative overflow-hidden group hover:border-primary/40 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{zone.zoneName}</span>
                  <span className="text-xs font-mono text-muted-foreground">ID: {zone.zoneId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  <div className="text-muted-foreground">Population: <span className="text-foreground">{zone.population}</span></div>
                  <div className="text-muted-foreground">Species: <span className="text-foreground">{zone.speciesCount}</span></div>
                  <div className="text-muted-foreground col-span-2 mt-2">
                    Capacity: {zone.population} / {zone.capacity}
                    <div className="h-1.5 w-full bg-black mt-1 overflow-hidden">
                      <div 
                        className={`h-full ${zone.population / zone.capacity > 0.8 ? 'bg-destructive' : 'bg-primary'}`} 
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
            Sự Kiện Gần Đây
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {data.recentEvents.map((event) => (
              <div key={event.id} className="border-l-2 border-primary/40 pl-4 py-2 relative">
                <div className="absolute w-2 h-2 rounded-full bg-primary -left-[5px] top-3" />
                <div className="text-xs text-primary/70 font-mono mb-1">DAY {event.worldDay} // {event.eventType}</div>
                <div className="text-sm text-foreground/90">{event.description}</div>
              </div>
            ))}
            {data.recentEvents.length === 0 && (
              <div className="text-center text-muted-foreground font-mono py-8">NO RECENT EVENTS</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="hologram-border bg-card/50 p-6 flex items-start justify-between relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div>
        <div className="text-sm font-mono text-muted-foreground mb-2">{title}</div>
        <div className={`text-4xl font-bold font-mono ${color} hologram-text`}>{value}</div>
      </div>
      <Icon className={`w-8 h-8 ${color} opacity-80`} />
    </div>
  );
}

// Stub icons for missing ones
function DnaIcon(props: any) { return <Activity {...props} />; }
function MapIcon(props: any) { return <Globe2 {...props} />; }
