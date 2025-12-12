import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import AdDirector from "./pages/AdDirector";
import Feed from "./pages/Feed";
import StudioPage from "./pages/StudioPage";
import CameraDirectorPage from "./pages/CameraDirectorPage";
import VisualControlsPage from "./pages/VisualControlsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Home route that shows Landing for guests, AdDirector for authenticated users
const HomeRoute = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return user ? <AdDirector /> : <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/studio" element={
              <ProtectedRoute>
                <StudioPage />
              </ProtectedRoute>
            } />
            <Route path="/feed" element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            } />
            <Route path="/camera-director/:imageId" element={
              <ProtectedRoute>
                <CameraDirectorPage />
              </ProtectedRoute>
            } />
            <Route path="/visual-controls/:imageId" element={
              <ProtectedRoute>
                <VisualControlsPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
