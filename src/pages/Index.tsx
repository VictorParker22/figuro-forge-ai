
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import VantaBackground from "@/components/VantaBackground";

const Index = () => {
  return (
    <VantaBackground>
      <div className="min-h-screen bg-transparent">
        <Header />
        <Hero />
        <Features />
      </div>
    </VantaBackground>
  );
};

export default Index;
