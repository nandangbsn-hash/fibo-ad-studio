import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdDirector from "./pages/AdDirector";
import Feed from "./pages/Feed";
import CameraDirectorPage from "./pages/CameraDirectorPage";
import VisualControlsPage from "./pages/VisualControlsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdDirector />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/camera-director/:imageId" element={<CameraDirectorPage />} />
          <Route path="/visual-controls/:imageId" element={<VisualControlsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
