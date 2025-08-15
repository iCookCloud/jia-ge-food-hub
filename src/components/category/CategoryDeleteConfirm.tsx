import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface CategoryDeleteConfirmProps {
  categoryName: string;
  hasChildren: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const CategoryDeleteConfirm: React.FC<CategoryDeleteConfirmProps> = ({
  categoryName,
  hasChildren,
  onConfirm,
  onCancel,
  isDeleting = false
}) => {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <CardTitle>确认删除</CardTitle>
        </div>
        <CardDescription>
          确定要删除分类 "{categoryName}" 吗？
          {hasChildren && ' 这将同时删除所有子分类。'}
          此操作无法撤销。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            取消
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '删除中...' : '删除'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};