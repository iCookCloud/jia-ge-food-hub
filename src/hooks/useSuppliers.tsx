import { useQuery } from '@tanstack/react-query';
import { supplierService } from '@/services/api';

export interface Supplier {
  id: string;
  user_id: string;
  company_name: string;
  business_license: string | null;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  verification_status: string;
  verification_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierWithProfile extends Supplier {
  profiles?: {
    nickname: string | null;
    avatar_url: string | null;
  };
}

export const useSuppliers = (filters = {}, pagination = {}) => {
  return useQuery({
    queryKey: ['suppliers', filters, pagination],
    queryFn: async () => {
      const result = await supplierService.getAll(filters, pagination);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return (result.data || []) as any[];
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};

export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const result = await supplierService.getById(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data as any;
    },
    enabled: !!id,
  });
};