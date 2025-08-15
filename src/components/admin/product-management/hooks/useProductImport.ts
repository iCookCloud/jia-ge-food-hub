import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Global ERP 商品数据类型
interface GlobalErpProduct {
  id: string;
  sku: string;
  standard_chinese_name: string;
  standard_english_name?: string | null;
  price?: number | null;
  specifications?: string | null;
  main_image_url?: string | null;
  is_active: boolean;
  category_name?: string | null;
  supplier_name?: string | null;
  updated_at: string;
}

// 导入结果类型
interface ImportResult {
  productId: string;
  success: boolean;
  error?: string;
  localProductId?: string;
}

// 生成产品ID的策略
const generateProductId = (sourceType: string, sourceId: string): string => {
  if (sourceType === 'global_erp') {
    // 为Global ERP商品添加前缀避免ID冲突
    return `global_erp_${sourceId}`;
  }
  return crypto.randomUUID();
};

// 将Global ERP商品转换为本地商品格式
const convertGlobalToLocalProduct = (globalProduct: GlobalErpProduct) => ({
  // 使用混合ID策略
  id: generateProductId('global_erp', globalProduct.id),
  
  // 字段映射
  sku: globalProduct.sku,
  standard_chinese_name: globalProduct.standard_chinese_name,
  standard_english_name: globalProduct.standard_english_name,
  unit_price: globalProduct.price?.toString() || null,
  product_image: globalProduct.main_image_url,
  specifications: globalProduct.specifications,
  
  // 来源信息
  source_type: 'global_erp',
  source_id: globalProduct.id,
  last_sync_at: new Date().toISOString(),
  
  // 审核信息 - Global ERP商品默认已审核
  review_status: 'approved',
  review_notes: null,
  reviewed_at: null,
  reviewed_by: null,
  
  // 本地字段默认值
  user_id: null,
  is_public: true,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  
  // 其他字段设为null
  category_chinese: null,
  category_english: null,
  category_id: null,
  ctn: null,
  dimensions_cm: null,
  outer_box_dimensions: null,
  outer_size_cm: null,
  package_outer_size: null,
  price: null,
  quantity: null,
  remarks: null,
  requires_cold_chain: null,
  requires_fda_label: null,
  specification: null,
  storage_requirements: null,
  subcategory: null,
  type: null,
  unit: null,
  vendor: null,
  Vendor: null,
  volume_cbm: null,
  is_fragile: null
});

export const useProductImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importProgress, setImportProgress] = useState<Map<string, 'pending' | 'importing' | 'success' | 'error'>>(new Map());

  // 单个商品导入
  const importSingleProduct = async (globalProduct: GlobalErpProduct): Promise<ImportResult> => {
    try {
      const localProduct = convertGlobalToLocalProduct(globalProduct);
      
      // 检查是否已存在
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('source_type', 'global_erp')
        .eq('source_id', globalProduct.id)
        .single();
      
      if (existingProduct) {
        throw new Error('该商品已存在于本地库中');
      }
      
      // 插入到本地products表
      const { error, data } = await supabase
        .from('products')
        .insert(localProduct)
        .select('id')
        .single();
      
      if (error) throw error;
      
      return {
        productId: globalProduct.id,
        success: true,
        localProductId: data.id
      };
    } catch (error) {
      return {
        productId: globalProduct.id,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  // 批量导入mutation
  const importMutation = useMutation({
    mutationFn: async (products: GlobalErpProduct[]): Promise<ImportResult[]> => {
      const results: ImportResult[] = [];
      
      for (const product of products) {
        // 更新进度状态
        setImportProgress(prev => new Map(prev).set(product.id, 'importing'));
        
        const result = await importSingleProduct(product);
        results.push(result);
        
        // 更新完成状态
        setImportProgress(prev => new Map(prev).set(product.id, result.success ? 'success' : 'error'));
        
        // 添加小延迟避免过快请求
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      toast({
        title: "导入完成",
        description: `成功导入 ${successCount} 个商品${errorCount > 0 ? `，${errorCount} 个失败` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });
      
      // 刷新产品列表
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-products'] });
    },
    onError: (error) => {
      console.error('批量导入失败:', error);
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  });

  // 重置导入进度
  const resetImportProgress = () => {
    setImportProgress(new Map());
  };

  // 初始化导入进度
  const initializeImportProgress = (productIds: string[]) => {
    const progress = new Map<string, 'pending' | 'importing' | 'success' | 'error'>();
    productIds.forEach(id => progress.set(id, 'pending'));
    setImportProgress(progress);
  };

  return {
    // 导入函数
    importProducts: importMutation.mutate,
    importProductsAsync: importMutation.mutateAsync,
    
    // 状态
    isImporting: importMutation.isPending,
    importError: importMutation.error,
    importProgress,
    
    // 工具函数
    resetImportProgress,
    initializeImportProgress,
    
    // 单个商品导入（用于测试或特殊情况）
    importSingleProduct
  };
};