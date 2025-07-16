import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Share2,
  ArrowLeft,
  Users,
  Gift,
  ShoppingCart,
  TrendingUp,
  Crown,
  Copy,
  MessageCircle,
  Eye,
  Calendar,
  Package,
  DollarSign,
  Network,
  Plus,
  Minus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Types
interface SheetDetail {
  id: string;
  sheet_name: string;
  rebate_total: number;
  total_amount: number;
  supplier_id: string;
  status: string;
  created_at: string;
  notes: string;
  supplier_name: string;
  supplier_verified: boolean;
  items: SheetItem[];
  share_chain?: {
    depth: number;
    parent_names: string[];
    children_count: number;
    total_commission: number;
    contribution_rank: number;
  };
  rebate_rules: {
    direct_rate: number;
    indirect_rate: number;
    platform_rate: number;
  };
}

interface SheetItem {
  id: string;
  name: string;
  original_price: number;
  retail_price: number;
  quantity: number;
  unit: string;
  image?: string;
  specs?: string;
}

interface ShareChainNode {
  id: string;
  name: string;
  level: number;
  children_count: number;
  commission: number;
  is_current_user: boolean;
}

const SheetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sheet, setSheet] = useState<SheetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareChain, setShareChain] = useState<ShareChainNode[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch sheet detail
  const fetchSheetDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          id,
          sheet_name,
          rebate_total,
          total_amount,
          supplier_id,
          status,
          created_at,
          notes,
          supplier_credentials!inner(company_name, verification_status)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Mock items data - in real app, this would come from product_list_items
      const mockItems: SheetItem[] = [
        {
          id: '1',
          name: '挪威进口三文鱼片',
          original_price: 88.00,
          retail_price: 98.00,
          quantity: 10,
          unit: 'kg',
          specs: '500g/片，冰鲜包装'
        },
        {
          id: '2',
          name: '澳洲龙虾',
          original_price: 168.00,
          retail_price: 188.00,
          quantity: 5,
          unit: '只',
          specs: '400-500g/只，活体运输'
        },
        {
          id: '3',
          name: '新鲜贝类组合',
          original_price: 45.00,
          retail_price: 52.00,
          quantity: 20,
          unit: '份',
          specs: '扇贝+生蚝+花蛤，500g/份'
        }
      ];

      // Mock share chain data
      const mockShareChain: ShareChainNode[] = [
        { id: '1', name: '张三海鲜', level: 0, children_count: 3, commission: 1250, is_current_user: false },
        { id: '2', name: '李四食材', level: 1, children_count: 2, commission: 750, is_current_user: false },
        { id: '3', name: '您', level: 2, children_count: 0, commission: 300, is_current_user: true }
      ];

      const sheetDetail: SheetDetail = {
        id: data.id,
        sheet_name: data.sheet_name || '未命名货单',
        rebate_total: Number(data.rebate_total),
        total_amount: Number(data.total_amount),
        supplier_id: data.supplier_id,
        status: data.status,
        created_at: data.created_at,
        notes: data.notes || '',
        supplier_name: data.supplier_credentials?.company_name || '未知供应商',
        supplier_verified: data.supplier_credentials?.verification_status === 'verified',
        items: mockItems,
        share_chain: {
          depth: 2,
          parent_names: ['张三海鲜', '李四食材'],
          children_count: 0,
          total_commission: 300,
          contribution_rank: 15
        },
        rebate_rules: {
          direct_rate: 0.6,
          indirect_rate: 0.3,
          platform_rate: 0.1
        }
      };

      setSheet(sheetDetail);
      setShareChain(mockShareChain);
    } catch (error) {
      console.error('获取货单详情失败:', error);
      toast({
        title: "加载失败",
        description: "无法获取货单详情，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetDetail();
  }, [id]);

  // Handle share
  const handleShare = async () => {
    if (!sheet || !user) {
      toast({
        title: "分享失败",
        description: "请先登录后再分享",
        variant: "destructive"
      });
      return;
    }

    // Generate share code
    const shareCode = `SHARE${Date.now()}`;
    const shareUrl = `${window.location.origin}/sheets/${sheet.id}?ref=${shareCode}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "分享链接已复制",
        description: "链接已复制到剪贴板，快去分享给朋友吧！",
      });
      setShowShareDialog(false);
    } catch (error) {
      toast({
        title: "复制失败",
        description: "请手动复制分享链接",
        variant: "destructive"
      });
    }
  };

  // Handle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // Calculate selected items total
  const getSelectedTotal = () => {
    if (!sheet) return 0;
    return sheet.items
      .filter(item => selectedItems.has(item.id))
      .reduce((total, item) => total + (item.retail_price * item.quantity), 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!sheet) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              货单不存在
            </h3>
            <p className="text-muted-foreground mb-4">
              请检查链接是否正确或联系分享人
            </p>
            <Button onClick={() => navigate('/sheets')}>
              返回货单中心
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sheets')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{sheet.sheet_name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-muted-foreground">来自:</span>
                <span className="text-sm font-medium">{sheet.supplier_name}</span>
                {sheet.supplier_verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    已认证
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              转发分享
            </Button>
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              立即采购
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* 商品明细 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>商品明细</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedItems.size === sheet.items.length) {
                          setSelectedItems(new Set());
                        } else {
                          setSelectedItems(new Set(sheet.items.map(item => item.id)));
                        }
                      }}
                    >
                      {selectedItems.size === sheet.items.length ? '取消全选' : '全选'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      已选 {selectedItems.size}/{sheet.items.length} 项
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sheet.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedItems.has(item.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.specs}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm">
                              数量: {item.quantity}{item.unit}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              ¥{item.original_price}
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              ¥{item.retail_price}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          ¥{(item.retail_price * item.quantity).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          省 ¥{((item.retail_price - item.original_price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 分享链路可视化 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Network className="h-5 w-5 mr-2" />
                  分享链路
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shareChain.map((node, index) => (
                    <div key={node.id} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          node.is_current_user ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{node.name}</div>
                          <div className="text-xs text-muted-foreground">
                            下级: {node.children_count} | 返利: ¥{node.commission}
                          </div>
                        </div>
                      </div>
                      {index < shareChain.length - 1 && (
                        <div className="flex-1 border-t border-dashed border-muted-foreground"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* 返利信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="h-5 w-5 mr-2" />
                  返利信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-primary rounded-lg p-4 text-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">¥{sheet.rebate_total}</div>
                    <div className="text-sm opacity-90">每单返利总额</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>直接推荐 ({(sheet.rebate_rules.direct_rate * 100).toFixed(0)}%)</span>
                    <span className="font-medium">¥{(sheet.rebate_total * sheet.rebate_rules.direct_rate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>间接推荐 ({(sheet.rebate_rules.indirect_rate * 100).toFixed(0)}%)</span>
                    <span className="font-medium">¥{(sheet.rebate_total * sheet.rebate_rules.indirect_rate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>平台服务 ({(sheet.rebate_rules.platform_rate * 100).toFixed(0)}%)</span>
                    <span className="font-medium">¥{(sheet.rebate_total * sheet.rebate_rules.platform_rate).toFixed(2)}</span>
                  </div>
                </div>

                {sheet.share_chain && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>我的贡献排名</span>
                        <span className="font-medium">#{sheet.share_chain.contribution_rank}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>已获得返利</span>
                        <span className="font-medium text-success">¥{sheet.share_chain.total_commission}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 订单摘要 */}
            {selectedItems.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    订单摘要
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>选中商品</span>
                    <span>{selectedItems.size} 项</span>
                  </div>
                  <div className="flex justify-between">
                    <span>商品总额</span>
                    <span>¥{getSelectedTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>预计返利</span>
                    <span>¥{sheet.rebate_total}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>合计</span>
                    <span>¥{getSelectedTotal().toLocaleString()}</span>
                  </div>
                  <Button className="w-full" size="lg">
                    立即下单
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 货单信息 */}
            <Card>
              <CardHeader>
                <CardTitle>货单信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>创建时间: {new Date(sheet.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>货单总额: ¥{sheet.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Badge variant={sheet.status === 'draft' ? 'secondary' : 'default'}>
                    {sheet.status === 'draft' ? '草稿' : '进行中'}
                  </Badge>
                </div>
                {sheet.notes && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium mb-1">备注说明</div>
                      <div className="text-sm text-muted-foreground">{sheet.notes}</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>分享货单</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-message">分享消息</Label>
                <Textarea
                  id="share-message"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="推荐这个优质货单给你，返利丰厚，快来看看！"
                  rows={3}
                />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">{sheet.sheet_name}</div>
                <div className="text-xs text-muted-foreground">
                  返利总额: ¥{sheet.rebate_total} | 共 {sheet.items.length} 个商品
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleShare} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  复制链接
                </Button>
                <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                  取消
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SheetDetailPage;