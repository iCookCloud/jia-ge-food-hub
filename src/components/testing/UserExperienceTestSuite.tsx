import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart,
  Monitor,
  Smartphone,
  Eye,
  MousePointer,
  Keyboard,
  CheckCircle2,
  XCircle,
  Star,
  Timer,
  Accessibility,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';

interface UXTestResult {
  testName: string;
  category: string;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  score: number; // 0-100
  message: string;
  details?: string[];
  improvements?: string[];
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  benchmark: number;
}

/**
 * 用户体验测试套件
 */
export const UserExperienceTestSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<UXTestResult[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [progress, setProgress] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const [userFeedback, setUserFeedback] = useState('');

  // 获取设备信息
  useEffect(() => {
    const getDeviceInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        },
        devicePixelRatio: window.devicePixelRatio,
        connection: (navigator as any).connection,
        memory: (navigator as any).deviceMemory,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      };
      setDeviceInfo(info);
    };

    getDeviceInfo();
    window.addEventListener('resize', getDeviceInfo);
    return () => window.removeEventListener('resize', getDeviceInfo);
  }, []);

  // 响应式设计测试
  const testResponsiveDesign = async (): Promise<UXTestResult> => {
    setCurrentTest('响应式设计测试');
    
    const viewport = deviceInfo.viewport;
    const issues: string[] = [];
    const strengths: string[] = [];
    
    // 检查视口设置
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      issues.push('缺少viewport meta标签');
    } else {
      strengths.push('正确设置viewport标签');
    }

    // 检查断点兼容性
    if (viewport.width >= 1024) {
      strengths.push('桌面端显示正常');
    } else if (viewport.width >= 768) {
      strengths.push('平板端显示适配');
    } else {
      strengths.push('移动端显示优化');
    }

    // 检查文本可读性
    const bodyFont = window.getComputedStyle(document.body).fontSize;
    const fontSize = parseInt(bodyFont);
    if (fontSize < 14) {
      issues.push('字体大小可能过小（移动端）');
    } else {
      strengths.push('字体大小合适');
    }

    // 检查触摸目标大小
    const buttons = document.querySelectorAll('button, a');
    let smallTargets = 0;
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        smallTargets++;
      }
    });

    if (smallTargets > 0) {
      issues.push(`${smallTargets}个交互元素可能过小`);
    } else {
      strengths.push('交互元素大小合适');
    }

    const score = Math.max(0, 100 - (issues.length * 20));
    const status = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'poor';

    return {
      testName: '响应式设计测试',
      category: '界面设计',
      status,
      score,
      message: `响应式设计评分: ${score}/100`,
      details: strengths,
      improvements: issues
    };
  };

  // 页面加载性能测试
  const testPagePerformance = async (): Promise<UXTestResult> => {
    setCurrentTest('页面加载性能测试');
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const metrics: PerformanceMetric[] = [];
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.navigationStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      const firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime || 0;
      const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;

      metrics.push(
        {
          name: '页面加载时间',
          value: Math.round(loadTime),
          rating: loadTime < 2000 ? 'excellent' : loadTime < 4000 ? 'good' : loadTime < 6000 ? 'needs_improvement' : 'poor',
          benchmark: 3000
        },
        {
          name: 'DOM加载时间',
          value: Math.round(domContentLoaded),
          rating: domContentLoaded < 1500 ? 'excellent' : domContentLoaded < 3000 ? 'good' : domContentLoaded < 5000 ? 'needs_improvement' : 'poor',
          benchmark: 2500
        },
        {
          name: '首次绘制',
          value: Math.round(firstPaint),
          rating: firstPaint < 1000 ? 'excellent' : firstPaint < 2000 ? 'good' : firstPaint < 3000 ? 'needs_improvement' : 'poor',
          benchmark: 1500
        },
        {
          name: '首次内容绘制',
          value: Math.round(firstContentfulPaint),
          rating: firstContentfulPaint < 1500 ? 'excellent' : firstContentfulPaint < 2500 ? 'good' : firstContentfulPaint < 4000 ? 'needs_improvement' : 'poor',
          benchmark: 2000
        }
      );
    }

    setPerformanceMetrics(metrics);

    const avgRating = metrics.reduce((sum, metric) => {
      const ratingValue = { excellent: 4, good: 3, needs_improvement: 2, poor: 1 }[metric.rating];
      return sum + ratingValue;
    }, 0) / metrics.length;

    const score = Math.round((avgRating / 4) * 100);
    const status = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'poor';

    const improvements = metrics
      .filter(m => m.rating === 'needs_improvement' || m.rating === 'poor')
      .map(m => `优化${m.name} (当前: ${m.value}ms, 建议: <${m.benchmark}ms)`);

    return {
      testName: '页面加载性能测试',
      category: '性能体验',
      status,
      score,
      message: `性能评分: ${score}/100`,
      details: metrics.map(m => `${m.name}: ${m.value}ms`),
      improvements
    };
  };

  // 可访问性测试
  const testAccessibility = async (): Promise<UXTestResult> => {
    setCurrentTest('可访问性测试');
    
    const issues: string[] = [];
    const strengths: string[] = [];

    // 检查图片alt属性
    const images = document.querySelectorAll('img');
    let imagesWithoutAlt = 0;
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        imagesWithoutAlt++;
      }
    });

    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt}张图片缺少alt描述`);
    } else {
      strengths.push('所有图片都有适当的描述');
    }

    // 检查表单标签
    const inputs = document.querySelectorAll('input, textarea, select');
    let inputsWithoutLabels = 0;
    inputs.forEach(input => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel) {
        inputsWithoutLabels++;
      }
    });

    if (inputsWithoutLabels > 0) {
      issues.push(`${inputsWithoutLabels}个表单元素缺少标签`);
    } else if (inputs.length > 0) {
      strengths.push('表单元素标签完整');
    }

    // 检查颜色对比度（简化版）
    const body = document.body;
    const bodyStyles = window.getComputedStyle(body);
    const backgroundColor = bodyStyles.backgroundColor;
    const color = bodyStyles.color;
    
    if (backgroundColor && color) {
      strengths.push('页面设置了基本的颜色样式');
    }

    // 检查标题层级
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      issues.push('页面缺少标题结构');
    } else {
      const h1Count = document.querySelectorAll('h1').length;
      if (h1Count === 0) {
        issues.push('页面缺少主标题(h1)');
      } else if (h1Count > 1) {
        issues.push('页面有多个主标题(h1)');
      } else {
        strengths.push('标题结构合理');
      }
    }

    // 检查focus可见性
    const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
      strengths.push(`${focusableElements.length}个可聚焦元素`);
    }

    const score = Math.max(0, 100 - (issues.length * 15));
    const status = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'poor';

    return {
      testName: '可访问性测试',
      category: '无障碍访问',
      status,
      score,
      message: `可访问性评分: ${score}/100`,
      details: strengths,
      improvements: issues
    };
  };

  // 交互体验测试
  const testInteractionExperience = async (): Promise<UXTestResult> => {
    setCurrentTest('交互体验测试');
    
    const issues: string[] = [];
    const strengths: string[] = [];

    // 检查按钮状态
    const buttons = document.querySelectorAll('button');
    let buttonsWithoutHover = 0;
    let disabledButtons = 0;

    buttons.forEach(button => {
      if (button.disabled) {
        disabledButtons++;
      }
      
      // 检查是否有hover样式（简化检查）
      const styles = window.getComputedStyle(button);
      if (styles.cursor === 'pointer') {
        // 有指针样式，可能有hover效果
      } else {
        buttonsWithoutHover++;
      }
    });

    if (buttonsWithoutHover === 0 && buttons.length > 0) {
      strengths.push('按钮交互反馈良好');
    } else if (buttonsWithoutHover > 0) {
      issues.push(`${buttonsWithoutHover}个按钮可能缺少交互反馈`);
    }

    // 检查加载状态
    const loadingElements = document.querySelectorAll('[aria-busy="true"], .loading, .spinner');
    if (loadingElements.length > 0) {
      strengths.push('有加载状态指示');
    }

    // 检查错误提示
    const errorElements = document.querySelectorAll('.error, [role="alert"], .text-red');
    if (errorElements.length > 0) {
      strengths.push('有错误提示机制');
    }

    // 检查工具提示
    const tooltipElements = document.querySelectorAll('[title], [aria-describedby]');
    if (tooltipElements.length > 0) {
      strengths.push('提供了帮助信息');
    }

    // 检查表单验证
    const requiredInputs = document.querySelectorAll('input[required], textarea[required]');
    if (requiredInputs.length > 0) {
      strengths.push('表单有必填字段标识');
    }

    const score = Math.max(0, 100 - (issues.length * 20));
    const status = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'poor';

    return {
      testName: '交互体验测试',
      category: '用户交互',
      status,
      score,
      message: `交互体验评分: ${score}/100`,
      details: strengths,
      improvements: issues
    };
  };

  // 视觉设计测试
  const testVisualDesign = async (): Promise<UXTestResult> => {
    setCurrentTest('视觉设计测试');
    
    const issues: string[] = [];
    const strengths: string[] = [];

    // 检查CSS变量使用（主题系统）
    const rootStyles = window.getComputedStyle(document.documentElement);
    const cssVariables = Array.from(rootStyles).filter(prop => prop.startsWith('--'));
    
    if (cssVariables.length > 10) {
      strengths.push('使用了CSS变量主题系统');
    } else {
      issues.push('可能缺少统一的主题系统');
    }

    // 检查字体一致性
    const allElements = document.querySelectorAll('*');
    const fontFamilies = new Set<string>();
    
    // 检查前50个元素的字体
    Array.from(allElements).slice(0, 50).forEach(el => {
      const fontFamily = window.getComputedStyle(el).fontFamily;
      fontFamilies.add(fontFamily);
    });

    if (fontFamilies.size <= 3) {
      strengths.push('字体使用一致');
    } else {
      issues.push('字体种类过多，可能影响一致性');
    }

    // 检查颜色使用
    const coloredElements = document.querySelectorAll('[class*="color"], [class*="text-"], [style*="color"]');
    if (coloredElements.length > 0) {
      strengths.push('使用了颜色系统');
    }

    // 检查空白空间
    const containerElements = document.querySelectorAll('.container, .wrapper, main, section');
    if (containerElements.length > 0) {
      strengths.push('有良好的布局结构');
    }

    // 检查图标使用
    const iconElements = document.querySelectorAll('[class*="icon"], svg');
    if (iconElements.length > 0) {
      strengths.push('使用了图标增强视觉效果');
    }

    const score = Math.max(0, 100 - (issues.length * 25));
    const status = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'poor';

    return {
      testName: '视觉设计测试',
      category: '视觉体验',
      status,
      score,
      message: `视觉设计评分: ${score}/100`,
      details: strengths,
      improvements: issues
    };
  };

  // 开始用户体验测试
  const startUXTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    const tests = [
      testResponsiveDesign,
      testPagePerformance,
      testAccessibility,
      testInteractionExperience,
      testVisualDesign
    ];

    try {
      toast.info('开始用户体验测试');

      const results: UXTestResult[] = [];

      for (let i = 0; i < tests.length; i++) {
        try {
          const result = await tests[i]();
          results.push(result);
          setTestResults([...results]);
          setProgress(((i + 1) / tests.length) * 100);

          if (result.status === 'excellent') {
            toast.success(`${result.testName} - 优秀`);
          } else if (result.status === 'good') {
            toast.success(`${result.testName} - 良好`);
          } else if (result.status === 'needs_improvement') {
            toast.warning(`${result.testName} - 需要改进`);
          } else {
            toast.error(`${result.testName} - 需要优化`);
          }

          // 短暂延迟
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          const failedResult: UXTestResult = {
            testName: `测试${i + 1}`,
            category: '系统',
            status: 'poor',
            score: 0,
            message: '测试执行失败',
            improvements: [error instanceof Error ? error.message : '未知错误']
          };
          results.push(failedResult);
          setTestResults([...results]);
        }
      }

      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      toast.success(`用户体验测试完成 - 总体评分: ${Math.round(avgScore)}/100`);

    } catch (error) {
      console.error('UX test error:', error);
      toast.error('用户体验测试执行失败');
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
      setProgress(100);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Star className="h-4 w-4 text-green-600 fill-current" />;
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'needs_improvement':
        return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Timer className="h-4 w-4 text-gray-400" />;
    }
  };

  // 获取类别图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '界面设计':
        return <Monitor className="h-4 w-4" />;
      case '性能体验':
        return <Timer className="h-4 w-4" />;
      case '无障碍访问':
        return <Accessibility className="h-4 w-4" />;
      case '用户交互':
        return <MousePointer className="h-4 w-4" />;
      case '视觉体验':
        return <Palette className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const calculateOverallUXScore = () => {
    if (testResults.length === 0) return 0;
    return Math.round(testResults.reduce((sum, result) => sum + result.score, 0) / testResults.length);
  };

  return (
    <div className="space-y-6">
      {/* 测试控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Heart className="h-5 w-5" />
            用户体验测试套件
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            全面评估界面设计、交互体验和可访问性
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={startUXTest}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              {isRunning ? '测试进行中...' : '开始体验测试'}
            </Button>
            
            {testResults.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  用户体验评分: {calculateOverallUXScore()}/100
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

      {/* 设备信息 */}
      {Object.keys(deviceInfo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              测试环境信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">设备信息</div>
                <div className="text-muted-foreground">
                  {deviceInfo.viewport?.width}×{deviceInfo.viewport?.height} 
                  {deviceInfo.devicePixelRatio > 1 && ` (@${deviceInfo.devicePixelRatio}x)`}
                </div>
              </div>
              <div>
                <div className="font-medium">平台</div>
                <div className="text-muted-foreground">{deviceInfo.platform}</div>
              </div>
              <div>
                <div className="font-medium">语言</div>
                <div className="text-muted-foreground">{deviceInfo.language}</div>
              </div>
              {deviceInfo.connection && (
                <div>
                  <div className="font-medium">网络</div>
                  <div className="text-muted-foreground">
                    {deviceInfo.connection.effectiveType} 
                    {deviceInfo.connection.downlink && ` (${deviceInfo.connection.downlink}Mbps)`}
                  </div>
                </div>
              )}
              {deviceInfo.memory && (
                <div>
                  <div className="font-medium">设备内存</div>
                  <div className="text-muted-foreground">{deviceInfo.memory}GB</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 性能指标 */}
      {performanceMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Timer className="h-5 w-5" />
              性能指标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.name}</span>
                    {getStatusIcon(metric.rating)}
                  </div>
                  <div className="text-2xl font-bold">
                    {metric.value}ms
                  </div>
                  <div className="text-xs text-muted-foreground">
                    建议: &lt;{metric.benchmark}ms
                  </div>
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
              <Eye className="h-5 w-5" />
              用户体验测试结果
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getCategoryIcon(result.category)}
                        {result.category}
                      </Badge>
                      <Badge variant="outline">
                        {result.score}/100
                      </Badge>
                      <Badge 
                        variant={
                          result.status === 'excellent' ? 'default' : 
                          result.status === 'good' ? 'secondary' : 
                          result.status === 'needs_improvement' ? 'outline' : 'destructive'
                        }
                      >
                        {result.status === 'excellent' ? '优秀' : 
                         result.status === 'good' ? '良好' : 
                         result.status === 'needs_improvement' ? '需改进' : '需优化'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  
                  {result.details && result.details.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-green-600">优点:</div>
                      <ul className="text-xs space-y-1">
                        {result.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-1 text-green-600">
                            <span>✓</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.improvements && result.improvements.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-orange-600">改进建议:</div>
                      <ul className="text-xs text-orange-600 space-y-1">
                        {result.improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>→</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 用户反馈 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Keyboard className="h-5 w-5" />
            用户反馈
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            请分享您对系统用户体验的感受和建议
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="请输入您的使用体验、遇到的问题或改进建议..."
              value={userFeedback}
              onChange={(e) => setUserFeedback(e.target.value)}
              rows={4}
            />
            <Button
              onClick={() => {
                if (userFeedback.trim()) {
                  toast.success('感谢您的反馈！');
                  console.log('User feedback:', userFeedback);
                  setUserFeedback('');
                } else {
                  toast.error('请输入反馈内容');
                }
              }}
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              提交反馈
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 测试说明 */}
      <Card>
        <CardHeader>
          <CardTitle>测试维度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                界面与交互
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>响应式设计适配</li>
                <li>交互反馈机制</li>
                <li>加载状态提示</li>
                <li>错误处理体验</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                性能与可访问性
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>页面加载性能</li>
                <li>可访问性支持</li>
                <li>视觉设计一致性</li>
                <li>跨设备兼容性</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              <strong>评分标准</strong>: 优秀(90-100) 良好(70-89) 需改进(50-69) 需优化(&lt;50)。测试结果基于当前环境和设备，实际用户体验可能因设备和网络条件而异。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};