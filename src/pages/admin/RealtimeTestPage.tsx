import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RealtimeTestPanel } from '@/components/debug/RealtimeTestPanel';

/**
 * 实时更新测试页面
 */
const RealtimeTestPage: React.FC = () => {
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
            <h1 className="text-2xl font-bold">实时更新测试</h1>
            <p className="text-muted-foreground">测试通知系统和实时更新功能</p>
          </div>
        </div>

        {/* 测试面板 */}
        <RealtimeTestPanel />
        
        {/* 使用说明 */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">使用说明</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>自定义通知测试</strong>：发送自定义通知测试实时更新功能</li>
            <li>• <strong>预设场景测试</strong>：模拟真实业务场景的通知</li>
            <li>• <strong>实时更新验证</strong>：发送通知后应能立即在通知铃铛中看到</li>
            <li>• <strong>多端同步</strong>：可在多个浏览器标签页中测试同步效果</li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-xs text-blue-700">
              <strong>注意</strong>：此功能仅用于开发和测试，生产环境中应移除测试入口。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RealtimeTestPage;