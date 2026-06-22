import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Shield, Flame, BookOpen, Newspaper, Clock, Star, Zap, Crown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = "/api";

async function fetchLore(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

type WorldAge = {
  id: number; name: string; startDay: number; endDay: number | null;
  description: string; trigger: string; isCurrent: boolean;
};
type Legend = {
  id: number; title: string; content: string; category: string;
  relatedEntity: string; worldDay: number; createdAt: string;
};
type Myth = {
  id: number; title: string; content: string; subject: string;
  subjectName: string; worldDay: number;
};
type BloodlineHistory = {
  id: number; bloodlineName: string; ancestorName: string; totalAgeTicks: number;
  peakPopulation: number; content: string;
};
type LoreBook = {
  id: number; title: string; category: string; content: string; worldDay: number;
};
type LoreNews = {
  id: number; headline: string; content: string; category: string; worldDay: number;
};
type LoreSummary = {
  currentAge: string; currentAgeDescription: string; currentAgeStartDay: number;
  famousHeroName: string | null; famousHeroKingdom: string | null; famousHeroLevel: number | null;
  strongestBloodline: string; largestHistoricalKingdomName: string | null;
  latestLegendTitle: string | null; latestNewsHeadline: string | null;
};

const TABS = [
  { key: "ages",       label: "Kỷ Nguyên",    icon: Clock },
  { key: "legends",    label: "Truyền Thuyết", icon: ScrollText },
  { key: "myths",      label: "Thần Thoại",   icon: Flame },
  { key: "bloodlines", label: "Huyết Mạch",   icon: Shield },
  { key: "books",      label: "Thư Viện",     icon: BookOpen },
  { key: "news",       label: "Báo Chí",      icon: Newspaper },
] as const;

type TabKey = typeof TABS[number]["key"];

const CATEGORY_COLOR: Record<string, string> = {
  war: "text-red-400 border-red-500/40",
  kingdom: "text-amber-400 border-amber-500/40",
  evolution: "text-cyan-400 border-cyan-500/40",
  extinction: "text-slate-400 border-slate-500/40",
  hero: "text-yellow-300 border-yellow-500/40",
  history: "text-primary border-primary/40",
  mythology: "text-purple-400 border-purple-500/40",
  bloodline: "text-green-400 border-green-500/40",
  general: "text-primary border-primary/40",
};

const BLOODLINE_RARITY: Record<string, { label: string; color: string }> = {
  common:    { label: "Thường",       color: "text-slate-400" },
  rare:      { label: "Hiếm",         color: "text-blue-400" },
  epic:      { label: "Sử Thi",       color: "text-purple-400" },
  legendary: { label: "Huyền Thoại",  color: "text-amber-400" },
  mythic:    { label: "Thần Thoại",   color: "text-orange-400" },
  divine:    { label: "Thần Thánh",   color: "text-red-400" },
};

export default function LoredexPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ages");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const summary = useQuery<LoreSummary>({
    queryKey: ["lore-summary"],
    queryFn: () => fetchLore("/lore/summary"),
    refetchInterval: 15000,
  });
  const ages = useQuery<WorldAge[]>({ queryKey: ["lore-ages"], queryFn: () => fetchLore("/lore/ages"), enabled: activeTab === "ages" });
  const legends = useQuery<Legend[]>({ queryKey: ["lore-legends"], queryFn: () => fetchLore("/lore/legends"), enabled: activeTab === "legends" });
  const myths = useQuery<Myth[]>({ queryKey: ["lore-myths"], queryFn: () => fetchLore("/lore/myths"), enabled: activeTab === "myths" });
  const bloodlines = useQuery<BloodlineHistory[]>({ queryKey: ["lore-bloodlines"], queryFn: () => fetchLore("/lore/bloodlines"), enabled: activeTab === "bloodlines" });
  const books = useQuery<LoreBook[]>({ queryKey: ["lore-books"], queryFn: () => fetchLore("/lore/books"), enabled: activeTab === "books" });
  const news = useQuery<LoreNews[]>({ queryKey: ["lore-news"], queryFn: () => fetchLore("/lore/news"), enabled: activeTab === "news" });

  const generateLore = async () => {
    await fetch(`${API_BASE}/lore/generate`, { method: "POST" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <header className="border-b border-primary/20 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-widest text-foreground uppercase flex items-center gap-3">
              <ScrollText className="w-8 h-8 text-primary" />
              Loredex
            </h1>
            <p className="text-primary/70 font-mono mt-2 text-sm">
              V7 · AI LORE ENGINE · Lịch sử sống của Thú Giới
            </p>
          </div>
          <button
            onClick={generateLore}
            className="border border-primary/40 text-primary px-4 py-2 text-xs font-mono tracking-widest hover:bg-primary/10 transition-colors"
          >
            ⟳ TẠO LORE
          </button>
        </div>
      </header>

      {/* Summary bar */}
      {summary.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            icon={Clock}
            label="Kỷ Nguyên Hiện Tại"
            value={summary.data.currentAge}
            color="text-primary"
          />
          <SummaryCard
            icon={Star}
            label="Anh Hùng Nổi Tiếng"
            value={summary.data.famousHeroName ?? "—"}
            sub={summary.data.famousHeroKingdom ?? ""}
            color="text-yellow-300"
          />
          <SummaryCard
            icon={Shield}
            label="Huyết Mạch Mạnh Nhất"
            value={summary.data.strongestBloodline}
            color="text-green-400"
          />
          <SummaryCard
            icon={Crown}
            label="Đế Quốc Vĩ Đại Nhất"
            value={summary.data.largestHistoricalKingdomName ?? "—"}
            color="text-amber-400"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-primary/20 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSelectedItem(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-widest whitespace-nowrap border-b-2 transition-all ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List panel */}
        <div className="lg:col-span-1 space-y-2">
          {activeTab === "ages" && <AgesList data={ages.data} isLoading={ages.isLoading} onSelect={setSelectedItem} selected={selectedItem} />}
          {activeTab === "legends" && <LegendsList data={legends.data} isLoading={legends.isLoading} onSelect={setSelectedItem} selected={selectedItem} />}
          {activeTab === "myths" && <MythsList data={myths.data} isLoading={myths.isLoading} onSelect={setSelectedItem} selected={selectedItem} />}
          {activeTab === "bloodlines" && <BloodlinesList data={bloodlines.data} isLoading={bloodlines.isLoading} onSelect={setSelectedItem} selected={selectedItem} />}
          {activeTab === "books" && <BooksList data={books.data} isLoading={books.isLoading} onSelect={setSelectedItem} selected={selectedItem} />}
          {activeTab === "news" && <NewsList data={news.data} isLoading={news.isLoading} onSelect={setSelectedItem} selected={selectedItem} />}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <DetailPanel item={selectedItem} tab={activeTab} />
          ) : (
            <EmptyDetail tab={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="hologram-border bg-card/50 p-4">
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${color} shrink-0 mt-0.5`} />
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
          <div className={`text-sm font-bold font-mono truncate ${color}`} style={{ textShadow: "0 0 8px currentColor" }}>{value}</div>
          {sub && <div className="text-[10px] text-muted-foreground font-mono truncate">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 bg-primary/5" />)}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground font-mono text-sm">
      <Zap className="w-8 h-8 mx-auto mb-3 opacity-20" />
      {label}
    </div>
  );
}

function ListItem({ title, sub, badge, selected, onClick, badgeColor = "text-primary" }: {
  title: string; sub?: string; badge?: string; selected?: boolean; onClick: () => void; badgeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border transition-all flex items-center justify-between gap-2 ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-primary/10 bg-card/30 hover:border-primary/40 hover:bg-primary/5 text-foreground"
      }`}
    >
      <div className="min-w-0">
        <div className="font-medium text-sm truncate">{title}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && <span className={`text-[10px] font-mono ${badgeColor}`}>{badge}</span>}
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
      </div>
    </button>
  );
}

function AgesList({ data, isLoading, onSelect, selected }: any) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data || data.length === 0) return <EmptyState label="Chưa có kỷ nguyên — hãy chạy mô phỏng" />;
  return (
    <div className="space-y-2">
      {[...data].reverse().map((age: WorldAge) => (
        <ListItem
          key={age.id}
          title={age.name}
          sub={`Năm ${age.startDay}${age.endDay ? ` → ${age.endDay}` : " → Hiện Tại"}`}
          badge={age.isCurrent ? "HIỆN TẠI" : ""}
          badgeColor="text-green-400"
          selected={selected?.id === age.id}
          onClick={() => onSelect(age)}
        />
      ))}
    </div>
  );
}

