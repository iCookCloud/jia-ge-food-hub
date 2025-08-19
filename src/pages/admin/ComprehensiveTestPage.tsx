import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TestTube2, Zap, Shield, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { E2ETestSuite } from '@/components/testing/E2ETestSuite';
import { PerformanceTestSuite } from '@/components/testing/PerformanceTestSuite';
import { DataIntegrityTestSuite } from '@/components/testing/DataIntegrityTestSuite';
import { UserExperienceTestSuite } from '@/components/testing/UserExperienceTestSuite';

/**
 * 综合测试页面 - 集成所有测试套件
 */
const ComprehensiveTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('e2e');

  const testSuites = [
    {
      id: 'e2e',
      name: '端到端测试',
      description: '功能完整性验证',
      icon: TestTube2,
      component: E2ETestSuite,
      color: 'text-blue-600'
    },
    {
      id: 'performance',
      name: '性能压力测试',
      description: '系统性能评估',
      icon: Zap,
      component: PerformanceTestSuite,
      color: 'text-yellow-600'
    },
    {
      id: 'integrity',
      name: '数据完整性测试',
      description: '数据安全性验证',
      icon: Shield,
      component: DataIntegrityTestSuite,
      color: 'text-green-600'
    },
    {
      id: 'ux',
      name: '用户体验测试',
      description: '界面体验评估',
      icon: Heart,
      component: UserExperienceTestSuite,
      color: 'text-red-600'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/management')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回管理中心
          </Button>
          <div>
            <h1 className="text-2xl font-bold">综合功能测试中心</h1>
            <p className="text-muted-foreground">Week 4 - 全面功能测试套件</p>
          </div>
        </div>

        {/* 测试概览 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TestTube2 className="h-5 w-5" />
              测试套件概览
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              根据Week 4路线图，完成系统的全面功能测试验证
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {testSuites.map((suite) => (
                <div 
                  key={suite.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    activeTab === suite.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setActiveTab(suite.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <suite.icon className={`h-5 w-5 ${suite.color}`} />
                    <h3 className="font-medium">{suite.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{suite.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 测试套件 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {testSuites.map((suite) => (
              <TabsTrigger 
                key={suite.id} 
                value={suite.id}
                className="flex items-center gap-2"
              >
                <suite.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{suite.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {testSuites.map((suite) => (
            <TabsContent key={suite.id} value={suite.id}>
              <suite.component />
            </TabsContent>
          ))}
        </Tabs>

        {/* 测试指南 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Week 4 测试执行指南</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">测试执行顺序建议：</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li><strong>端到端测试</strong>：验证所有核心业务流程正常运行</li>
                  <li><strong>数据完整性测试</strong>：确保数据安全和一致性</li>
                  <li><strong>性能压力测试</strong>：评估系统在高负载下的表现</li>
                  <li><strong>用户体验测试</strong>：验证界面友好性和可用性</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Week 4 目标验证：</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">功能完整性：</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>统一供应商概念实现</li>
                      <li>通知系统正常运行</li>
                      <li>实时更新机制有效</li>
                      <li>所有业务流程可用</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">质量标准：</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>性能指标达标</li>
                      <li>数据安全可靠</li>
                      <li>用户体验良好</li>
                      <li>系统稳定运行</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">测试完成标准：</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 所有核心流程测试通过</li>
                  <li>• 系统性能满足要求</li>
                  <li>• 数据安全与完整性验证</li>
                  <li>• 用户体验评分良好</li>
                  <li>• 无阻塞性问题遗留</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">注意事项：</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• 测试前确保系统处于稳定状态</li>
                  <li>• 性能测试可能产生系统负载</li>
                  <li>• 建议在非高峰时段进行压力测试</li>
                  <li>• 记录所有发现的问题和改进建议</li>
                  <li>• 及时修复发现的问题并重新测试</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ComprehensiveTestPage;