import { Link, useLocation } from "wouter";
import { LayoutDashboard, Map as MapIcon, Book, Dna, History, GitBranch, FlaskConical } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/map", label: "Bản đồ", icon: MapIcon },
    { href: "/beastdex", label: "Beastdex", icon: Book },
    { href: "/breeding", label: "Lai Tạo", icon: Dna },
    { href: "/history", label: "Lịch Sử", icon: History },
    { href: "/evolution", label: "Cây Tiến Hóa", icon: GitBranch },
    { href: "/genetics", label: "Genetics Lab", icon: FlaskConical },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <aside className="w-64 flex-shrink-0 border-r border-primary/20 bg-card/50 backdrop-blur-md flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="p-6 border-b border-primary/20 relative">
          <h1 className="text-2xl font-bold text-primary tracking-widest uppercase hologram-text flex items-center gap-2">
            <Dna className="w-6 h-6 animate-pulse-glow" />
            THÚ GIỚI AI
          </h1>
          <div className="text-xs text-primary/50 font-mono mt-1">SYS.VER.0.4.0</div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 relative overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 border transition-all duration-300 ${
                  isActive
                    ? "bg-primary/10 border-primary text-primary shadow-[inset_0_0_10px_rgba(var(--primary),0.2)]"
                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border-primary/30"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                <span className="font-medium tracking-wide text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-primary/20 text-xs font-mono text-muted-foreground text-center relative">
          STATUS: <span className="text-green-400">ONLINE</span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
