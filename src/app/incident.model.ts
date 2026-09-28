export interface Incident {
  id?: number;
  service: string;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt?: string;
}