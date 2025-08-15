import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategorySelector } from '@/components/category/CategorySelector';
import { Tags, AlertCircle } from 'lucide-react';

interface BatchCategoryFormProps {
  selectedCount: number;
  categoryIds: number[];
  operation: 'assign' | 'replace' | 'remove';
  onCategoryChange: (ids: number[]) => void;
  onOperationChange: (operation: 'assign' | 'replace' | 'remove') => void;
  onSubmit: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const BatchCategoryForm: React.FC<BatchCategoryFormProps> = ({
  selectedCount,
  categoryIds,
  operation,
  onCategoryChange,
  onOperationChange,
  onSubmit,
  onCancel,
  isProcessing = false
}) => {
  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="flex flex-row items-center gap-2">
        <Tags className="w-5 h-5 text-primary" />
        <div>
          <CardTitle>批量分类操作</CardTitle>
          <CardDescription>
            为选中的 {selectedCount} 个产品分配分类
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>操作类型</Label>
            <Select value={operation} onValueChange={(value) => onOperationChange(value as 'assign' | 'replace' | 'remove')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assign">追加分类</SelectItem>
                <SelectItem value="replace">替换分类</SelectItem>
                <SelectItem value="remove">移除分类</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {operation === 'assign' && '将选择的分类添加到产品，保留已有分类'}
              {operation === 'replace' && '用选择的分类替换产品的所有分类'}
              {operation === 'remove' && '从产品中移除选择的分类'}
            </p>
          </div>
          
          <div>
            <Label>选择分类 {operation !== 'remove' && '*'}</Label>
            <CategorySelector
              value={categoryIds}
              onValueChange={onCategoryChange}
              multiple
              placeholder={
                operation === 'remove' 
                  ? '选择要移除的分类...' 
                  : '选择要分配的分类...'
              }
            />
            {operation !== 'remove' && categoryIds.length === 0 && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                请至少选择一个分类
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button 
              onClick={onSubmit}
              disabled={isProcessing || (operation !== 'remove' && categoryIds.length === 0)}
            >
              {isProcessing ? '处理中...' : '执行操作'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};