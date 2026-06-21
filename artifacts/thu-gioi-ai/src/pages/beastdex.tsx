import { useState } from "react";
import { useListCreatures } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, Filter, Skull, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function BeastdexPage() {
  const [search, setSearch] = useState("");
  const { data: creatures, isLoading } = useListCreatures();

  const filtered = creatures?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.element.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="border-b border-primary/20 pb-6">
        <h1 className="text-4xl font-bold tracking-widest text-foreground uppercase hologram-text mb-4">Beastdex</h1>
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH ARCHIVES..."
              className="pl-10 bg-black/40 border-primary/30 text-primary font-mono focus-visible:ring-primary/50"
              data-testid="input-search-beasts"
            />
          </div>
          <div className="px-4 py-2 border border-primary/20 bg-black/40 font-mono text-sm text-primary/80 flex items-center gap-2">
            <Filter className="w-4 h-4" /> FILTER ACTIVE
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 bg-primary/10 hologram-border" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(creature => (
            <Link key={creature.id} href={`/beastdex/${creature.id}`}>
              <a className="block group cursor-pointer" data-testid={`card-creature-${creature.id}`}>
                <div className={`hologram-border p-5 relative overflow-hidden transition-all duration-300 group-hover:bg-primary/5 group-hover:border-primary/80 ${creature.status === 'extinct' ? 'bg-destructive/5 border-destructive/30 grayscale' : 'bg-card/40'}`}>
                  
                  {/* Status Indicator */}
                  <div className="absolute top-3 right-3">
                    {creature.status === 'extinct' ? 
                      <Skull className="w-5 h-5 text-destructive animate-pulse" /> : 
                      <Sparkles className="w-5 h-5 text-green-400" />
                    }
                  </div>

                  <div className="text-xs font-mono text-primary/60 mb-1">No. {creature.id.toString().padStart(4, '0')}</div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{creature.name}</h3>
                  
                  <div className="space-y-1.5 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Element</span>
                      <span className="text-foreground">{creature.element}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rank</span>
                      <span className="text-foreground">{creature.rank} LV.{creature.rankLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pop.</span>
                      <span className={creature.population > 0 ? 'text-green-400' : 'text-destructive'}>
                        {creature.population}
                      </span>
                    </div>
                  </div>

                  {creature.isHybrid && (
                    <div className="mt-4 pt-2 border-t border-primary/10 text-[10px] text-secondary font-mono tracking-wider text-center">
                      HYBRID SPECIES
                    </div>
                  )}
                </div>
              </a>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center font-mono text-muted-foreground border border-dashed border-primary/20 bg-black/20">
              NO MATCHING BIOLOGICAL RECORDS FOUND.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
