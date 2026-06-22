import { useState, useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from "recharts";
import { useListCreatures, usePreviewGenetics, useBreedCreatures } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// ─── Bloodline config ─────────────────────────────────────────
const BLOODLINE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  common:     { label: "Phổ Thông",    color: "#9ca3af", bg: "bg-gray-700/30 border-gray-500/40 text-gray-300" },
  rare:       { label: "Hiếm",         color: "#3b82f6", bg: "bg-blue-700/30 border-blue-500/40 text-blue-300" },
  epic:       { label: "Sử Thi",       color: "#8b5cf6", bg: "bg-violet-700/30 border-violet-500/40 text-violet-300" },
  legendary:  { label: "Huyền Thoại", color: "#f59e0b", bg: "bg-amber-700/30 border-amber-500/40 text-amber-300" },
  mythic:     { label: "Thần Thoại",  color: "#ec4899", bg: "bg-pink-700/30 border-pink-500/40 text-pink-300" },
  ancient:    { label: "Thái Cổ",     color: "#06b6d4", bg: "bg-cyan-700/30 border-cyan-500/40 text-cyan-300" },
  primordial: { label: "Nguyên Thủy", color: "#f97316", bg: "bg-orange-700/30 border-orange-500/40 text-orange-300" },
};

const SIZE_LABELS: Record<string, string> = {
  tiny: "Tí Hon", small: "Nhỏ", medium: "Vừa", large: "Lớn", colossal: "Khổng Lồ",
};

// ─── Helpers ──────────────────────────────────────────────────
function BloodlineBadge({ bloodline }: { bloodline: string }) {
  const cfg = BLOODLINE_CONFIG[bloodline] ?? BLOODLINE_CONFIG.common;
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${cfg.bg}`}
      style={{ textShadow: `0 0 6px ${cfg.color}` }}>
      {cfg.label.toUpperCase()}
    </span>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono mb-0.5">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 4px ${color}88` }} />
      </div>
    </div>
  );
}

type DNAProfile = {
  strength: number; agility: number; intelligence: number;
  vitality: number; sizeClass: string; bloodline: string; mutationChance: number;
};

