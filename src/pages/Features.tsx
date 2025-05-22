
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Code, Grid2X2, Download } from "lucide-react";

const FeaturesPage = () => {
  // Feature cards data
  const features = [
    {
      title: "AI-Powered Design",
      description: "Transform text descriptions into detailed 3D figurine designs with our advanced AI algorithms.",
      icon: <Star className="h-10 w-10 text-figuro-accent" />,
    },
    {
      title: "Multiple Art Styles",
      description: "Choose from various art styles ranging from realistic to cartoon, anime, stylized and more.",
      icon: <Grid2X2 className="h-10 w-10 text-figuro-accent" />,
    },
    {
      title: "3D Export & Preview",
      description: "Preview your designs in real-time 3D and download them in standard formats ready for 3D printing.",
      icon: <Download className="h-10 w-10 text-figuro-accent" />,
    },
    {
      title: "Developer API",
      description: "Integrate our figurine generation capabilities into your own apps and services with our API.",
      icon: <Code className="h-10 w-10 text-figuro-accent" />,
    },
  ];

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gradient">Features</h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Discover how Figuro.AI is revolutionizing the creation of custom 3D figurines
              with our powerful and easy-to-use platform.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-gradient-to-b from-transparent to-figuro-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-panel rounded-xl p-8 md:p-12 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gradient">Advanced Technology</h2>
            <p className="text-white/70 mb-6">
              Our AI models are trained on millions of 3D designs to understand geometry, 
              textures, and artistic styles. This enables Figuro.AI to generate highly detailed
              and customized 3D figurines that are ready for printing with minimal post-processing.
            </p>
            <p className="text-white/70">
              The platform continuously learns from user interactions to improve the quality
              and accuracy of the generated models, making each creation better than the last.
            </p>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default FeaturesPage;
