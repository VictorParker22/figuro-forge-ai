
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Text to Figurine",
    description: "Describe your idea in plain text, and watch as our AI transforms it into a detailed figurine design.",
    icon: "✨",
  },
  {
    title: "Multiple Art Styles",
    description: "Choose from a variety of art styles including Isometric, Anime, Pixar, Steampunk, and more.",
    icon: "🎨",
  },
  {
    title: "3D Model Generation",
    description: "Convert your 2D designs into 3D models ready for viewing or printing.",
    icon: "🧊",
  },
  {
    title: "Download & Print",
    description: "Download your creations as STL or OBJ files compatible with any 3D printer.",
    icon: "🖨️",
  },
];

const Features = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <section className="py-24 relative">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">How It Works</h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Creating custom figurines has never been easier. Our AI-powered platform handles the complex work, so you can focus on your creativity.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="bg-white/5 border-white/10 overflow-hidden relative h-full">
                <span className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-figuro-accent to-figuro-light" />
                <CardHeader>
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
