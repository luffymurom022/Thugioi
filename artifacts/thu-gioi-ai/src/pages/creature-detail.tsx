import { useGetCreature, getGetCreatureQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Dna, Activity, Hash, Skull, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreatureDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: creature, isLoading } = useGetCreature(Number(id), { 
    query: { enabled: !!id, queryKey: getGetCreatureQueryKey(Number(id)) } 
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-[500px] w-full bg-primary/10 hologram-border" /></div>;
  if (!creature) return <div className="text-center font-mono py-20 text-destructive">RECORD CORRUPTED // NOT FOUND</div>;

  const isExtinct = creature.status === 'extinct';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Link href="/beastdex">
        <a className="inline-flex items-center gap-2 text-primary/70 hover:text-primary font-mono text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> RETURN TO INDEX
        </a>
      </Link>

      <div className={`hologram-border bg-card/60 relative overflow-hidden backdrop-blur-md ${isExtinct ? 'border-destructive/40' : ''}`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        
        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center border-b border-primary/20 pb-8 mb-8">
            {/* Hologram Avatar Placeholder */}
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-primary/30 flex items-center justify-center bg-black/50 shadow-[0_0_30px_rgba(var(--primary),0.2)] relative">
              <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping opacity-20" />
              <Dna className={`w-16 h-16 ${isExtinct ? 'text-destructive grayscale' : 'text-primary animate-pulse-glow'}`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-primary/20 border border-primary/40 text-primary font-mono text-xs">
                  NO. {creature.id.toString().padStart(4, '0')}
                </span>
                {isExtinct ? (
                  <span className="px-2 py-1 bg-destructive/20 border border-destructive/40 text-destructive font-mono text-xs flex items-center gap-1">
                    <Skull className="w-3 h-3" /> EXTINCT
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 text-green-400 font-mono text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ALIVE
                  </span>
                )}
                {creature.isHybrid && (
                  <span className="px-2 py-1 bg-secondary/20 border border-secondary/40 text-secondary font-mono text-xs">
                    HYBRID
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-wider mb-2">{creature.name}</h1>
              <p className="text-lg text-muted-foreground">{creature.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
            <div className="space-y-4">
              <h3 className="text-primary tracking-widest border-b border-primary/20 pb-2 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> BIOMETRICS
              </h3>
              <InfoRow label="Element" value={creature.element} />
              <InfoRow label="Rank" value={`${creature.rank} LV.${creature.rankLevel}`} />
              <InfoRow label="Lifespan" value={`${creature.lifespan} DAYS`} />
              <InfoRow label="Reproduction Rate" value={`${creature.reproductionRate * 100}%`} />
            </div>

            <div className="space-y-4">
              <h3 className="text-primary tracking-widest border-b border-primary/20 pb-2 mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4" /> ECOLOGY & LINEAGE
              </h3>
              <InfoRow label="Habitat" value={creature.habitat} />
              <InfoRow label="Population" value={creature.population.toString()} valueColor={creature.population === 0 ? 'text-destructive' : 'text-green-400'} />
              
              {creature.isHybrid && (
                <div className="mt-6 p-4 border border-secondary/30 bg-secondary/5 rounded-sm">
                  <div className="text-xs text-secondary/70 mb-2">GENETIC ANCESTORS</div>
                  <div className="flex flex-col gap-2">
                    <div className="text-foreground">{creature.parentA || 'UNKNOWN'}</div>
                    <div className="text-foreground">{creature.parentB || 'UNKNOWN'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueColor = "text-foreground" }: { label: string, value: string, valueColor?: string }) {
  return (
    <div className="flex justify-between items-center bg-black/20 p-2 border border-white/5 hover:border-primary/20 transition-colors">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}