function LegendsList({ data, isLoading, onSelect, selected }: any) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data || data.length === 0) return <EmptyState label="Chưa có truyền thuyết — hãy chạy mô phỏng" />;
  return (
    <div className="space-y-2">
      {data.map((legend: Legend) => {
        const col = CATEGORY_COLOR[legend.category] ?? "text-primary";
        return (
          <ListItem
            key={legend.id}
            title={legend.title}
            sub={`Năm ${legend.worldDay} · ${legend.relatedEntity}`}
            badge={legend.category.toUpperCase()}
            badgeColor={col.split(" ")[0]}
            selected={selected?.id === legend.id}
            onClick={() => onSelect(legend)}
          />
        );
      })}
    </div>
  );
}

function MythsList({ data, isLoading, onSelect, selected }: any) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data || data.length === 0) return <EmptyState label="Chưa có thần thoại — hãy chạy mô phỏng" />;
  return (
    <div className="space-y-2">
      {data.map((myth: Myth) => (
        <ListItem
          key={myth.id}
          title={myth.title}
          sub={`${myth.subject} · ${myth.subjectName}`}
          badge={`NĂM ${myth.worldDay}`}
          badgeColor="text-purple-400"
          selected={selected?.id === myth.id}
          onClick={() => onSelect(myth)}
        />
      ))}
    </div>
  );
}

