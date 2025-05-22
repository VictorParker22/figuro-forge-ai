
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      <Hero />
      
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-40 -left-64 w-96 h-96 bg-figuro-accent/20 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute bottom-20 -right-64 w-96 h-96 bg-figuro-accent/20 rounded-full filter blur-3xl opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gradient">Ready to create your first figurine?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/studio">
                <Button className="bg-figuro-accent hover:bg-figuro-accent-hover text-white px-8 py-6 text-lg">
                  Launch Studio
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Features />
      
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-figuro-accent/10 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass-panel rounded-xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gradient">Start Creating Today</h2>
              <p className="text-white/70 mb-8">
                Join thousands of creators who are bringing their imaginations to life with Figuro.AI. 
                Our platform makes it easy to create beautiful 3D figurines from simple text prompts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/studio" className="flex-1">
                  <Button className="w-full bg-figuro-accent hover:bg-figuro-accent-hover">
                    Try it Free
                  </Button>
                </Link>
                <Button variant="outline" className="flex-1 border-white/20 hover:border-white/40">
                  Learn More
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
