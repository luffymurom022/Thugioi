import { useState } from "react";
import { useListCreatures, useBreedCreatures } from "@workspace/api-client-react";
import { Dna, ArrowDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function BreedingPage() {
  const { data: creaturesRaw, isLoading } = useListCreatures();
  const breedMutation = useBreedCreatures();
  const { toast } = useToast();

  const [parentA, setParentA] = useState<string>("");
  const [parentB, setParentB] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  const handleBreed = () => {
    if (!parentA || !parentB) return;
    
    breedMutation.mutate({
      data: { creatureAId: Number(parentA), creatureBId: Number(parentB) }
    }, {
      onSuccess: (data) => {
        setResult(data);
        toast({
          title: "BREEDING SUCCESS",
          description: data.message,
          className: "bg-green-500/20 border-green-500/50 text-green-400 font-mono",
        });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "GENETIC INCOMPATIBILITY",
          description: err.message || "Failed to breed species.",
          className: "font-mono"
        });
      }
    });
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-[400px] bg-primary/10 hologram-border" /></div>;

  const allCreatures = Array.isArray(creaturesRaw) ? creaturesRaw : [];
  const livingCreatures = allCreatures.filter(c => c.status === 'alive');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center border-b border-primary/20 pb-8">
        <Dna className="w-12 h-12 text-secondary mx-auto mb-4 animate-pulse-glow" />
        <h1 className="text-4xl font-bold tracking-widest text-foreground uppercase hologram-text mb-2">Phòng Thí Nghiệm Lai Tạo</h1>
        <p className="text-primary/70 font-mono">GENETIC FUSION CHAMBER</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center bg-card/40 p-8 hologram-border">
        {/* Parent A */}
        <div className="space-y-4">
          <label className="text-sm font-mono text-primary/80 tracking-widest block text-center">SUBJECT ALPHA</label>
          <Select value={parentA} onValueChange={setParentA}>
            <SelectTrigger className="bg-black/50 border-primary/30 text-foreground font-mono h-14" data-testid="select-parent-a">
              <SelectValue placeholder="Select species..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/30 font-mono">
              {livingCreatures.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.element})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {parentA && (
            <div className="h-32 border border-primary/20 bg-black/30 flex items-center justify-center text-primary/50 text-sm font-mono">
              [DNA SEQUENCE SCANNED]
            </div>
          )}
        </div>

        {/* Fusion Core */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-[1px] h-12 bg-primary/30 hidden md:block" />
          <Button 
            onClick={handleBreed}
            disabled={!parentA || !parentB || breedMutation.isPending}
            className="w-24 h-24 rounded-full bg-secondary/20 hover:bg-secondary/40 border-2 border-secondary/50 text-secondary-foreground shadow-[0_0_30px_rgba(var(--secondary),0.3)] transition-all flex flex-col items-center justify-center gap-2"
            data-testid="button-breed"
          >
            <Dna className={`w-6 h-6 ${breedMutation.isPending ? 'animate-spin' : ''}`} />
            <span className="font-mono text-xs font-bold tracking-widest">FUSE</span>
          </Button>
          <div className="w-[1px] h-12 bg-primary/30 hidden md:block" />
          <ArrowDown className="w-6 h-6 text-primary/50 md:hidden" />
        </div>

        {/* Parent B */}
        <div className="space-y-4">
          <label className="text-sm font-mono text-primary/80 tracking-widest block text-center">SUBJECT BETA</label>
          <Select value={parentB} onValueChange={setParentB}>
            <SelectTrigger className="bg-black/50 border-primary/30 text-foreground font-mono h-14" data-testid="select-parent-b">
              <SelectValue placeholder="Select species..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary/30 font-mono">
              {livingCreatures.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.element})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {parentB && (
            <div className="h-32 border border-primary/20 bg-black/30 flex items-center justify-center text-primary/50 text-sm font-mono">
              [DNA SEQUENCE SCANNED]
            </div>
          )}
        </div>
      </div>

      {/* Result Area */}
      {result && (
        <div className="hologram-border bg-green-900/10 p-8 border-green-500/30 animate-in zoom-in-95 duration-500 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-2 font-mono">{result.message}</h2>
          <div className="text-xl text-foreground mt-6 font-bold tracking-wider">{result.newCreature.name}</div>
          <div className="text-sm text-green-400/80 font-mono mt-2">
            ELEMENT: {result.newCreature.element} // RANK: {result.newCreature.rank} LV.{result.newCreature.rankLevel}
          </div>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">{result.newCreature.description}</p>
        </div>
      )}
      
      {!result && !breedMutation.isPending && (
        <div className="text-center font-mono text-muted-foreground flex items-center justify-center gap-2 opacity-50">
          <AlertCircle className="w-4 h-4" /> AWAITING GENETIC INPUT
        </div>
      )}
    </div>
  );
}
