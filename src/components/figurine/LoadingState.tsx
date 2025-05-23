
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingState = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="glass-panel">
          <CardHeader>
            <Skeleton className="h-6 w-2/3 bg-white/5" />
          </CardHeader>
          <CardContent>
            <div className="aspect-square w-full">
              <Skeleton className="h-full w-full bg-white/5 loading-shine" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LoadingState;
