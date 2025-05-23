
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Image } from "lucide-react";

interface GenerationCounterProps {
  className?: string;
}

const GenerationCounter: React.FC<GenerationCounterProps> = ({ className }) => {
  const [count, setCount] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Fetch the initial count
    const fetchInitialCount = async () => {
      try {
        const { data, error } = await supabase
          .from('stats')
          .select('count')
          .eq('id', 'image_generations')
          .maybeSingle();

        if (data && !error) {
          setCount(data.count);
        } else if (error) {
          console.error("Error fetching generation count:", error);
        }
      } catch (err) {
        console.error("Failed to fetch generation count:", err);
      }
    };

    fetchInitialCount();

    // Set up real-time subscription with error handling
    try {
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', 
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'stats',
            filter: 'id=eq.image_generations'
          }, 
          (payload) => {
            if (payload && payload.new && typeof payload.new.count === 'number') {
              const newCount = payload.new.count;
              
              // Only animate if the count actually increased
              if (newCount > count) {
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), 1000);
                setCount(newCount);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.warn('Could not subscribe to realtime updates:', status);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Failed to set up real-time subscription:", err);
    }
  }, [count]);

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
        <Image size={18} className="text-figuro-accent mr-2" />
        <div className="flex items-baseline">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={count}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`text-xl font-bold ${isAnimating ? 'text-figuro-accent' : 'text-white'}`}
            >
              {count.toLocaleString()}
            </motion.span>
          </AnimatePresence>
          <span className="ml-2 text-white/70 text-sm">images generated</span>
        </div>
      </div>
    </div>
  );
};

export default GenerationCounter;
