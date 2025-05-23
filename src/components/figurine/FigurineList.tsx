
import React from 'react';
import { Figurine } from '@/types/figurine';
import FigurineCard from './FigurineCard';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface FigurineListProps {
  figurines: Figurine[];
  loading: boolean;
  error: string | null;
  onDownload: (figurine: Figurine) => void;
  onViewModel: (figurine: Figurine) => void;
  onTogglePublish?: (figurine: Figurine) => void;
  onUploadModel?: (figurine: Figurine) => void;
}

const FigurineList = ({ 
  figurines, 
  loading, 
  error, 
  onDownload, 
  onViewModel,
  onTogglePublish,
  onUploadModel
}: FigurineListProps) => {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-10 px-4 bg-red-900/20 rounded-lg border border-red-900/30">
        <p className="text-destructive font-medium mb-2">Error</p>
        <p className="text-white/70">{error}</p>
      </div>
    );
  }

  if (figurines.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {figurines.map((figurine) => (
        <div key={figurine.id}>
          <FigurineCard
            figurine={figurine}
            onDownload={onDownload}
            onViewModel={onViewModel}
            onTogglePublish={onTogglePublish}
            onUploadModel={onUploadModel}
          />
        </div>
      ))}
    </div>
  );
};

export default FigurineList;
