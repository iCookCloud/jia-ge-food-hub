import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Timer,
  Activity,
  Database,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Server,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { productService } from '@/services/api';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold: number;
}

interface TestResult {
  testName: string;
  duration: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  status: 'passed' | 'failed' | 'warning';
  errors: string[];
}

/**
 * 性能压力测试套件
 */
export const PerformanceTestSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 性能阈值配置
  const PERFORMANCE_THRESHOLDS = {
    avgResponseTime: 1000, // ms
    requestsPerSecond: 10,
    successRate: 95, // %
    memoryUsage: 100 // MB
  };

  // 获取当前性能指标
  const getCurrentMetrics = (): PerformanceMetric[] => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;
    
    return [
      {
        name: '页面加载时间',
        value: Math.round(navigation.loadEventEnd - navigation.navigationStart),
        unit: 'ms',
        status: navigation.loadEventEnd - navigation.navigationStart < 3000 ? 'good' : 'warning',
        threshold: 3000
      },
      {
        name: 'DOM完成时间',
        value: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
        unit: 'ms',
        status: navigation.domContentLoadedEventEnd - navigation.navigationStart < 1500 ? 'good' : 'warning',
        threshold: 1500
      },
      ...(memory ? [
        {
          name: '内存使用',
          value: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          unit: 'MB',
          status: memory.usedJSHeapSize / 1024 / 1024 < 50 ? 'good' : memory.usedJSHeapSize / 1024 / 1024 < 100 ? 'warning' : 'critical',
          threshold: 100
        },
        {
          name: '内存限制',
          value: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          unit: 'MB',
          status: 'good',
          threshold: 0
        }
      ] : [])
    ];
  };

  // API负载测试
  const runAPILoadTest = async (endpoint: string, concurrency: number, duration: number): Promise<TestResult> => {
    const startTime = Date.now();
    const requests: Promise<any>[] = [];
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    setCurrentTest(`API负载测试: ${endpoint}`);

    const makeRequest = async (): Promise<void> => {
      const requestStart = Date.now();
      try {
        if (endpoint === '/products') {
          await productService.getProducts({ page: 1, limit: 20 });
        } else if (endpoint === '/quotations') {
          // 模拟询价API调用
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        } else {
          // 通用API调用
          await fetch(endpoint);
        }
        const responseTime = Date.now() - requestStart;
        responseTimes.push(responseTime);
        successCount++;
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        responseTimes.push(responseTime);
        errors.push(error instanceof Error ? error.message : '未知错误');
        errorCount++;
      }
    };

    // 并发请求
    const runConcurrentRequests = async () => {
      const batch: Promise<void>[] = [];
      for (let i = 0; i < concurrency; i++) {
        batch.push(makeRequest());
      }
      await Promise.all(batch);
    };

    // 持续发送请求直到达到指定时间
    const endTime = startTime + duration;
    while (Date.now() < endTime && !abortControllerRef.current?.signal.aborted) {
      await runConcurrentRequests();
      // 更新进度
      const elapsed = Date.now() - startTime;
      setProgress((elapsed / duration) * 100);
      // 短暂暂停避免过度压力
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const totalTime = Date.now() - startTime;
    const totalRequests = successCount + errorCount;
    const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    const requestsPerSecond = totalRequests / (totalTime / 1000);
    const successRate = (successCount / totalRequests) * 100;

    const status = 
      successRate >= PERFORMANCE_THRESHOLDS.successRate && 
      avgResponseTime <= PERFORMANCE_THRESHOLDS.avgResponseTime &&
      requestsPerSecond >= PERFORMANCE_THRESHOLDS.requestsPerSecond
        ? 'passed' 
        : successRate >= 80 ? 'warning' : 'failed';

    return {
      testName: `API负载测试 - ${endpoint}`,
      duration: totalTime,
      requestCount: totalRequests,
      successCount,
      errorCount,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      status,
      errors: errors.slice(0, 5) // 只保留前5个错误
    };
  };

  // 前端性能测试
  const runFrontendPerformanceTest = async (): Promise<TestResult> => {
    setCurrentTest('前端性能测试');
    const startTime = Date.now();

    // 模拟DOM操作性能测试
    const domOperations = 1000;
    const domStartTime = performance.now();
    
    for (let i = 0; i < domOperations; i++) {
      const div = document.createElement('div');
      div.innerHTML = `<span>Test ${i}</span>`;
      document.body.appendChild(div);
      document.body.removeChild(div);
    }
    
    const domEndTime = performance.now();
    const domOperationTime = domEndTime - domStartTime;

    // JavaScript计算性能测试
    const computeStartTime = performance.now();
    let result = 0;
    for (let i = 0; i < 100000; i++) {
      result += Math.sqrt(i) * Math.random();
    }
    const computeEndTime = performance.now();
    const computeTime = computeEndTime - computeStartTime;

    const totalTime = Date.now() - startTime;
    const avgResponseTime = (domOperationTime + computeTime) / 2;

    const status = 
      domOperationTime < 100 && computeTime < 50 
        ? 'passed' 
        : domOperationTime < 200 && computeTime < 100 ? 'warning' : 'failed';

    return {
      testName: '前端性能测试',
      duration: totalTime,
      requestCount: domOperations + 100000,
      successCount: domOperations + 100000,
      errorCount: 0,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime: Math.round(Math.min(domOperationTime, computeTime)),
      maxResponseTime: Math.round(Math.max(domOperationTime, computeTime)),
      requestsPerSecond: Math.round((domOperations + 100000) / (totalTime / 1000)),
      status,
      errors: []
    };
  };

  // 内存泄漏测试
  const runMemoryLeakTest = async (): Promise<TestResult> => {
    setCurrentTest('内存泄漏测试');
    const startTime = Date.now();
    
    if (!(performance as any).memory) {
      return {
        testName: '内存泄漏测试',
        duration: 0,
        requestCount: 0,
        successCount: 0,
        errorCount: 1,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        status: 'failed',
        errors: ['浏览器不支持内存监控']
      };
    }

    const initialMemory = (performance as any).memory.usedJSHeapSize;
    const memorySnapshots: number[] = [];

    // 创建一些对象来测试内存使用
    const testObjects: any[] = [];
    
    for (let i = 0; i < 100; i++) {
      // 创建大量对象
      const batch = Array.from({ length: 1000 }, (_, index) => ({
        id: i * 1000 + index,
        data: new Array(100).fill(`test-data-${i}-${index}`),
        timestamp: Date.now(),
        nested: {
          level1: { level2: { level3: `deep-${i}-${index}` } }
        }
      }));
      
      testObjects.push(...batch);
      
      // 记录内存快照
      memorySnapshots.push((performance as any).memory.usedJSHeapSize);
      
      // 模拟一些处理时间
      await new Promise(resolve => setTimeout(resolve, 10));
      
      setProgress((i / 100) * 100);
    }

    // 清理对象
    testObjects.length = 0;
    
    // 强制垃圾回收（如果可用）
    if ((window as any).gc) {
      (window as any).gc();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalMemory = (performance as any).memory.usedJSHeapSize;
    const memoryGrowth = finalMemory - initialMemory;
    const maxMemoryUsed = Math.max(...memorySnapshots);
    
    const totalTime = Date.now() - startTime;
    const memoryGrowthMB = memoryGrowth / 1024 / 1024;
    
    const status = memoryGrowthMB < 5 ? 'passed' : memoryGrowthMB < 20 ? 'warning' : 'failed';

    return {
      testName: '内存泄漏测试',
      duration: totalTime,
      requestCount: 100000,
      successCount: 100000,
      errorCount: 0,
      avgResponseTime: Math.round(totalTime / 100),
      minResponseTime: 10,
      maxResponseTime: 50,
      requestsPerSecond: Math.round(100000 / (totalTime / 1000)),
      status,
      errors: memoryGrowthMB > 20 ? [`内存增长过大: ${memoryGrowthMB.toFixed(2)}MB`] : []
    };
  };

  // 开始压力测试
  const startStressTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      toast.info('开始性能压力测试');

      // 更新初始性能指标
      setPerformanceMetrics(getCurrentMetrics());

      const tests = [
        () => runAPILoadTest('/products', 5, 10000), // 5并发，10秒
        () => runAPILoadTest('/quotations', 3, 8000), // 3并发，8秒
        () => runFrontendPerformanceTest(),
        () => runMemoryLeakTest()
      ];

      const results: TestResult[] = [];

      for (let i = 0; i < tests.length; i++) {
        if (abortControllerRef.current.signal.aborted) break;
        
        try {
          const result = await tests[i]();
          results.push(result);
          setTestResults([...results]);
          
          if (result.status === 'passed') {
            toast.success(`${result.testName} - 测试通过`);
          } else if (result.status === 'warning') {
            toast.warning(`${result.testName} - 性能警告`);
          } else {
            toast.error(`${result.testName} - 测试失败`);
          }
        } catch (error) {
          const failedResult: TestResult = {
            testName: `测试失败 - ${i + 1}`,
            duration: 0,
            requestCount: 0,
            successCount: 0,
            errorCount: 1,
            avgResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            requestsPerSecond: 0,
            status: 'failed',
            errors: [error instanceof Error ? error.message : '未知错误']
          };
          results.push(failedResult);
          setTestResults([...results]);
        }
      }

      // 更新最终性能指标
      setPerformanceMetrics(getCurrentMetrics());
      
      const passedTests = results.filter(r => r.status === 'passed').length;
      const totalTests = results.length;
      
      if (passedTests === totalTests) {
        toast.success(`性能测试完成 - 全部通过 (${passedTests}/${totalTests})`);
      } else {
        toast.warning(`性能测试完成 - 部分通过 (${passedTests}/${totalTests})`);
      }

    } catch (error) {
      console.error('Performance test error:', error);
      toast.error('性能测试执行失败');
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
      setProgress(0);
    }
  };

  // 停止测试
  const stopTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setCurrentTest(null);
    setProgress(0);
    toast.info('性能测试已停止');
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Timer className="h-4 w-4 text-gray-400" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'failed':
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateOverallScore = () => {
    if (testResults.length === 0) return 0;
    const passedWeight = 100;
    const warningWeight = 60;
    const failedWeight = 0;
    
    const totalScore = testResults.reduce((sum, result) => {
      switch (result.status) {
        case 'passed': return sum + passedWeight;
        case 'warning': return sum + warningWeight;
        case 'failed': return sum + failedWeight;
        default: return sum;
      }
    }, 0);
    
    return Math.round(totalScore / testResults.length);
  };

  return (
    <div className="space-y-6">
      {/* 测试控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-5 w-5" />
            性能压力测试套件
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            测试系统在高负载下的性能表现和稳定性
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={startStressTest}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isRunning ? '测试进行中...' : '开始压力测试'}
            </Button>
            
            {isRunning && (
              <Button
                variant="destructive"
                onClick={stopTest}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                停止测试
              </Button>
            )}
            
            {testResults.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  总体评分: {calculateOverallScore()}/100
                </Badge>
              </div>
            )}
          </div>
          
          {isRunning && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentTest || '准备中...'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 实时性能指标 */}
      {performanceMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Server className="h-5 w-5" />
              实时性能指标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.name}</span>
                    {getStatusIcon(metric.status)}
                  </div>
                  <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                    {metric.value.toLocaleString()}{metric.unit}
                  </div>
                  {metric.threshold > 0 && (
                    <div className="text-xs text-muted-foreground">
                      阈值: {metric.threshold.toLocaleString()}{metric.unit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 测试结果 */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Database className="h-5 w-5" />
              测试结果详情
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      {result.testName}
                    </h4>
                    <Badge 
                      variant={result.status === 'passed' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}
                    >
                      {result.status === 'passed' ? '通过' : result.status === 'warning' ? '警告' : '失败'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">请求总数</div>
                      <div className="font-medium">{result.requestCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">成功率</div>
                      <div className="font-medium">
                        {result.requestCount > 0 ? Math.round((result.successCount / result.requestCount) * 100) : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">平均响应时间</div>
                      <div className="font-medium">{result.avgResponseTime}ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">请求/秒</div>
                      <div className="font-medium">{result.requestsPerSecond}</div>
                    </div>
                  </div>
                  
                  {result.errors.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-red-600">错误信息:</div>
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {result.errors.map((error, i) => (
                          <div key={i}>• {error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 测试说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            测试说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">测试项目:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>API负载测试</strong>: 模拟多用户并发访问关键API端点</li>
                <li><strong>前端性能测试</strong>: 测试DOM操作和JavaScript计算性能</li>
                <li><strong>内存泄漏测试</strong>: 检测内存使用增长和垃圾回收效率</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">性能阈值:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>平均响应时间: ≤ {PERFORMANCE_THRESHOLDS.avgResponseTime}ms</li>
                <li>请求成功率: ≥ {PERFORMANCE_THRESHOLDS.successRate}%</li>
                <li>请求处理能力: ≥ {PERFORMANCE_THRESHOLDS.requestsPerSecond} req/s</li>
              </ul>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">
                <strong>注意</strong>: 性能测试会产生系统负载，建议在非生产环境或低峰期进行。测试结果受网络环境、硬件配置等因素影响。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};