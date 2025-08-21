import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InlineQuantityEditorProps {
  materialId: string;
  materialType: 'video' | 'image';
  currentQuantity: number;
  onUpdate: (newQuantity: number) => void;
  onCancel?: () => void;
}

export const InlineQuantityEditor: React.FC<InlineQuantityEditorProps> = ({
  materialId,
  materialType,
  currentQuantity,
  onUpdate,
  onCancel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(currentQuantity);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 开始编辑时聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 处理保存
  const handleSave = async () => {
    if (quantity < 0) {
      toast.error('数量不能为负数');
      return;
    }

    setSaving(true);
    try {
      // 直接更新对应的表
      const tableName = materialType === 'video' ? 'product_videos' : 'uploaded_images';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          quantity: quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', materialId);

      if (updateError) {
        throw updateError;
      }

      onUpdate(quantity);
      setIsEditing(false);
      toast.success('推荐数量更新成功');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setQuantity(currentQuantity);
    setIsEditing(false);
    onCancel?.();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };


  if (!isEditing) {
    // 显示模式 - 双击进入编辑
    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
        onDoubleClick={() => setIsEditing(true)}
        title="双击编辑推荐数量"
      >
        <Package className="w-3 h-3" />
        <span className="text-sm text-gray-600">推荐:</span>
        <span className="font-medium">{currentQuantity}</span>
      </div>
    );
  }

  // 编辑模式
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-white shadow-sm">
      <Package className="w-3 h-3 text-gray-500" />
      <span className="text-sm text-gray-600">推荐:</span>
      
      {/* 数量输入 */}
      <Input
        ref={inputRef}
        type="number"
        min="0"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
        onKeyDown={handleKeyDown}
        className="w-20 h-8 text-sm"
        disabled={saving}
      />

      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={saving}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={saving}
          className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* 提示信息 */}
      {quantity !== currentQuantity && (
        <div className="flex items-center gap-1 text-xs text-orange-600">
          <AlertCircle className="w-3 h-3" />
          <span>未保存</span>
        </div>
      )}
    </div>
  );
};

export default InlineQuantityEditor;