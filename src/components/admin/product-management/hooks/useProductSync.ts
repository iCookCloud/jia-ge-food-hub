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

// 本地商品数据类型（包含同步相关字段）
interface LocalProduct {
  id: string;
  source_type?: string | null;
  source_id?: string | null;
  last_sync_at?: string | null;
  standard_chinese_name?: string | null;
  standard_english_name?: string | null;
  specifications?: string | null;
  product_image?: string | null;
  unit_price?: string | null;
  // 保留的本地字段不同步
  is_active?: boolean | null;
  // ... 其他字段
}

// 同步结果类型
interface SyncResult {
  productId: string;
  success: boolean;
  error?: string;
  changes?: string[];
}

// 同步配置
interface SyncConfig {
  syncBasicInfo: boolean;      // 同步基础信息（名称、规格）
  syncImages: boolean;         // 同步图片
  syncPricing: boolean;        // 同步价格（可选，默认保留本地价格）
  preserveLocalChanges: boolean; // 保留本地修改
}

// 默认同步配置
const DEFAULT_SYNC_CONFIG: SyncConfig = {
  syncBasicInfo: true,
  syncImages: true,
  syncPricing: false,  // 默认不同步价格，保留本地价格
  preserveLocalChanges: true
};

// 模拟从Global ERP获取商品数据
const fetchGlobalProductById = async (sourceId: string): Promise<GlobalErpProduct | null> => {
  // 这里应该调用实际的Global ERP API
  // 现在返回模拟数据
  try {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟数据
    const mockData: GlobalErpProduct = {
      id: sourceId,
      sku: `ERP-${sourceId.toUpperCase()}`,
      standard_chinese_name: '同步更新后的商品名称',
      standard_english_name: 'Updated Product Name',
      price: Math.round(Math.random() * 100 * 100) / 100,
      specifications: '同步更新后的规格说明',
      main_image_url: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af?w=400',
      is_active: true,
      category_name: '更新分类',
      supplier_name: '供应商',
      updated_at: new Date().toISOString()
    };
    
    return mockData;
  } catch (error) {
    console.error('获取Global ERP商品数据失败:', error);
    return null;
  }
};

// 比较字段变化
const compareFields = (local: Record<string, unknown>, global: Record<string, unknown>, field: string): boolean => {
  const localValue = local[field];
  const globalValue = global[field];
  
  // 处理null和undefined的比较
  if (localValue === null || localValue === undefined) {
    return globalValue !== null && globalValue !== undefined;
  }
  
  return localValue !== globalValue;
};

// 生成同步更新数据
const generateSyncUpdateData = (
  localProduct: LocalProduct,
  globalProduct: GlobalErpProduct,
  config: SyncConfig
) => {
  const updateData: Partial<LocalProduct> = {
    last_sync_at: new Date().toISOString()
  };
  
  const changes: string[] = [];
  
  // 同步基础信息
  if (config.syncBasicInfo) {
    if (compareFields(localProduct, globalProduct, 'standard_chinese_name')) {
      updateData.standard_chinese_name = globalProduct.standard_chinese_name;
      changes.push('中文名称');
    }
    
    if (compareFields(localProduct, globalProduct, 'standard_english_name')) {
      updateData.standard_english_name = globalProduct.standard_english_name;
      changes.push('英文名称');
    }
    
    if (compareFields(localProduct, globalProduct, 'specifications')) {
      updateData.specifications = globalProduct.specifications;
      changes.push('规格说明');
    }
  }
  
  // 同步图片
  if (config.syncImages) {
    if (compareFields(localProduct, globalProduct, 'product_image')) {
      updateData.product_image = globalProduct.main_image_url;
      changes.push('商品图片');
    }
  }
  
  // 同步价格（可选）
  if (config.syncPricing) {
    const globalPrice = globalProduct.price?.toString();
    if (compareFields(localProduct, globalProduct, 'unit_price')) {
      updateData.unit_price = globalPrice;
      changes.push('价格');
    }
  }
  
  return { updateData, changes };
};

