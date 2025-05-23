
import React, { Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";

import Index from "@/pages/Index";
import Features from "@/pages/Features";
import Solutions from "@/pages/Solutions";
import Pricing from "@/pages/Pricing";
import Gallery from "@/pages/Gallery";
import Community from "@/pages/Community";
import Resources from "@/pages/Resources";
import Docs from "@/pages/Docs";
import NotFound from "@/pages/NotFound";
import Studio from "@/pages/Studio";
import Profile from "@/pages/Profile";
import ProfileFigurines from "@/pages/ProfileFigurines";
import Settings from "@/pages/Settings";

import { AuthProvider } from "@/components/auth/AuthProvider";
import Auth from "@/pages/Auth";
import CompleteProfile from "@/pages/CompleteProfile";

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/features" element={<Features />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/community" element={<Community />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/studio" element={<Studio />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/figurines" element={<ProfileFigurines />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
