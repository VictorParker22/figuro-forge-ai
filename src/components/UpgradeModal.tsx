
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface UpgradeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actionType: "image_generation" | "model_conversion";
}

const UpgradeModal = ({
  isOpen,
  onOpenChange,
  title = "Upgrade Your Plan",
  description,
  actionType,
}: UpgradeModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = () => {
    // If user is not authenticated, send to login page first
    if (!user) {
      onOpenChange(false);
      navigate("/auth");
      return;
    }
    
    onOpenChange(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || (actionType === "image_generation"
              ? "You've reached your monthly limit for image generations."
              : "You've reached your monthly limit for 3D model conversions.")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4">
            Upgrade your plan to continue creating amazing figurines. Our paid plans offer:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>More monthly image generations</li>
            <li>Additional 3D model conversions</li>
            <li>Higher resolution outputs</li>
            <li>Advanced art styles</li>
            {actionType === "model_conversion" && (
              <li>Priority rendering for faster conversion</li>
            )}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgrade} 
            className="bg-figuro-accent hover:bg-figuro-accent-hover"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "View Pricing Plans"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
