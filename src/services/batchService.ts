import { supabase } from '@/integrations/supabase/client';
import { handleApiError } from './api';

export interface BatchOperation {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any[];
  batchSize?: number;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  data?: any[];
}

export const batchService = {
  /**
   * 批量执行数据库操作
   */
  async executeBatch(operation: BatchOperation): Promise<ImportResult> {
    const { type, table, data, batchSize = 100 } = operation;
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      data: []
    };

    try {
      // 分批处理数据
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        let batchResult;
        switch (type) {
          case 'INSERT':
            batchResult = await (supabase as any).from(table).insert(batch).select();
            break;
          case 'UPDATE':
            // 批量更新需要特殊处理，这里简化为单个更新
            const updatePromises = batch.map(item => 
              (supabase as any).from(table).update(item).eq('id', item.id)
            );
            batchResult = await Promise.allSettled(updatePromises);
            break;
          case 'DELETE':
            const deletePromises = batch.map(item => 
              (supabase as any).from(table).delete().eq('id', item.id)
            );
            batchResult = await Promise.allSettled(deletePromises);
            break;
          default:
            throw new Error(`Unsupported operation type: ${type}`);
        }

        if (type === 'INSERT') {
          if (batchResult.error) {
            result.failed += batch.length;
            result.errors.push(`Batch ${i / batchSize + 1}: ${handleApiError(batchResult.error)}`);
          } else {
            result.success += batch.length;
            if (batchResult.data) {
              result.data?.push(...batchResult.data);
            }
          }
        } else {
          // 处理 UPDATE 和 DELETE 的 Promise.allSettled 结果
          const settled = batchResult as PromiseSettledResult<any>[];
          settled.forEach((settledResult, index) => {
            if (settledResult.status === 'fulfilled') {
              result.success += 1;
            } else {
              result.failed += 1;
              result.errors.push(`Item ${i + index + 1}: ${settledResult.reason}`);
            }
          });
        }
      }

      return result;
    } catch (error) {
      result.failed = data.length;
      result.errors.push(handleApiError(error as Error));
      return result;
    }
  },

  /**
   * 批量导入商品
   */
  async importProducts(productsData: any[]): Promise<ImportResult> {
    // 数据验证和格式化
    const validatedData = productsData.map(product => ({
      id: product.id || crypto.randomUUID(),
      sku: product.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      standard_chinese_name: product.standard_chinese_name || null,
      standard_english_name: product.standard_english_name || null,
      category_chinese: product.category_chinese || null,
      category_english: product.category_english || null,
      unit_price: product.unit_price?.toString() || null,
      unit: product.unit || null,
      specifications: product.specifications || null,
      vendor: product.vendor || null,
      is_active: product.is_active !== false,
      user_id: product.user_id, // 必须提供用户ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    return this.executeBatch({
      type: 'INSERT',
      table: 'products',
      data: validatedData
    });
  },

  /**
   * 批量更新产品价格
   */
  async updateProductPrices(updates: Array<{ id: string; unit_price: string }>): Promise<ImportResult> {
    const updateData = updates.map(update => ({
      id: update.id,
      unit_price: update.unit_price,
      updated_at: new Date().toISOString()
    }));

    return this.executeBatch({
      type: 'UPDATE',
      table: 'products',
      data: updateData
    });
  },

  /**
   * 批量导入供应商
   */
  async importSuppliers(suppliersData: any[]): Promise<ImportResult> {
    const validatedData = suppliersData.map(supplier => ({
      id: supplier.id || crypto.randomUUID(),
      user_id: supplier.user_id, // 必须提供用户ID
      company_name: supplier.company_name,
      contact_person: supplier.contact_person,
      contact_phone: supplier.contact_phone,
      contact_email: supplier.contact_email,
      business_license: supplier.business_license || null,
      verification_status: supplier.verification_status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    return this.executeBatch({
      type: 'INSERT',
      table: 'supplier_credentials',
      data: validatedData
    });
  },

  /**
   * 导出数据为CSV格式
   */
  async exportToCSV(tableName: string, filters = {}, columns?: string[]): Promise<{ data: string; error: string | null }> {
    try {
      let query = (supabase as any).from(tableName).select(columns?.join(',') || '*');

      // 应用过滤器
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) {
        return { data: '', error: handleApiError(error) };
      }

      if (!data || data.length === 0) {
        return { data: '', error: '没有数据可导出' };
      }

      // 转换为CSV格式
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header];
          // 处理包含逗号、引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      );

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      return { data: csvContent, error: null };
    } catch (error) {
      return { data: '', error: handleApiError(error as Error) };
    }
  },

  /**
   * 解析CSV数据
   */
  parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: any = {};
      
      headers.forEach((header, index) => {
        let value = values[index]?.trim() || '';
        
        // 处理引号包围的值
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/""/g, '"');
        }
        
        row[header] = value;
      });
      
      data.push(row);
    }

    return data;
  },

  /**
   * 批量删除记录
   */
  async batchDelete(tableName: string, ids: string[]): Promise<ImportResult> {
    const deleteData = ids.map(id => ({ id }));
    
    return this.executeBatch({
      type: 'DELETE',
      table: tableName,
      data: deleteData
    });
  },

  /**
   * 获取批量操作模板
   */
  getImportTemplate(type: 'products' | 'suppliers'): Record<string, any> {
    const templates = {
      products: {
        sku: 'SKU-EXAMPLE-001',
        standard_chinese_name: '示例商品名称',
        standard_english_name: 'Example Product Name',
        category_chinese: '示例分类',
        category_english: 'Example Category',
        unit_price: '99.99',
        unit: '件',
        specifications: '规格说明',
        vendor: '供应商名称'
      },
      suppliers: {
        company_name: '示例公司名称',
        contact_person: '联系人姓名',
        contact_phone: '13800138000',
        contact_email: 'contact@example.com',
        business_license: '营业执照号码'
      }
    };

    return templates[type];
  }
};