function BloodlinesList({ data, isLoading, onSelect, selected }: any) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data || data.length === 0) return <EmptyState label="Chưa có huyết mạch — hãy chạy mô phỏng" />;
  return (
    <div className="space-y-2">
      {data.map((bl: BloodlineHistory) => {
        const rarity = BLOODLINE_RARITY[bl.bloodlineName] ?? { label: bl.bloodlineName, color: "text-primary" };
        return (
          <ListItem
            key={bl.id}
            title={`Huyết Mạch ${bl.bloodlineName}`}
            sub={`Tổ: ${bl.ancestorName} · Tuổi: ${bl.totalAgeTicks} chu kỳ`}
            badge={rarity.label.toUpperCase()}
            badgeColor={rarity.color}
            selected={selected?.id === bl.id}
            onClick={() => onSelect(bl)}
          />
        );
      })}
    </div>
  );
}

function BooksList({ data, isLoading, onSelect, selected }: any) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data || data.length === 0) return <EmptyState label="Thư viện trống — hãy chạy mô phỏng" />;
  return (
    <div className="space-y-2">
      {data.map((book: LoreBook) => {
        const col = CATEGORY_COLOR[book.category] ?? "text-primary";
        return (
          <ListItem
            key={book.id}
            title={book.title}
            sub={`Năm ${book.worldDay} · ${book.category}`}
            badge={book.category.toUpperCase()}
            badgeColor={col.split(" ")[0]}
            selected={selected?.id === book.id}
            onClick={() => onSelect(book)}
          />
        );
      })}
    </div>
  );
}

function NewsList({ data, isLoading, onSelect, selected }: any) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data || data.length === 0) return <EmptyState label="Chưa có tin tức — hãy chạy mô phỏng" />;
  return (
    <div className="space-y-2">
      {data.map((item: LoreNews) => {
        const col = CATEGORY_COLOR[item.category] ?? "text-primary";
        return (
          <ListItem
            key={item.id}
            title={item.headline}
            sub={`Năm ${item.worldDay}`}
            badge={item.category.toUpperCase()}
            badgeColor={col.split(" ")[0]}
            selected={selected?.id === item.id}
            onClick={() => onSelect(item)}
          />
        );
      })}
    </div>
  );
}

function DetailPanel({ item, tab }: { item: any; tab: TabKey }) {
  return (
    <div className="hologram-border bg-card/30 p-6 min-h-[400px] animate-in fade-in duration-300">
      {tab === "ages" && <AgeDetail age={item} />}
      {tab === "legends" && <LegendDetail legend={item} />}
      {tab === "myths" && <MythDetail myth={item} />}
      {tab === "bloodlines" && <BloodlineDetail bl={item} />}
      {tab === "books" && <BookDetail book={item} />}
      {tab === "news" && <NewsDetail news={item} />}
    </div>
  );
}

function EmptyDetail({ tab }: { tab: TabKey }) {
  const labels: Record<TabKey, string> = {
    ages: "kỷ nguyên",
    legends: "truyền thuyết",
    myths: "thần thoại",
    bloodlines: "huyết mạch",
    books: "cuốn sách",
    news: "tin tức",
  };
  return (
    <div className="hologram-border bg-card/30 p-6 min-h-[400px] flex items-center justify-center">
      <div className="text-center text-muted-foreground font-mono">
        <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">Chọn một {labels[tab]} để xem chi tiết</p>
      </div>
    </div>
  );
}

