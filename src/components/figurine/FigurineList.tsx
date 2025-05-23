
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
    return <div className="text-center text-destructive py-8">{error}</div>;
  }

  if (figurines.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {figurines.map((figurine) => (
        <div key={figurine.id} className="h-full">
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
