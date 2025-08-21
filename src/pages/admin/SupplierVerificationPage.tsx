import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  User, 
  Calendar,
  ArrowLeft,
  Search,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supplierApi } from '@/services/api';
import { notificationService } from '@/services/notificationService';
import { SupplierApplication } from '@/services/supplierService';

const SupplierVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<SupplierApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 审核对话框状态
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    application: SupplierApplication | null;
    action: 'approve' | 'reject' | null;
  }>({
    open: false,
    application: null,
    action: null
  });
  
  // 详情对话框状态
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    application: SupplierApplication | null;
  }>({
    open: false,
    application: null
  });

  const [reviewReason, setReviewReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // 加载待审核申请
  const loadPendingApplications = async () => {
    setLoading(true);
    try {
      const applicationList = await supplierApi.getPendingApplications();
      setApplications(applicationList);
      setFilteredApplications(applicationList);
    } catch (error) {
      console.error('Error loading pending applications:', error);
      toast.error('加载申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadPendingApplications();
  }, []);

  // 搜索过滤
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = applications.filter(app => 
        app.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApplications(filtered);
    } else {
      setFilteredApplications(applications);
    }
  }, [searchQuery, applications]);

  // 处理审核
  const handleReview = async () => {
    if (!reviewDialog.application || !reviewDialog.action) return;

    setProcessing(true);
    try {
      const approved = reviewDialog.action === 'approve';
      await supplierApi.reviewApplication(
        reviewDialog.application.id, 
        approved, 
        reviewReason || undefined
      );

      // 发送审核结果通知给申请人
      try {
        await notificationService.notifySupplierApplicationResult(
          reviewDialog.application.id,
          reviewDialog.application.nickname,
          approved,
          reviewReason
        );
      } catch (notificationError) {
        console.error('Error sending supplier application result notification:', notificationError);
        // 通知发送失败不影响审核流程
      }

      toast.success(approved ? '申请已通过' : '申请已拒绝');
      
      // 从列表中移除已处理的申请
      setApplications(prev => prev.filter(app => app.id !== reviewDialog.application!.id));
      
      // 关闭对话框
      setReviewDialog({ open: false, application: null, action: null });
      setReviewReason('');
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error('操作失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 打开审核对话框
  const openReviewDialog = (application: SupplierApplication, action: 'approve' | 'reject') => {
    setReviewDialog({ open: true, application, action });
    setReviewReason('');
  };

  // 打开详情对话框
  const openDetailDialog = (application: SupplierApplication) => {
    setDetailDialog({ open: true, application });
  };

  // 渲染申请卡片
  const renderApplicationCard = (application: SupplierApplication) => (
    <Card key={application.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={application.avatar_url} />
              <AvatarFallback>
                {application.nickname[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {application.company_name || application.nickname}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="w-3 h-3" />
                {application.nickname}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            待审核
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 企业信息 */}
        {application.company_name && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              企业信息
            </h5>
            <div className="text-sm text-muted-foreground space-y-1 ml-6">
              <div>企业名称：{application.company_name}</div>
              {application.business_license && (
                <div>营业执照：{application.business_license}</div>
              )}
              {application.company_address && (
                <div>企业地址：{application.company_address}</div>
              )}
              {application.company_phone && (
                <div>联系电话：{application.company_phone}</div>
              )}
              {application.company_email && (
                <div>企业邮箱：{application.company_email}</div>
              )}
            </div>
          </div>
        )}

        {/* 企业简介 */}
        {application.company_description && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">企业简介</h5>
            <p className="text-sm text-muted-foreground">
              {application.company_description}
            </p>
          </div>
        )}

        <Separator />

        {/* 申请时间 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          申请时间：{new Date(application.supplier_applied_at).toLocaleString()}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDetailDialog(application)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            查看详情
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openReviewDialog(application, 'reject')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              拒绝
            </Button>
            <Button
              size="sm"
              onClick={() => openReviewDialog(application, 'approve')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              通过
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
            <h1 className="text-2xl font-bold">供应商认证审核</h1>
            <p className="text-muted-foreground">审核用户的供应商申请</p>
          </div>
        </div>

        {/* 搜索和统计 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索申请人或企业名称..."
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                共 {filteredApplications.length} 个待审核申请
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 申请列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                {searchQuery ? '没有找到匹配的申请' : '暂无待审核的供应商申请'}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map(renderApplicationCard)}
          </div>
        )}
      </div>

      {/* 审核对话框 */}
      <Dialog 
        open={reviewDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialog({ open: false, application: null, action: null });
            setReviewReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'approve' ? '通过申请' : '拒绝申请'}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.action === 'approve' 
                ? '确认通过该用户的供应商申请吗？' 
                : '确认拒绝该用户的供应商申请吗？请说明拒绝原因。'
              }
            </DialogDescription>
          </DialogHeader>

          {reviewDialog.application && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={reviewDialog.application.avatar_url} />
                  <AvatarFallback>
                    {reviewDialog.application.nickname[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {reviewDialog.application.company_name || reviewDialog.application.nickname}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {reviewDialog.application.nickname}
                  </div>
                </div>
              </div>

              {reviewDialog.action === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="reason">拒绝原因</Label>
                  <Textarea
                    id="reason"
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="请输入拒绝原因..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setReviewDialog({ open: false, application: null, action: null });
                setReviewReason('');
              }}
              disabled={processing}
            >
              取消
            </Button>
            <Button 
              onClick={handleReview}
              disabled={processing || (reviewDialog.action === 'reject' && !reviewReason.trim())}
              className={reviewDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  处理中...
                </>
              ) : (
                <>
                  {reviewDialog.action === 'approve' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      确认通过
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      确认拒绝
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog 
        open={detailDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setDetailDialog({ open: false, application: null });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>申请详情</DialogTitle>
            <DialogDescription>
              查看完整的供应商申请信息
            </DialogDescription>
          </DialogHeader>

          {detailDialog.application && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={detailDialog.application.avatar_url} />
                    <AvatarFallback>
                      {detailDialog.application.nickname[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {detailDialog.application.company_name || detailDialog.application.nickname}
                    </h3>
                    <p className="text-muted-foreground">
                      申请人：{detailDialog.application.nickname}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  申请时间：{new Date(detailDialog.application.supplier_applied_at).toLocaleString()}
                </div>
              </div>

              <Separator />

              {/* 企业信息详情 */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  企业信息
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">企业名称</Label>
                    <div className="mt-1">{detailDialog.application.company_name || '未填写'}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">营业执照号</Label>
                    <div className="mt-1">{detailDialog.application.business_license || '未填写'}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">企业电话</Label>
                    <div className="mt-1">{detailDialog.application.company_phone || '未填写'}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">企业邮箱</Label>
                    <div className="mt-1">{detailDialog.application.company_email || '未填写'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">企业地址</Label>
                    <div className="mt-1">{detailDialog.application.company_address || '未填写'}</div>
                  </div>
                </div>

                {detailDialog.application.company_description && (
                  <div>
                    <Label className="text-muted-foreground">企业简介</Label>
                    <div className="mt-1 text-sm">
                      {detailDialog.application.company_description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setDetailDialog({ open: false, application: null })}
            >
              关闭
            </Button>
            {detailDialog.application && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailDialog({ open: false, application: null });
                    openReviewDialog(detailDialog.application!, 'reject');
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  拒绝
                </Button>
                <Button
                  onClick={() => {
                    setDetailDialog({ open: false, application: null });
                    openReviewDialog(detailDialog.application!, 'approve');
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  通过
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SupplierVerificationPage;