function AgeDetail({ age }: { age: WorldAge }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Clock className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-widest">{age.name}</h2>
          {age.isCurrent && (
            <span className="text-xs font-mono text-green-400 border border-green-400/30 px-2 py-0.5">
              ● ĐANG DIỄN RA
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 font-mono text-sm">
        <div className="bg-black/30 p-3 border border-primary/10">
          <div className="text-muted-foreground text-xs mb-1">BẮT ĐẦU</div>
          <div className="text-primary">Năm {age.startDay}</div>
        </div>
        <div className="bg-black/30 p-3 border border-primary/10">
          <div className="text-muted-foreground text-xs mb-1">KẾT THÚC</div>
          <div className="text-primary">{age.endDay ? `Năm ${age.endDay}` : "Chưa kết thúc"}</div>
        </div>
      </div>
      <div className="border-l-2 border-primary/40 pl-4 mt-4">
        <p className="text-foreground/90 leading-relaxed">{age.description}</p>
      </div>
    </div>
  );
}

function LegendDetail({ legend }: { legend: Legend }) {
  const colClass = CATEGORY_COLOR[legend.category] ?? "text-primary border-primary/40";
  return (
    <div className="space-y-4">
      <div>
        <div className={`text-xs font-mono border px-2 py-0.5 inline-block mb-2 ${colClass}`}>
          {legend.category.toUpperCase()}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{legend.title}</h2>
        <div className="text-xs font-mono text-muted-foreground mt-1">Năm {legend.worldDay} · {legend.relatedEntity}</div>
      </div>
      <div className="border-l-2 border-primary/40 pl-4 space-y-3">
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{legend.content}</p>
      </div>
    </div>
  );
}

function MythDetail({ myth }: { myth: Myth }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-mono text-purple-400 border border-purple-400/30 px-2 py-0.5 inline-block mb-2">
          THẦN THOẠI · {myth.subject.toUpperCase()}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{myth.title}</h2>
        <div className="text-xs font-mono text-muted-foreground mt-1">Chủ thể: {myth.subjectName}</div>
      </div>
      <div className="border-l-2 border-purple-400/40 pl-4">
        <p className="text-foreground/90 leading-relaxed italic">{myth.content}</p>
      </div>
    </div>
  );
}

function BloodlineDetail({ bl }: { bl: BloodlineHistory }) {
  const rarity = BLOODLINE_RARITY[bl.bloodlineName] ?? { label: bl.bloodlineName, color: "text-primary" };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className={`w-6 h-6 ${rarity.color}`} />
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "currentColor" }}>
            <span className={rarity.color}>Huyết Mạch {bl.bloodlineName}</span>
          </h2>
          <div className={`text-xs font-mono ${rarity.color}`}>{rarity.label}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 font-mono text-sm">
        <div className="bg-black/30 p-3 border border-primary/10">
          <div className="text-muted-foreground text-xs mb-1">TỔ TIÊN</div>
          <div className="text-foreground">{bl.ancestorName}</div>
        </div>
        <div className="bg-black/30 p-3 border border-primary/10">
          <div className="text-muted-foreground text-xs mb-1">TUỔI HUYẾT MẠCH</div>
          <div className="text-foreground">{bl.totalAgeTicks} chu kỳ</div>
        </div>
        <div className="bg-black/30 p-3 border border-primary/10 col-span-2">
          <div className="text-muted-foreground text-xs mb-1">DÂN SỐ ĐỈNH CAO</div>
          <div className="text-foreground">{bl.peakPopulation.toLocaleString()}</div>
        </div>
      </div>
      <div className="border-l-2 border-green-400/40 pl-4">
        <p className="text-foreground/90 leading-relaxed text-sm">{bl.content}</p>
      </div>
    </div>
  );
}

function BookDetail({ book }: { book: LoreBook }) {
  const colClass = CATEGORY_COLOR[book.category] ?? "text-primary border-primary/40";
  const sections = book.content.split("---").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="space-y-4">
      <div>
        <div className={`text-xs font-mono border px-2 py-0.5 inline-block mb-2 ${colClass}`}>
          {book.category.toUpperCase()}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{book.title}</h2>
        <div className="text-xs font-mono text-muted-foreground mt-1">Biên soạn năm {book.worldDay}</div>
      </div>
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {sections.map((section, i) => {
          const lines = section.split("\n");
          const heading = lines[0]?.replace(/^#+\s*/, "");
          const body = lines.slice(1).join("\n").trim();
          return (
            <div key={i} className="border-l-2 border-primary/20 pl-4">
              <div className="text-primary font-bold mb-2">{heading}</div>
              <p className="text-foreground/80 text-sm leading-relaxed">{body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewsDetail({ news }: { news: LoreNews }) {
  const colClass = CATEGORY_COLOR[news.category] ?? "text-primary border-primary/40";
  return (
    <div className="space-y-4">
      <div>
        <div className={`text-xs font-mono border px-2 py-0.5 inline-block mb-2 ${colClass}`}>
          TIN TỨC · NĂM {news.worldDay}
        </div>
        <h2 className="text-xl font-bold text-foreground">{news.headline}</h2>
      </div>
      <div className="bg-black/30 border border-primary/10 p-4">
        <pre className="text-foreground/90 text-sm leading-relaxed font-mono whitespace-pre-wrap">{news.content}</pre>
      </div>
    </div>
  );
}
