
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing = () => {
  // Pricing plan data
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Get started with basic figurine creation",
      features: [
        "5 figurine creations per month",
        "Basic art styles",
        "Standard resolution",
        "Community support"
      ],
      buttonText: "Start Free",
      buttonVariant: "outline",
      popular: false
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "For enthusiasts and hobbyists",
      features: [
        "50 figurine creations per month",
        "All art styles",
        "High resolution",
        "Priority support",
        "Commercial usage"
      ],
      buttonText: "Subscribe",
      buttonVariant: "default",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      description: "For professional studios and businesses",
      features: [
        "Unlimited figurine creations",
        "Custom art styles",
        "Ultra high resolution",
        "Dedicated support",
        "API access",
        "Custom branding"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline",
      popular: false
    }
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
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gradient">Pricing Plans</h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. All plans include access to our AI-powered figurine generation platform.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-panel rounded-xl p-8 relative ${plan.popular ? 'border-figuro-accent' : 'border-white/10'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 right-8 bg-figuro-accent text-white text-sm font-medium py-1 px-3 rounded-full">
                    Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-end mb-2">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/70 ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-white/70">{plan.description}</p>
                </div>
                
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="mr-2 h-5 w-5 text-figuro-accent shrink-0" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-figuro-accent hover:bg-figuro-accent-hover' : ''}`}
                  variant={plan.buttonVariant === "outline" ? "outline" : "default"}
                >
                  {plan.buttonText}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-gradient-to-b from-transparent to-figuro-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-panel rounded-xl p-8 md:p-12 max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gradient">Need a custom solution?</h2>
                <p className="text-white/70">
                  Contact our team for customized pricing and solutions tailored to your specific requirements.
                </p>
              </div>
              <Button className="whitespace-nowrap bg-figuro-accent hover:bg-figuro-accent-hover">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Pricing;
