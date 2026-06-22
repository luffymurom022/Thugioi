import { useState } from "react";
import { useListKingdoms, useListPacks, useListKingdomRelations, useListTerritories, useListWars, useListHeroes } from "@workspace/api-client-react";
import { Crown, Sword, Coins, Globe, Users, Shield, Handshake, Flame, Swords, Star, Zap } from "lucide-react";

// ─── Configs ──────────────────────────────────────────────────
const RELATION_CONFIG = {
  alliance: { label: "Liên Minh", color: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-900/20", icon: "🤝" },
  neutral:  { label: "Trung Lập", color: "text-slate-400",   border: "border-slate-500/40",   bg: "bg-slate-800/20",   icon: "⚖️" },
  hostile:  { label: "Thù Địch",  color: "text-red-400",     border: "border-red-500/40",     bg: "bg-red-900/20",     icon: "⚔️" },
};

const WAR_STATUS_CONFIG: Record<string, { label: string; color: string; border: string; bg: string; icon: string }> = {
  ongoing:      { label: "Đang Chiến",   color: "text-red-400",     border: "border-red-500/60",     bg: "bg-red-900/20",     icon: "⚔️" },
  attacker_won: { label: "Kẻ Tấn Công Thắng", color: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-900/10", icon: "🏆" },
  defender_won: { label: "Kẻ Phòng Thủ Thắng",color: "text-blue-400",  border: "border-blue-500/40",  bg: "bg-blue-900/10",    icon: "🛡️" },
  ceasefire:    { label: "Ngừng Chiến",  color: "text-slate-400",   border: "border-slate-500/40",   bg: "bg-slate-800/10",   icon: "🏳️" },
};

const CLIMATE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  volcanic:  { label: "Nham Thạch", icon: "🌋", color: "text-orange-400" },
  frozen:    { label: "Băng Giá",   icon: "❄️", color: "text-cyan-400"   },
  forest:    { label: "Cổ Mộc",    icon: "🌲", color: "text-green-400"  },
  storm:     { label: "Sấm Sét",   icon: "⛈️", color: "text-violet-400" },
  dark:      { label: "Hắc Ám",    icon: "🌑", color: "text-slate-300"  },
  temperate: { label: "Ôn Hòa",    icon: "🌿", color: "text-teal-400"   },
};

function ResourceBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-[9px] font-mono mb-0.5">
        <span className="text-slate-500">{label}</span>
        <span style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 3px ${color}55` }} />
      </div>
    </div>
  );
}

function PowerBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-slate-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}66` }} />
      </div>
      <span className="text-[9px] font-mono w-8 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Tab types ───────────────────────────────────────────────
type Tab = "kingdoms" | "territories" | "packs" | "diplomacy" | "wars" | "heroes";

