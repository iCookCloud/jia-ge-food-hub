import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocalProductManagement, LocalProductManagementRef } from '@/components/admin/product-management/LocalProductManagement';
import { GlobalErpProductSelection } from '@/components/admin/product-management/GlobalErpProductSelection';
import { 
  Package,
  Globe,
  Settings
} from 'lucide-react';

const ProductManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('local');
  const localProductManagementRef = useRef<LocalProductManagementRef>(null);

  // Tab切换处理
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // 切换到本地商品管理时刷新数据
    if (value === 'local') {
      // 延迟调用，等待组件完全挂载
      setTimeout(() => {
        if (localProductManagementRef.current) {
          localProductManagementRef.current.refetch();
        }
      }, 100);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">商品管理</h1>
          <p className="text-muted-foreground mt-1">
            管理本地商品和从第三方系统导入商品
          </p>
        </div>

        {/* Tab 导航 */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              本地商品管理
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              第三方商品选择
            </TabsTrigger>
          </TabsList>

          {/* 本地商品管理 */}
          <TabsContent value="local" className="mt-6">
            <LocalProductManagement ref={localProductManagementRef} />
          </TabsContent>

          {/* 第三方商品选择 */}
          <TabsContent value="global" className="mt-6">
            <GlobalErpProductSelection />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProductManagementPage;