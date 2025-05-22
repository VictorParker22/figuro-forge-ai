
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useModelUpload = (onFilesUpdated: () => void) => {
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const handleModelUpload = (url: string, file: File) => {
    setCustomModelUrl(url);
    setCustomModelFile(file);
    
    // Upload to storage 
    const uploadModel = async () => {
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `models/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('figurine-images')
          .upload(filePath, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('figurine-images')
          .getPublicUrl(filePath);
          
        toast({
          title: "Model uploaded",
          description: `Your 3D model has been uploaded to the gallery`,
        });
        
        // Refresh the gallery
        onFilesUpdated();
      } catch (error) {
        console.error('Error uploading model:', error);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your model",
          variant: "destructive"
        });
      }
    };
    
    uploadModel();
  };
  
  return {
    customModelUrl,
    customModelFile,
    handleModelUpload
  };
};
