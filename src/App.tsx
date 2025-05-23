
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import StructuredData from "@/components/StructuredData";
import { structuredData } from "@/config/seo";
import Index from "./pages/Index";
import Studio from "./pages/Studio";
import Gallery from "./pages/Gallery"; 
import Solutions from "./pages/Solutions";
import Resources from "./pages/Resources";
import Community from "./pages/Community";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* Global Organization Structured Data */}
        <StructuredData type="Organization" data={structuredData.organization} />
        {/* Global WebApplication Structured Data */}
        <StructuredData type="WebApplication" data={structuredData.webApplication} />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/community" element={<Community />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
