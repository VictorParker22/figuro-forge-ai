import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface ModelCreatorProps {
  username: string;
  avatarUrl?: string;
  published?: number;
  featured?: number;
  followers?: number;
  following?: number;
  createdAt?: string;
  onFollow?: () => void;
  isFollowing?: boolean;
}

const ModelCreator: React.FC<ModelCreatorProps> = ({ 
  username, 
  avatarUrl,
  published = 0,
  featured = 0,
  followers = 0,
  following = 0,
  createdAt,
  onFollow,
  isFollowing = false
}) => {
  // Get initials for avatar fallback
  const getInitials = () => {
    return username.substring(0, 2).toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <Card className="bg-black/50 border-white/10 w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-white/20">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback className="bg-figuro-accent text-white">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-medium">{username}</h3>
              {createdAt && (
                <div className="flex items-center text-white/50 text-xs">
                  <Clock size={12} className="mr-1" />
                  <span>{formatDate(createdAt)}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className={isFollowing ? "border-white/20 hover:bg-white/10" : "bg-figuro-accent hover:bg-figuro-accent-hover"}
            onClick={onFollow}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col">
            <span className="text-white font-medium">{published}</span>
            <span className="text-white/50 text-xs">Published</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium">{featured}</span>
            <span className="text-white/50 text-xs">Featured</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium">{followers}</span>
            <span className="text-white/50 text-xs">Followers</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium">{following}</span>
            <span className="text-white/50 text-xs">Following</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelCreator;