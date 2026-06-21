import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import MapPage from "@/pages/map";
import BeastdexPage from "@/pages/beastdex";
import CreatureDetail from "@/pages/creature-detail";
import BreedingPage from "@/pages/breeding";
import HistoryPage from "@/pages/history";
import EvolutionTreePage from "@/pages/evolution-tree";
import GeneticsLabPage from "@/pages/genetics-lab";
import KingdomsPage from "@/pages/kingdoms";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/map" component={MapPage} />
        <Route path="/beastdex" component={BeastdexPage} />
        <Route path="/beastdex/:id" component={CreatureDetail} />
        <Route path="/breeding" component={BreedingPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/evolution" component={EvolutionTreePage} />
        <Route path="/genetics" component={GeneticsLabPage} />
        <Route path="/kingdoms" component={KingdomsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