export default function KingdomsPage() {
  const [tab, setTab] = useState<Tab>("kingdoms");
  const { data: kingdomsRaw,  isLoading: kingLoading  } = useListKingdoms();
  const { data: territoriesRaw, isLoading: terrLoading  } = useListTerritories();
  const { data: packsRaw,     isLoading: packsLoading } = useListPacks();
  const { data: relationsRaw } = useListKingdomRelations();
  const { data: warsRaw,      isLoading: warsLoading  } = useListWars();
  const { data: heroesRaw,    isLoading: heroesLoading } = useListHeroes();

  const kingdoms   = Array.isArray(kingdomsRaw)   ? kingdomsRaw   : [];
  const territories= Array.isArray(territoriesRaw) ? territoriesRaw: [];
  const packs      = Array.isArray(packsRaw)      ? packsRaw      : [];
  const relations  = Array.isArray(relationsRaw)  ? relationsRaw  : [];
  const wars       = Array.isArray(warsRaw)       ? warsRaw       : [];
  const heroes     = Array.isArray(heroesRaw)     ? heroesRaw     : [];

  const activeKingdoms = kingdoms.filter(k => k.status === "active");
  const ongoingWars    = wars.filter(w => w.status === "ongoing");
  const activeHeroes   = heroes.filter(h => h.status === "active");
  const maxInfluence   = Math.max(...activeKingdoms.map(k => k.influence), 1);
  const maxMilitary    = Math.max(...activeKingdoms.map(k => k.militaryPower), 1);
  const maxEconomy     = Math.max(...activeKingdoms.map(k => k.economy), 1);

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number; alert?: boolean }[] = [
    { id: "kingdoms",    label: "Quốc Gia",   icon: Crown,    count: activeKingdoms.length },
    { id: "territories", label: "Lãnh Thổ",   icon: Globe,    count: territories.length },
    { id: "packs",       label: "Bầy Đàn",    icon: Users,    count: packs.length },
    { id: "diplomacy",   label: "Ngoại Giao",  icon: Handshake,count: relations.length },
    { id: "wars",        label: "Chiến Tranh", icon: Swords,   count: wars.length, alert: ongoingWars.length > 0 },
    { id: "heroes",      label: "Anh Hùng",   icon: Star,     count: heroes.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-widest uppercase hologram-text">
          VƯƠNG QUỐC THÚ GIỚI
        </h1>
        <p className="text-muted-foreground text-sm font-mono mt-1">
          WAR & WORLD CONQUEST SYSTEM V6 // CHIẾN TRANH · ANH HÙNG · NỔI LOẠN
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Quốc Gia", value: activeKingdoms.length, color: "#f59e0b" },
          { label: "Lãnh Thổ", value: territories.length,    color: "#06b6d4" },
          { label: "Bầy Đàn",  value: packs.length,          color: "#8b5cf6" },
          { label: "Ngoại Giao",value: relations.length,      color: "#22c55e" },
          { label: "Cuộc Chiến",value: wars.length,          color: ongoingWars.length > 0 ? "#ef4444" : "#64748b" },
          { label: "Anh Hùng", value: activeHeroes.length,   color: "#fbbf24" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 rounded border border-primary/20 bg-card/40">
            <div className="text-[9px] font-mono text-slate-500 tracking-widest mb-1">{label.toUpperCase()}</div>
            <div className="text-2xl font-bold" style={{ color, textShadow: `0 0 8px ${color}` }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-primary/20">
        {tabs.map(({ id, label, icon: Icon, count, alert }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-mono border-b-2 transition-all -mb-px ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count !== undefined && (
              <span className={`text-[10px] px-1 rounded ${
                tab === id ? "bg-primary/20 text-primary" :
                alert ? "bg-red-900/50 text-red-400 animate-pulse" : "bg-slate-800 text-slate-500"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── KINGDOMS TAB ─── */}
      {tab === "kingdoms" && (
        <div className="space-y-3">
          {kingLoading && <div className="text-slate-500 font-mono text-sm animate-pulse">Đang tải dữ liệu quốc gia...</div>}
          {activeKingdoms.length === 0 && !kingLoading && (
            <div className="p-8 text-center text-slate-600 font-mono text-sm">
              Chưa có quốc gia nào được thành lập.<br />
              Tiếp tục chạy mô phỏng để các loài tập hợp thành vương quốc.
            </div>
          )}
          {activeKingdoms.map((k, i) => (
            <div key={k.id} className="p-4 rounded border border-primary/20 bg-card/40 hover:border-primary/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-400/60 font-bold">#{i + 1}</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-bold text-white">{k.name}</h3>
                    {(k.warCount ?? 0) > 0 && (
                      <span className="text-[9px] font-mono text-red-400 border border-red-500/30 px-1 rounded">
                        ⚔️ {k.warCount ?? 0} cuộc chiến
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-mono text-slate-400">
                    <span>Loài: <span className="text-cyan-400">{k.dominantSpecies}</span></span>
                    <span>Thủ đô: <span className="text-violet-400">{k.capital}</span></span>
                    <span>Lãnh thổ: <span className="text-emerald-400">{k.territoryCount}</span></span>
                    <span className="text-slate-600">Năm {k.foundedDay}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-amber-400" style={{ textShadow: "0 0 8px #f59e0b" }}>
                    {k.influence}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">ẢNH HƯỞNG</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <PowerBar value={k.militaryPower} max={maxMilitary} color="#ef4444" label="Quân Lực" />
                <PowerBar value={k.economy}       max={maxEconomy}  color="#22c55e" label="Kinh Tế"  />
                <PowerBar value={k.influence}     max={maxInfluence} color="#f59e0b" label="Ảnh Hưởng" />
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-[10px] font-mono">
                <span className="text-slate-500">Dân số: <span className="text-white">{k.population.toLocaleString()}</span></span>
                <span className="text-slate-500">Công Nghệ: <span className="text-cyan-400">Lv {k.technologyLevel ?? 1}</span></span>
                <span className="text-slate-500">Tinh Thần: <span style={{ color: (k.morale ?? 70) > 60 ? "#22c55e" : (k.morale ?? 70) > 30 ? "#f59e0b" : "#ef4444" }}>{k.morale ?? 70}%</span></span>
                <span className="text-slate-500">Thắng: <span className="text-amber-400">{k.warWins ?? 0}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TERRITORIES TAB ─── */}
      {tab === "territories" && (
        <div className="grid grid-cols-2 gap-4">
          {terrLoading && <div className="col-span-2 text-slate-500 font-mono text-sm animate-pulse">Đang tải lãnh thổ...</div>}
          {territories.map(t => {
            const climate = CLIMATE_CONFIG[t.climate] ?? CLIMATE_CONFIG.temperate;
            const foodPct  = Math.round((t.food / t.foodMax) * 100);
            const waterPct = Math.round((t.water / t.waterMax) * 100);
            const isLow = foodPct < 25 || waterPct < 25;
            return (
              <div key={t.id} className={`p-4 rounded border bg-card/40 transition-all ${t.contested ? "border-red-500/60" : isLow ? "border-amber-500/40" : "border-primary/20"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{climate.icon}</span>
                      <h3 className="font-bold text-sm text-white">{t.zoneName}</h3>
                      {t.contested && <span className="text-[9px] text-red-400 font-mono border border-red-500/40 px-1 rounded animate-pulse">TRANH CHẤP</span>}
                      {isLow && !t.contested && <span className="text-[9px] text-amber-400 font-mono border border-amber-500/40 px-1 rounded">THIẾU TÀI NGUYÊN</span>}
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${climate.color}`}>{climate.label}</div>
                  </div>
                  <div className="text-right text-[10px] font-mono">
                    {t.controllingKingdom ? (
                      <span className="text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5">
                        👑 {t.controllingKingdom}
                      </span>
                    ) : (
                      <span className="text-slate-600">Chưa kiểm soát</span>
                    )}
                  </div>
                </div>
                {t.dominantSpecies && (
                  <div className="text-[10px] font-mono text-slate-500 mb-2">
                    Loài ưu thế: <span className="text-cyan-400">{t.dominantSpecies}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <ResourceBar label="Thức Ăn"   value={t.food}    max={t.foodMax}    color="#22c55e" />
                  <ResourceBar label="Nước"       value={t.water}   max={t.waterMax}   color="#3b82f6" />
                  <ResourceBar label="Khoáng Sản" value={t.mineral} max={t.mineralMax} color="#f59e0b" />
                  <ResourceBar label="Linh Khí"   value={t.spirit}  max={t.spiritMax}  color="#a855f7" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── PACKS TAB ─── */}
      {tab === "packs" && (
        <div className="overflow-x-auto rounded border border-primary/20">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-primary/20 bg-primary/5">
                {["Bầy Đàn", "Lãnh Thổ", "Dân Số", "Thủ Lĩnh", "Lv", "INT", "Karisma", "Quốc Gia"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] text-primary/70 tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packsLoading && <tr><td colSpan={8} className="px-3 py-4 text-center text-slate-600 animate-pulse">Đang tải dữ liệu bầy đàn...</td></tr>}
              {packs.map((p, i) => (
                <tr key={p.id} className={`border-b border-slate-800/60 hover:bg-primary/5 transition-colors ${i % 2 === 0 ? "bg-card/20" : ""}`}>
                  <td className="px-3 py-2"><div className="font-bold text-white">{p.speciesName}</div></td>
                  <td className="px-3 py-2 text-slate-300">{p.territory}</td>
                  <td className="px-3 py-2"><span className="text-cyan-400 font-bold">{p.population.toLocaleString()}</span></td>
                  <td className="px-3 py-2 text-amber-300">{p.leaderName}</td>
                  <td className="px-3 py-2 text-violet-400">{p.leaderLevel}</td>
                  <td className="px-3 py-2 text-blue-400">{p.leaderIntelligence}</td>
                  <td className="px-3 py-2 text-pink-400">{p.leaderCharisma}</td>
                  <td className="px-3 py-2">
                    {p.kingdomName
                      ? <span className="text-amber-400 text-[9px] border border-amber-500/30 rounded px-1">👑 {p.kingdomName}</span>
                      : <span className="text-slate-600 text-[9px]">Độc lập</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── DIPLOMACY TAB ─── */}
      {tab === "diplomacy" && (
        <div className="space-y-3">
          {relations.length === 0 && (
            <div className="p-8 text-center text-slate-600 font-mono text-sm">
              Chưa có quan hệ ngoại giao nào.<br />
              Cần ít nhất 2 quốc gia và thêm thời gian để quan hệ hình thành.
            </div>
          )}
          {relations.map(r => {
            const cfg = RELATION_CONFIG[r.relation as keyof typeof RELATION_CONFIG] ?? RELATION_CONFIG.neutral;
            return (
              <div key={r.id} className={`flex items-center gap-4 p-3 rounded border ${cfg.border} ${cfg.bg}`}>
                <span className="text-lg">{cfg.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-white">{r.kingdomNameA}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${cfg.border} ${cfg.color}`}>{cfg.label}</span>
                    <span className="font-bold text-white">{r.kingdomNameB}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">Từ năm {r.sinceDay}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── WARS TAB ─── V6 */}
      {tab === "wars" && (
        <div className="space-y-4">
          {warsLoading && <div className="text-slate-500 font-mono text-sm animate-pulse">Đang tải dữ liệu chiến tranh...</div>}

          {/* Ongoing wars highlight */}
          {ongoingWars.length > 0 && (
            <div className="p-3 rounded border border-red-500/40 bg-red-900/10">
              <div className="text-[10px] font-mono text-red-400 tracking-widest mb-2 flex items-center gap-2">
                <Swords className="w-3.5 h-3.5 animate-pulse" />
                {ongoingWars.length} CUỘC CHIẾN ĐANG DIỄN RA
              </div>
              {ongoingWars.map(w => (
                <div key={w.id} className="text-sm font-mono text-white flex items-center gap-2 mb-1">
                  <span className="text-red-400">⚔️</span>
                  <span className="text-orange-400 font-bold">{w.attackerKingdom}</span>
                  <span className="text-slate-500">tấn công</span>
                  <span className="text-blue-400 font-bold">{w.defenderKingdom}</span>
                  <span className="text-[9px] text-slate-600">Từ năm {w.startDay}</span>
                </div>
              ))}
            </div>
          )}

          {wars.length === 0 && !warsLoading && (
            <div className="p-8 text-center text-slate-600 font-mono text-sm">
              Chưa có cuộc chiến nào.<br />
              Các quốc gia cần quan hệ thù địch và đủ quân lực để tuyên chiến.
            </div>
          )}

          {/* War history list */}
          <div className="space-y-3">
            {wars.map(w => {
              const cfg = WAR_STATUS_CONFIG[w.status] ?? WAR_STATUS_CONFIG.ceasefire;
              return (
                <div key={w.id} className={`p-4 rounded border ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cfg.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-orange-400">{w.attackerKingdom}</span>
                          <span className="text-slate-500 text-[11px]">VS</span>
                          <span className="font-bold text-blue-400">{w.defenderKingdom}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Năm {w.startDay} {w.endDay ? `→ ${w.endDay}` : "→ (đang diễn ra)"}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${cfg.border} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {w.resultDescription && (
                    <p className="text-[11px] text-slate-300 mb-2">{w.resultDescription}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-500">
                    {w.territoryWon && (
                      <span className="text-amber-400">🗺️ Chiếm: {w.territoryWon}</span>
                    )}
                    {w.attackerCasualties > 0 && (
                      <span>💀 Tấn công mất: <span className="text-orange-400">{w.attackerCasualties}</span></span>
                    )}
                    {w.defenderCasualties > 0 && (
                      <span>💀 Phòng thủ mất: <span className="text-blue-400">{w.defenderCasualties}</span></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── HEROES TAB ─── V6 */}
      {tab === "heroes" && (
        <div className="space-y-4">
          {heroesLoading && <div className="text-slate-500 font-mono text-sm animate-pulse">Đang tải dữ liệu anh hùng...</div>}

          {heroes.length === 0 && !heroesLoading && (
            <div className="p-8 text-center text-slate-600 font-mono text-sm">
              Chưa có anh hùng nào.<br />
              Các quốc gia cần quân lực mạnh (&gt;200) để sinh ra anh hùng huyền thoại.
            </div>
          )}

          {/* Active heroes */}
          {activeHeroes.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-yellow-400/60 tracking-widest mb-2">ANH HÙNG ĐANG SỐNG</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeHeroes.map(h => (
                  <div key={h.id} className="p-4 rounded border border-yellow-500/40 bg-yellow-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <div>
                          <div className="font-bold text-white text-sm">{h.name}</div>
                          <div className="text-[10px] font-mono text-yellow-400/70">{h.kingdomName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-400">Lv {h.level}</div>
                        <div className="text-[9px] font-mono text-slate-500">Sinh năm {h.bornDay}</div>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-amber-300 mb-2 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {h.ability}
                    </div>
                    <div className="flex gap-4 text-[10px] font-mono">
                      <span className="text-slate-500">Quân lực: <span className="text-red-400">+{h.militaryBonus}</span></span>
                      <span className="text-slate-500">Tinh thần: <span className="text-emerald-400">+{h.moraleBonus}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallen heroes */}
          {heroes.filter(h => h.status === "fallen").length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500/60 tracking-widest mb-2">ANH HÙNG ĐÃ HY SINH</div>
              <div className="space-y-2">
                {heroes.filter(h => h.status === "fallen").map(h => (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded border border-slate-700/40 bg-slate-900/20 opacity-60">
                    <span className="text-slate-500">💔</span>
                    <div className="flex-1">
                      <span className="text-slate-400 font-mono text-sm line-through">{h.name}</span>
                      <span className="text-[10px] font-mono text-slate-600 ml-2">{h.kingdomName} • Lv {h.level}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600">{h.ability}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
