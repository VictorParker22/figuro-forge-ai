import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, Download, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModelInteractionProps {
  likes?: number;
  comments?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onSave?: () => void;
  isLiked?: boolean;
  isSaved?: boolean;
}

const ModelInteraction: React.FC<ModelInteractionProps> = ({ 
  likes = 0, 
  comments = 0,
  onLike,
  onComment,
  onShare,
  onDownload,
  onSave,
  isLiked = false,
  isSaved = false
}) => {
  const { toast } = useToast();

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Fallback if no custom handler
      if (navigator.share) {
        navigator.share({
          title: 'Check out this 3D model',
          text: 'I found this amazing 3D model on Figuro.AI',
          url: window.location.href,
        })
        .then(() => {
          toast({
            title: "Shared successfully",
          });
        })
        .catch((error) => {
          console.error('Error sharing:', error);
          toast({
            title: "Error sharing",
            description: "Could not share this model",
            variant: "destructive"
          });
        });
      } else {
        // Copy URL to clipboard as fallback
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "URL copied to clipboard",
          description: "Share this link with others"
        });
      }
    }
  };

  return (
    <Card className="bg-black/50 border-white/10 w-full">
      <CardContent className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-9 w-9 ${isLiked ? 'text-red-500' : 'text-white/70 hover:text-white'}`}
              onClick={onLike}
            >
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
            </Button>
            <span className="text-white/70 text-sm">{likes}</span>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-white/70 hover:text-white"
              onClick={onComment}
            >
              <MessageSquare size={18} />
            </Button>
            <span className="text-white/70 text-sm">{comments}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-white/70 hover:text-white"
              onClick={handleShare}
            >
              <Share2 size={18} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-white/70 hover:text-white"
              onClick={onDownload}
            >
              <Download size={18} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-9 w-9 ${isSaved ? 'text-figuro-accent' : 'text-white/70 hover:text-white'}`}
              onClick={onSave}
            >
              <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelInteraction;