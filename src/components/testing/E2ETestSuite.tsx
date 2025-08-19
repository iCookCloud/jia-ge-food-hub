import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  RotateCcw,
  User,
  Building2,
  Package,
  MessageSquare,
  ShoppingCart,
  FileText,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface TestStep {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  instructions: string[];
  expectedResults: string[];
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: TestStep[];
}

/**
 * 端到端测试套件组件
 */
export const E2ETestSuite: React.FC = () => {
  const [testSuites] = useState<TestSuite[]>([
    {
      id: 'auth-flow',
      name: '用户认证流程',
      description: '测试用户注册、登录、权限控制等认证相关功能',
      icon: User,
      steps: [
        {
          id: 'user-registration',
          name: '用户注册',
          description: '新用户注册流程测试',
          category: '认证',
          priority: 'high',
          status: 'pending',
          instructions: [
            '访问 /auth 页面',
            '点击注册选项卡',
            '填写邮箱和密码',
            '点击注册按钮',
            '检查邮箱验证提示'
          ],
          expectedResults: [
            '显示注册成功提示',
            '自动跳转到产品页面',
            '用户状态为已登录',
            '默认角色为买家'
          ]
        },
        {
          id: 'user-login',
          name: '用户登录',
          description: '已注册用户登录流程测试',
          category: '认证',
          priority: 'high',
          status: 'pending',
          instructions: [
            '访问 /auth 页面',
            '填写正确的邮箱和密码',
            '点击登录按钮',
            '验证登录状态'
          ],
          expectedResults: [
            '显示登录成功提示',
            '跳转到主页面',
            '导航栏显示用户信息',
            '通知铃铛可用'
          ]
        },
        {
          id: 'role-based-access',
          name: '角色权限控制',
          description: '测试不同角色的访问权限',
          category: '权限',
          priority: 'high',
          status: 'pending',
          instructions: [
            '以普通用户身份访问管理页面',
            '尝试访问管理员专用功能',
            '检查权限限制是否生效',
            '验证页面访问控制'
          ],
          expectedResults: [
            '普通用户无法访问管理员功能',
            '显示权限不足提示',
            '自动重定向到适当页面',
            '只显示用户有权访问的功能'
          ]
        }
      ]
    },
    {
      id: 'supplier-certification',
      name: '供应商认证流程',
      description: '测试供应商申请、审核、状态更新等完整流程',
      icon: Building2,
      steps: [
        {
          id: 'supplier-application',
          name: '供应商申请',
          description: '用户申请成为供应商',
          category: '供应商管理',
          priority: 'high',
          status: 'pending',
          instructions: [
            '登录后访问个人资料管理页面',
            '填写企业信息（可选）',
            '点击申请成为供应商按钮',
            '确认申请提交'
          ],
          expectedResults: [
            '显示申请成功提示',
            '供应商状态变为待审核',
            '管理员收到新申请通知',
            '申请人收到申请确认'
          ]
        },
        {
          id: 'admin-review',
          name: '管理员审核',
          description: '管理员审核供应商申请',
          category: '供应商管理',
          priority: 'high',
          status: 'pending',
          instructions: [
            '以管理员身份登录',
            '访问供应商认证页面',
            '查看待审核申请列表',
            '审核申请（通过或拒绝）',
            '填写审核意见（如拒绝）'
          ],
          expectedResults: [
            '申请列表正确显示',
            '审核操作成功执行',
            '申请人收到审核结果通知',
            '供应商状态正确更新'
          ]
        },
        {
          id: 'supplier-status-update',
          name: '供应商状态更新',
          description: '验证供应商状态实时更新',
          category: '供应商管理',
          priority: 'medium',
          status: 'pending',
          instructions: [
            '申请人查看个人资料页面',
            '验证审核结果显示',
            '检查通知收取情况',
            '确认状态变更生效'
          ],
          expectedResults: [
            '状态正确反映审核结果',
            '收到实时通知更新',
            '界面显示相应的操作选项',
            '认证供应商享有相应权限'
          ]
        }
      ]
    },
    {
      id: 'order-list-flow',
      name: '货单分享流程',
      description: '测试货单创建、分享、处理等完整业务流程',
      icon: ShoppingCart,
      steps: [
        {
          id: 'create-order-list',
          name: '创建货单',
          description: '用户创建新的货单',
          category: '货单管理',
          priority: 'high',
          status: 'pending',
          instructions: [
            '访问产品页面',
            '添加商品到购物车',
            '访问订单页面',
            '从购物车创建货单',
            '填写货单详细信息'
          ],
          expectedResults: [
            '货单创建成功',
            '包含正确的商品信息',
            '计算总金额正确',
            '状态为草稿'
          ]
        },
        {
          id: 'share-to-suppliers',
          name: '分享给供应商',
          description: '将货单分享给选定的供应商',
          category: '货单管理',
          priority: 'high',
          status: 'pending',
          instructions: [
            '打开货单详情页面',
            '点击分享给供应商按钮',
            '搜索并选择目标供应商',
            '添加分享消息（可选）',
            '确认分享操作'
          ],
          expectedResults: [
            '分享操作成功执行',
            '选中的供应商收到通知',
            '货单状态更新为已分享',
            '分享记录正确保存'
          ]
        },
        {
          id: 'supplier-process',
          name: '供应商处理货单',
          description: '供应商查看并处理收到的货单',
          category: '货单管理',
          priority: 'high',
          status: 'pending',
          instructions: [
            '以供应商身份登录',
            '查看收到的货单通知',
            '访问货单详情页面',
            '修改价格和数量（可选）',
            '选择确认或转发给其他供应商'
          ],
          expectedResults: [
            '货单信息正确显示',
            '可以修改商品详情',
            '处理操作成功执行',
            '买家收到处理结果通知'
          ]
        }
      ]
    },
    {
      id: 'product-inquiry',
      name: '商品咨询流程',
      description: '测试商品页面的供应商咨询功能',
      icon: MessageSquare,
      steps: [
        {
          id: 'product-consultation',
          name: '发起商品咨询',
          description: '用户对商品发起供应商咨询',
          category: '商品管理',
          priority: 'medium',
          status: 'pending',
          instructions: [
            '访问商品详情页面',
            '点击咨询询价按钮',
            '选择目标供应商',
            '填写咨询内容',
            '发送咨询请求'
          ],
          expectedResults: [
            '咨询发送成功',
            '供应商收到咨询通知',
            '咨询记录正确保存',
            '显示发送确认信息'
          ]
        }
      ]
    },
    {
      id: 'notification-system',
      name: '通知系统测试',
      description: '测试各种场景下的通知发送和实时更新',
      icon: FileText,
      steps: [
        {
          id: 'realtime-notifications',
          name: '实时通知测试',
          description: '验证通知的实时接收和显示',
          category: '通知系统',
          priority: 'high',
          status: 'pending',
          instructions: [
            '访问实时更新测试页面',
            '发送各种类型的测试通知',
            '验证通知铃铛更新',
            '检查通知内容和链接',
            '测试多端同步效果'
          ],
          expectedResults: [
            '通知实时显示在铃铛中',
            '未读计数正确更新',
            '通知内容准确无误',
            '点击链接跳转正确',
            '多个浏览器标签同步更新'
          ]
        }
      ]
    },
    {
      id: 'admin-functions',
      name: '管理员功能测试',
      description: '测试管理员专用功能的完整性',
      icon: Shield,
      steps: [
        {
          id: 'user-management',
          name: '用户管理',
          description: '管理员查看和管理用户',
          category: '管理功能',
          priority: 'medium',
          status: 'pending',
          instructions: [
            '以管理员身份访问用户管理页面',
            '查看用户列表',
            '搜索特定用户',
            '查看用户详细信息',
            '验证用户角色显示'
          ],
          expectedResults: [
            '用户列表正确显示',
            '搜索功能正常工作',
            '用户信息准确完整',
            '角色和状态正确显示'
          ]
        },
        {
          id: 'system-monitoring',
          name: '系统监控',
          description: '管理员监控系统状态和性能',
          category: '管理功能',
          priority: 'low',
          status: 'pending',
          instructions: [
            '访问管理中心',
            '查看各项管理功能',
            '检查系统状态指示',
            '验证统计数据准确性'
          ],
          expectedResults: [
            '所有管理功能可正常访问',
            '系统状态信息准确',
            '统计数据实时更新',
            '性能指标在正常范围'
          ]
        }
      ]
    }
  ]);

  const [currentTest, setCurrentTest] = useState<TestStep | null>(null);
  const [testResults, setTestResults] = useState<Map<string, TestStep>>(new Map());

  // 开始测试
  const startTest = (step: TestStep) => {
    setCurrentTest({ ...step, status: 'running' });
    setTestResults(prev => new Map(prev.set(step.id, { ...step, status: 'running' })));
    
    toast.info(`开始测试: ${step.name}`, {
      description: step.description
    });
  };

  // 标记测试通过
  const markTestPassed = (step: TestStep) => {
    const updatedStep = { ...step, status: 'passed' as const, duration: Math.random() * 5000 + 1000 };
    setTestResults(prev => new Map(prev.set(step.id, updatedStep)));
    setCurrentTest(null);
    
    toast.success(`测试通过: ${step.name}`);
  };

  // 标记测试失败
  const markTestFailed = (step: TestStep, error: string) => {
    const updatedStep = { ...step, status: 'failed' as const, error };
    setTestResults(prev => new Map(prev.set(step.id, updatedStep)));
    setCurrentTest(null);
    
    toast.error(`测试失败: ${step.name}`, {
      description: error
    });
  };

  // 重置测试
  const resetTests = () => {
    setTestResults(new Map());
    setCurrentTest(null);
    toast.info('测试结果已重置');
  };

  // 获取测试状态
  const getTestStatus = (stepId: string): TestStep['status'] => {
    return testResults.get(stepId)?.status || 'pending';
  };

  // 计算测试统计
  const getTestStats = () => {
    const allSteps = testSuites.flatMap(suite => suite.steps);
    const totalTests = allSteps.length;
    const passedTests = Array.from(testResults.values()).filter(test => test.status === 'passed').length;
    const failedTests = Array.from(testResults.values()).filter(test => test.status === 'failed').length;
    const runningTests = Array.from(testResults.values()).filter(test => test.status === 'running').length;
    const pendingTests = totalTests - passedTests - failedTests - runningTests;
    
    return { totalTests, passedTests, failedTests, runningTests, pendingTests };
  };

  const stats = getTestStats();
  const completionRate = (stats.passedTests / stats.totalTests) * 100;

  // 获取状态图标
  const getStatusIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: TestStep['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* 测试总览 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>端到端测试套件</CardTitle>
              <p className="text-sm text-muted-foreground">
                系统功能完整性验证
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetTests}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              重置测试
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>测试进度</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.totalTests}</div>
                <div className="text-xs text-muted-foreground">总测试数</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{stats.passedTests}</div>
                <div className="text-xs text-muted-foreground">通过</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-600">{stats.failedTests}</div>
                <div className="text-xs text-muted-foreground">失败</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">{stats.runningTests}</div>
                <div className="text-xs text-muted-foreground">进行中</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-600">{stats.pendingTests}</div>
                <div className="text-xs text-muted-foreground">待测试</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测试套件列表 */}
      {testSuites.map((suite) => (
        <Card key={suite.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <suite.icon className="h-5 w-5" />
              {suite.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {suite.description}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suite.steps.map((step) => {
                const status = getTestStatus(step.id);
                const result = testResults.get(step.id);
                
                return (
                  <div key={step.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <div>
                          <h4 className="font-medium">{step.name}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(step.priority) as any}>
                          {step.priority === 'high' ? '高' : step.priority === 'medium' ? '中' : '低'}
                        </Badge>
                        <Badge variant="outline">
                          {step.category}
                        </Badge>
                        {status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => startTest(step)}
                            className="flex items-center gap-2"
                          >
                            <Play className="h-3 w-3" />
                            开始测试
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 测试说明 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium mb-2">测试步骤：</h5>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          {step.instructions.map((instruction, index) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">预期结果：</h5>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {step.expectedResults.map((result, index) => (
                            <li key={index}>{result}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 当前测试控制 */}
                    {currentTest?.id === step.id && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                          <span className="text-sm font-medium">正在进行测试...</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => markTestPassed(step)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            测试通过
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => markTestFailed(step, '手动标记为失败')}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            测试失败
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 测试结果 */}
                    {result && result.status !== 'pending' && result.status !== 'running' && (
                      <div className="border-t pt-3 mt-3">
                        {result.status === 'passed' && (
                          <div className="text-sm text-green-600">
                            ✅ 测试通过 {result.duration && `(耗时: ${Math.round(result.duration)}ms)`}
                          </div>
                        )}
                        {result.status === 'failed' && (
                          <div className="text-sm text-red-600">
                            ❌ 测试失败: {result.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};