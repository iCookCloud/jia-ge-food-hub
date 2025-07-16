import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  profile?: {
    nickname: string | null;
    avatar_url: string | null;
  };
}

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_credentials')
        .select(`
          *,
          profiles!supplier_credentials_user_id_fkey (
            nickname,
            avatar_url
          )
        `)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as SupplierWithProfile[];
    },
  });
};

export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_credentials')
        .select(`
          *,
          profiles!supplier_credentials_user_id_fkey (
            nickname,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as SupplierWithProfile;
    },
    enabled: !!id,
  });
};