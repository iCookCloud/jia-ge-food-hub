import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  name: string;
  price: string;
  unit: string;
  image?: string;
  specifications?: string;
  supplier: {
    name: string;
    verified: boolean;
  };
  quantity: number;
}

export const productListService = {
  // 从购物车创建货单
  createFromCart: async (cartItems: CartItem[], name: string) => {
    try {
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.price) * item.quantity), 0
      );

      // 创建货单
      const { data: productList, error: listError } = await supabase
        .from('product_lists')
        .insert({
          name,
          total_amount: totalAmount,
          status: 'draft',
          share_code: Math.random().toString(36).substr(2, 8).toUpperCase(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (listError) {
        return { data: null, error: listError };
      }

      // 创建货单商品项
      const items = cartItems.map(item => ({
        product_list_id: productList.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        position: 0
      }));

      const { error: itemsError } = await supabase
        .from('product_list_items')
        .insert(items);

      if (itemsError) {
        return { data: null, error: itemsError };
      }

      return { data: productList, error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // 获取用户的货单列表
  getUserProductLists: async () => {
    try {
      const { data, error } = await supabase
        .from('product_lists')
        .select(`
          *,
          product_list_items (
            id,
            product_id,
            quantity,
            unit_price,
            products (
              standard_chinese_name,
              unit
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error };
      }

      // 转换数据格式以匹配UI期望的格式
      const formattedData = data?.map(list => ({
        ...list,
        items: list.product_list_items?.map(item => ({
          name: item.products?.standard_chinese_name || item.product_id,
          quantity: item.quantity,
          price: item.unit_price
        })) || []
      })) || [];

      return { data: formattedData, error: null };
    } catch (error) {
      return { data: [], error: error as any };
    }
  },

  // 获取单个货单详情
  getProductList: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('product_lists')
        .select(`
          *,
          product_list_items (
            id,
            product_id,
            quantity,
            unit_price,
            products (
              standard_chinese_name,
              unit
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // 更新货单状态
  updateStatus: async (id: string, status: 'draft' | 'shared' | 'expired') => {
    try {
      const { data, error } = await supabase
        .from('product_lists')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  }
};