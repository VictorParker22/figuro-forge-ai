
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import VantaBackground from "@/components/VantaBackground";
import HomepageGallery from "@/components/HomepageGallery";

const Index = () => {
  return (
    <VantaBackground>
      <div className="min-h-screen bg-transparent">
        <Header />
        <Hero />
        <HomepageGallery />
        <Features />
      </div>
    </VantaBackground>
  );
};

export default Index;
