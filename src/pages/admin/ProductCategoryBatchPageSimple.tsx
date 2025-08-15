// 简化版产品批量分类管理页面
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';

const ProductCategoryBatchPageSimple: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 测试 useInfiniteProducts hook
  const { data: productsData, isLoading, error } = useInfiniteProducts({ 
    search: searchQuery,
    limit: 5 
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">产品批量分类管理</h1>
            <p className="text-muted-foreground mt-1">
              批量为产品分配分类，提高分类管理效率
            </p>
          </div>
        </div>
        
        {/* 搜索框 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Input
              placeholder="搜索产品名称、SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>
        
        {/* 产品列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              产品列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isLoading ? '加载中...' : error ? '加载错误' : '产品数据已加载'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                搜索内容: {searchQuery || '无'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                产品数量: {productsData ? productsData.pages.flatMap(p => p.data || []).length : 0}
              </p>
              {error && (
                <p className="text-xs text-red-500 mt-1">
                  错误信息: {error?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductCategoryBatchPageSimple;