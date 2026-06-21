import { useListZones } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Database, Users, ShieldAlert } from "lucide-react";

export default function MapPage() {
  const { data: zones, isLoading } = useListZones();

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
        <p className="text-primary/70 font-mono mt-2">KHU VỰC SINH THÁI TỰ TRỊ</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {zones.map((zone) => {
          const occupancy = (zone.currentPopulation / zone.capacity) * 100;
          return (
            <div key={zone.id} className="hologram-border bg-card/40 relative overflow-hidden flex flex-col">
              <div className={`absolute top-0 left-0 w-full h-1 ${occupancy > 90 ? 'bg-destructive' : 'bg-primary'}`} />
              
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-2">{zone.name}</h2>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3 min-h-[60px]">{zone.description}</p>
                
                <div className="space-y-4 font-mono text-sm mt-auto">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-primary/80"><Thermometer className="w-4 h-4" /> Temp</span>
                    <span className="text-foreground">{zone.temperature}°C</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-primary/80"><Database className="w-4 h-4" /> Resources</span>
                    <span className="text-foreground">{zone.resources}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-primary/80"><Users className="w-4 h-4" /> Population</span>
                    <span className="text-foreground">{zone.currentPopulation}</span>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Capacity
                      </span>
                      <span className={occupancy > 90 ? 'text-destructive' : 'text-primary'}>
                        {Math.round(occupancy)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-black/50 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${occupancy > 90 ? 'bg-destructive shadow-[0_0_10px_rgba(var(--destructive),0.8)]' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]'}`}
                        style={{ width: `${Math.min(100, occupancy)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-black/40 border-t border-primary/10 text-center text-xs font-mono text-primary/50 tracking-widest">
                ZONE_ID // {zone.id.toString().padStart(4, '0')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