function DNAPanel({ title, name, element, dna, color }: {
  title: string; name: string; element: string;
  dna: DNAProfile; color: string;
}) {
  const radarData = [
    { stat: "STR", value: dna.strength },
    { stat: "AGI", value: dna.agility },
    { stat: "INT", value: dna.intelligence },
    { stat: "VIT", value: dna.vitality },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 rounded border bg-card/50"
      style={{ borderColor: `${color}40`, boxShadow: `0 0 12px ${color}15` }}>
      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{title}</div>
      <div>
        <div className="text-sm font-bold" style={{ color, textShadow: `0 0 8px ${color}` }}>{name}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-slate-400">{element}</span>
          <BloodlineBadge bloodline={dna.bloodline} />
        </div>
      </div>

      {/* Radar */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="stat" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }} />
            <Radar name="DNA" dataKey="value" stroke={color} fill={color} fillOpacity={0.18} dot={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Stat bars */}
      <div className="space-y-2">
        <StatBar label="Sức Mạnh" value={dna.strength} color={color} />
        <StatBar label="Tốc Độ" value={dna.agility} color={color} />
        <StatBar label="Trí Tuệ" value={dna.intelligence} color={color} />
        <StatBar label="Thể Lực" value={dna.vitality} color={color} />
      </div>

      <div className="flex gap-2 text-[10px] font-mono">
        <span className="text-slate-500">Kích cỡ:</span>
        <span className="text-slate-300">{SIZE_LABELS[dna.sizeClass] ?? dna.sizeClass}</span>
        <span className="text-slate-500 ml-2">Đột biến:</span>
        <span className="text-fuchsia-400">{(dna.mutationChance * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function GeneticsLabPage() {
  const queryClient = useQueryClient();
  const { data: allCreaturesRaw, isLoading } = useListCreatures({
    status: "alive", zone: undefined, element: undefined,
  });
  const allCreatures = Array.isArray(allCreaturesRaw) ? allCreaturesRaw : [];

  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [selectedB, setSelectedB] = useState<number | null>(null);
  const [breedResult, setBreedResult] = useState<string | null>(null);
  const [breeding, setBreeding] = useState(false);

  const aliveCreatures = useMemo(
    () => allCreatures.filter(c => c.status === "alive"),
    [allCreatures]
  );

  const canPreview = selectedA !== null && selectedB !== null && selectedA !== selectedB;

  const { data: preview, isFetching: previewing } = usePreviewGenetics(
    { creatureAId: selectedA ?? 0, creatureBId: selectedB ?? 0 },
    { enabled: canPreview, refetchOnWindowFocus: false }
  );

  const breedMutation = useBreedCreatures({
    mutation: {
      onSuccess: (data) => {
        setBreedResult(data.message ?? null);
        queryClient.invalidateQueries();
      },
    },
  });

  const creatureA = aliveCreatures.find(c => c.id === selectedA);
  const creatureB = aliveCreatures.find(c => c.id === selectedB);

  function handleBreed() {
    if (!selectedA || !selectedB) return;
    setBreeding(true);
    setBreedResult(null);
    breedMutation.mutate(
      { creatureAId: selectedA, creatureBId: selectedB },
      { onSettled: () => setBreeding(false) }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-widest uppercase hologram-text">
          PHÒNG THÍ NGHIỆM GENETICS
        </h1>
        <p className="text-muted-foreground text-sm font-mono mt-1">
          GENETICS ENGINE V4 // DNA FUSION · DI TRUYỀN · ĐỘT BIẾN GEN
        </p>
      </div>

      {/* Selector row */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "SINH VẬT CHA (A)", selected: selectedA, setSelected: setSelectedA, exclude: selectedB },
          { label: "SINH VẬT MẸ (B)", selected: selectedB, setSelected: setSelectedB, exclude: selectedA },
        ].map(({ label, selected, setSelected, exclude }) => (
          <div key={label} className="space-y-1">
            <div className="text-[10px] font-mono text-slate-500 tracking-widest">{label}</div>
            <select
              value={selected ?? ""}
              onChange={e => setSelected(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-card/80 border border-primary/20 text-foreground text-sm font-mono rounded px-3 py-2 focus:border-primary/60 focus:outline-none"
            >
              <option value="">-- Chọn loài --</option>
              {aliveCreatures.filter(c => c.id !== exclude).map(c => (
                <option key={c.id} value={c.id}>
                  [{c.rank}] {c.name} — {c.element} (Pop: {c.population})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* DNA Comparison */}
      {creatureA && creatureB && (
        <div className="grid grid-cols-3 gap-4 items-start">
          <DNAPanel
            title="DNA · CHA"
            name={creatureA.name}
            element={creatureA.element}
            color="#06b6d4"
            dna={{
              strength: creatureA.strength ?? 50,
              agility: creatureA.agility ?? 50,
              intelligence: creatureA.intelligence ?? 50,
              vitality: creatureA.vitality ?? 50,
              sizeClass: creatureA.sizeClass ?? "medium",
              bloodline: creatureA.bloodline ?? "common",
              mutationChance: creatureA.mutationChance ?? 0.01,
            }}
          />

          {/* Center arrow + fusion preview */}
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <div className="text-2xl text-primary/40 font-mono">+</div>

            {previewing && (
              <div className="text-[11px] font-mono text-primary animate-pulse">TÍNH TOÁN DNA...</div>
            )}

            {preview && !previewing && (
              <div className="w-full space-y-3">
                <div className="p-3 rounded border border-primary/30 bg-card/60 space-y-2 text-center">
                  <div className="text-[10px] font-mono text-slate-500">KẾT QUẢ DỰ KIẾN</div>
                  <div className="text-sm font-bold text-primary" style={{ textShadow: "0 0 8px cyan" }}>
                    {preview.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">{preview.element}</div>
                  <BloodlineBadge bloodline={preview.bloodline} />
                  <div className="text-[10px] font-mono text-slate-400">Rank {preview.rankLevel} · {preview.rank}</div>

                  {preview.isMutant && (
                    <div className="mt-1 text-[10px] px-2 py-1 rounded border border-fuchsia-500/40 bg-fuchsia-900/30 text-fuchsia-300 font-bold animate-pulse">
                      ⚡ ĐỘT BIẾN GEN PHÁT HIỆN!
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 font-mono mt-1 text-left leading-relaxed">
                    {preview.mutationSummary}
                  </div>
                </div>

                {/* Child DNA bars */}
                <div className="p-3 rounded border border-slate-700/50 bg-card/40 space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 mb-1">DNA CON</div>
                  {preview.childDna && (
                    <>
                      <StatBar label="Sức Mạnh" value={preview.childDna.strength} color="#22c55e" />
                      <StatBar label="Tốc Độ" value={preview.childDna.agility} color="#22c55e" />
                      <StatBar label="Trí Tuệ" value={preview.childDna.intelligence} color="#22c55e" />
                      <StatBar label="Thể Lực" value={preview.childDna.vitality} color="#22c55e" />
                    </>
                  )}
                </div>

                <button
                  onClick={handleBreed}
                  disabled={breeding || breedMutation.isPending}
                  className="w-full py-2.5 rounded border border-primary text-primary font-bold text-sm font-mono tracking-widest hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: "0 0 10px rgba(6,182,212,0.3)" }}
                >
                  {breeding ? "ĐANG LAI TẠO..." : "⚗ LAI TẠO NGAY"}
                </button>
              </div>
            )}

            {!preview && !previewing && canPreview && (
              <div className="text-[10px] font-mono text-slate-600 text-center">Đang phân tích DNA...</div>
            )}
            {!canPreview && (
              <div className="text-[10px] font-mono text-slate-600 text-center">Chọn 2 loài để bắt đầu</div>
            )}
          </div>

          <DNAPanel
            title="DNA · MẸ"
            name={creatureB.name}
            element={creatureB.element}
            color="#a855f7"
            dna={{
              strength: creatureB.strength ?? 50,
              agility: creatureB.agility ?? 50,
              intelligence: creatureB.intelligence ?? 50,
              vitality: creatureB.vitality ?? 50,
              sizeClass: creatureB.sizeClass ?? "medium",
              bloodline: creatureB.bloodline ?? "common",
              mutationChance: creatureB.mutationChance ?? 0.01,
            }}
          />
        </div>
      )}

      {/* Breed result notification */}
      {breedResult && (
        <div className="p-4 rounded border border-primary/50 bg-primary/5 text-sm font-mono text-primary animate-pulse">
          ✅ {breedResult}
        </div>
      )}

      {/* All species DNA table */}
      <div>
        <h2 className="text-lg font-bold text-primary tracking-wider uppercase mb-3 hologram-text">
          BẢN ĐỒ GENE — TẤT CẢ LOÀI
        </h2>
        <div className="overflow-x-auto rounded border border-primary/20">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-primary/20 bg-primary/5">
                {["Loài", "Hệ", "Huyết Mạch", "STR", "AGI", "INT", "VIT", "Kích Cỡ", "Đột Biến", "Cha", "Mẹ"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] text-primary/70 tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aliveCreatures.map((c, i) => {
                const bl = BLOODLINE_CONFIG[c.bloodline ?? "common"] ?? BLOODLINE_CONFIG.common;
                return (
                  <tr key={c.id} className={`border-b border-slate-800/60 hover:bg-primary/5 transition-colors ${i % 2 === 0 ? "bg-card/20" : ""}`}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {c.isMutant && <span className="text-fuchsia-400 text-[9px]">★</span>}
                        <span className="text-white font-bold">{c.name}</span>
                      </div>
                      <div className="text-[9px] text-slate-500">{c.rank} Lv.{c.rankLevel}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{c.element}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${bl.bg}`}
                        style={{ textShadow: `0 0 4px ${bl.color}` }}>
                        {bl.label}
                      </span>
                    </td>
                    <td className="px-3 py-2" style={{ color: "#ef4444" }}>{c.strength ?? "—"}</td>
                    <td className="px-3 py-2" style={{ color: "#22c55e" }}>{c.agility ?? "—"}</td>
                    <td className="px-3 py-2" style={{ color: "#3b82f6" }}>{c.intelligence ?? "—"}</td>
                    <td className="px-3 py-2" style={{ color: "#f59e0b" }}>{c.vitality ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-400">{SIZE_LABELS[c.sizeClass ?? ""] ?? "—"}</td>
                    <td className="px-3 py-2 text-fuchsia-400">{((c.mutationChance ?? 0.01) * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-slate-500">{c.parentA ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-500">{c.parentB ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