export const useProductSync = (config: SyncConfig = DEFAULT_SYNC_CONFIG) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncProgress, setSyncProgress] = useState<Map<string, 'pending' | 'syncing' | 'success' | 'error'>>(new Map());

  // 单个商品同步
  const syncSingleProduct = async (productId: string): Promise<SyncResult> => {
    try {
      // 获取本地商品信息
      const { data: localProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 检查是否为Global ERP来源的商品
      if (localProduct.source_type !== 'global_erp' || !localProduct.source_id) {
        throw new Error('该商品不是从Global ERP导入，无法同步');
      }
      
      // 从Global ERP获取最新数据
      const globalProduct = await fetchGlobalProductById(localProduct.source_id);
      if (!globalProduct) {
        throw new Error('无法从Global ERP获取商品数据');
      }
      
      // 生成同步更新数据
      const { updateData, changes } = generateSyncUpdateData(
        localProduct,
        globalProduct,
        config
      );
      
      // 如果没有变化，直接返回成功
      if (changes.length === 0) {
        return {
          productId,
          success: true,
          changes: ['无变化']
        };
      }
      
      // 执行更新
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);
      
      if (updateError) throw updateError;
      
      return {
        productId,
        success: true,
        changes
      };
    } catch (error) {
      return {
        productId,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  // 批量同步mutation
  const syncMutation = useMutation({
    mutationFn: async (productIds: string[]): Promise<SyncResult[]> => {
      const results: SyncResult[] = [];
      
      for (const productId of productIds) {
        // 更新进度状态
        setSyncProgress(prev => new Map(prev).set(productId, 'syncing'));
        
        const result = await syncSingleProduct(productId);
        results.push(result);
        
        // 更新完成状态
        setSyncProgress(prev => new Map(prev).set(productId, result.success ? 'success' : 'error'));
        
        // 添加小延迟避免过快请求
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      const totalChanges = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.changes?.length || 0), 0);
      
      toast({
        title: "同步完成",
        description: `成功同步 ${successCount} 个商品，更新 ${totalChanges} 个字段${errorCount > 0 ? `，${errorCount} 个失败` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });
      
      // 刷新产品列表
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-products'] });
    },
    onError: (error) => {
      console.error('批量同步失败:', error);
      toast({
        title: "同步失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  });

  // 重置同步进度
  const resetSyncProgress = () => {
    setSyncProgress(new Map());
  };

  // 初始化同步进度
  const initializeSyncProgress = (productIds: string[]) => {
    const progress = new Map<string, 'pending' | 'syncing' | 'success' | 'error'>();
    productIds.forEach(id => progress.set(id, 'pending'));
    setSyncProgress(progress);
  };

  // 检查商品是否可同步
  const canSyncProduct = (product: LocalProduct): boolean => {
    return product.source_type === 'global_erp' && !!product.source_id;
  };

  // 获取上次同步时间
  const getLastSyncTime = (product: LocalProduct): Date | null => {
    return product.last_sync_at ? new Date(product.last_sync_at) : null;
  };

  // 检查是否需要同步（根据时间判断）
  const needsSync = (product: LocalProduct, thresholdHours: number = 24): boolean => {
    if (!canSyncProduct(product)) return false;
    
    const lastSync = getLastSyncTime(product);
    if (!lastSync) return true;
    
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceSync >= thresholdHours;
  };

  return {
    // 同步函数
    syncProducts: syncMutation.mutate,
    syncProductsAsync: syncMutation.mutateAsync,
    syncSingleProduct,
    
    // 状态
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    syncProgress,
    
    // 工具函数
    resetSyncProgress,
    initializeSyncProgress,
    canSyncProduct,
    getLastSyncTime,
    needsSync,
    
    // 配置
    syncConfig: config
  };
};