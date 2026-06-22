import { useListHistory } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

export default function HistoryPage() {
  const { data: historyRaw, isLoading } = useListHistory({ limit: 100 });
  const history = Array.isArray(historyRaw) ? historyRaw : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="border-b border-primary/20 pb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 pt-4">
        <h1 className="text-4xl font-bold tracking-widest text-foreground uppercase hologram-text flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          Biên Niên Sử
        </h1>
        <p className="text-primary/70 font-mono mt-2">SYSTEM EVENT LOG</p>
      </header>

      <div className="relative">
        <div className="absolute left-4 md:left-[100px] top-0 bottom-0 w-px bg-primary/20" />
        
        {isLoading ? (
          <div className="space-y-6">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex gap-6 items-start">
                <Skeleton className="w-16 h-8 bg-primary/10 shrink-0" />
                <Skeleton className="h-24 flex-1 bg-primary/10 hologram-border" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 relative">
            {history.map((entry) => {
              const isExtinction = entry.eventType === 'extinction';
              const isBirth = entry.eventType === 'birth' || entry.eventType === 'new_species';
              
              return (
                <div key={entry.id} className="flex flex-col md:flex-row gap-4 md:gap-8 items-start group">
                  <div className="font-mono text-sm tracking-widest text-primary/60 shrink-0 md:w-20 pt-3 md:text-right flex items-center md:block gap-4">
                    <span className="md:hidden">DAY</span> {entry.worldDay.toString().padStart(4, '0')}
                    <div className={`w-3 h-3 rounded-full md:absolute md:left-[95px] md:mt-1 border-2 border-background z-10 transition-colors ${isExtinction ? 'bg-destructive' : isBirth ? 'bg-green-400' : 'bg-primary group-hover:bg-secondary'}`} />
                  </div>
                  
                  <div className={`flex-1 hologram-border bg-card/40 p-4 md:p-6 transition-colors hover:bg-card/60 ${isExtinction ? 'border-destructive/30' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-mono uppercase px-2 py-1 ${
                        isExtinction ? 'bg-destructive/20 text-destructive' : 
                        isBirth ? 'bg-green-500/20 text-green-400' : 
                        'bg-primary/20 text-primary'
                      }`}>
                        {entry.eventType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-foreground/90">{entry.description}</p>
                  </div>
                </div>
              );
            })}
            
            {history.length === 0 && (
              <div className="ml-12 md:ml-[140px] py-10 font-mono text-muted-foreground border border-dashed border-primary/20 bg-black/20 p-6 text-center">
                ARCHIVE EMPTY. NO EVENTS RECORDED IN CURRENT TIMELINE.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
