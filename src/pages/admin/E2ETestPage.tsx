import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { E2ETestSuite } from '@/components/testing/E2ETestSuite';

/**
 * 端到端测试页面
 */
const E2ETestPage: React.FC = () => {
  const navigate = useNavigate();

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
            <h1 className="text-2xl font-bold">端到端测试套件</h1>
            <p className="text-muted-foreground">全面验证系统功能完整性</p>
          </div>
        </div>

        {/* E2E测试套件 */}
        <E2ETestSuite />
        
        {/* 使用指南 */}
        <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-semibold text-amber-900 mb-3">测试执行指南</h3>
          <div className="space-y-3 text-sm text-amber-800">
            <div>
              <h4 className="font-medium">测试准备：</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>确保系统正常运行，所有服务可用</li>
                <li>准备测试用户账户（普通用户和管理员）</li>
                <li>清理测试数据，确保测试环境干净</li>
                <li>打开开发者工具监控网络请求和控制台</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">测试执行：</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>按照优先级顺序执行测试（高→中→低）</li>
                <li>仔细阅读测试步骤，按顺序操作</li>
                <li>验证每个预期结果是否符合</li>
                <li>记录任何异常现象或错误信息</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">结果记录：</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>测试通过：所有预期结果都符合</li>
                <li>测试失败：任何预期结果不符合</li>
                <li>失败时请详细记录问题和重现步骤</li>
                <li>完成所有测试后生成测试报告</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-100 rounded">
            <p className="text-xs text-amber-700">
              <strong>重要提示</strong>：此测试套件是手动测试，需要人工验证每个步骤的结果。自动化测试工具将在后续版本中提供。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default E2ETestPage;