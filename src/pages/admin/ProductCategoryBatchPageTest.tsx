import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProductCategoryBatchPageTest: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">产品批量分类管理</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>测试页面</CardTitle>
          </CardHeader>
          <CardContent>
            <p>如果你能看到这个内容，说明基本页面结构正常。</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductCategoryBatchPageTest;