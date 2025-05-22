
export interface BucketImage {
  name: string;
  url: string;
  id: string;
  created_at: string;
  fullPath?: string;
  type: 'image' | '3d-model';
}
