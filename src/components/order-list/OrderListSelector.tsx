import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Calendar, MapPin, Package, Loader2 } from 'lucide-react';
import { useProductLists } from '@/hooks/useProductLists';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface OrderList {
  id: string;
  name: string;
  description?: string;
  status: string;
  total_amount: number;
  expected_delivery_date?: string;
  delivery_location: string;
  special_requirements?: string;
  created_at: string;
  product_list_items?: any[];
}

interface OrderListSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrderList: (orderList: OrderList) => void;
  title?: string;
  description?: string;
}

export const OrderListSelector: React.FC<OrderListSelectorProps> = ({
  open,
  onOpenChange,
  onSelectOrderList,
  title = "选择货单引用",
  description = "选择一个货单引用到对话中"
}) => {
  const { data: productLists, isLoading } = useProductLists();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderList, setSelectedOrderList] = useState<OrderList | null>(null);

  // 过滤货单（包括所有状态的货单）
  const filteredOrderLists = (productLists || []).filter((list: OrderList) => {
    // 搜索过滤
    const searchMatch = searchQuery === '' || 
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return searchMatch;
  });

  const handleSelect = () => {
    if (!selectedOrderList) {
      toast.error('请选择一个货单');
      return;
    }
    
    onSelectOrderList(selectedOrderList);
    onOpenChange(false);
    setSelectedOrderList(null);
    setSearchQuery('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedOrderList(null);
    setSearchQuery('');
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      shared: "bg-blue-100 text-blue-800",
      negotiating: "bg-orange-100 text-orange-800", 
      confirmed: "bg-green-100 text-green-800",
      delivered: "bg-purple-100 text-purple-800"
    };
    const labels = {
      draft: "草稿",
      shared: "已分享", 
      negotiating: "协商中",
      confirmed: "已确认",
      delivered: "已交付"
    };
    return <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{labels[status as keyof typeof labels] || status}</Badge>;
  };

  useEffect(() => {
    if (!open) {
      setSelectedOrderList(null);
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索货单名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 货单列表 */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : filteredOrderLists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? '未找到匹配的货单' : '暂无可引用的货单'}
              </div>
            ) : (
              <div className="space-y-3 pr-2">
                {filteredOrderLists.map((orderList: OrderList) => (
                  <Card 
                    key={orderList.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedOrderList?.id === orderList.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : ''
                    }`}
                    onClick={() => setSelectedOrderList(orderList)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* 标题行 */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{orderList.name}</h3>
                            {getStatusBadge(orderList.status)}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">
                              ¥{orderList.total_amount?.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* 描述 */}
                        {orderList.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {orderList.description}
                          </p>
                        )}

                        {/* 详细信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(orderList.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{orderList.delivery_location}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>{orderList.product_list_items?.length || 0} 个商品</span>
                          </div>
                        </div>

                        {/* 特殊要求 */}
                        {orderList.special_requirements && (
                          <div className="p-2 bg-muted rounded text-sm">
                            <span className="font-medium">特殊要求：</span>
                            <span className="text-muted-foreground">{orderList.special_requirements}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedOrderList ? `已选择: ${selectedOrderList.name}` : '请选择一个货单'}
            </span>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button 
                onClick={handleSelect}
                disabled={!selectedOrderList}
              >
                引用货单
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};