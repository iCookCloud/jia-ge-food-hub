import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';
import { batchService, ImportResult } from '@/services/batchService';

interface BatchImportProps {
  type: 'products' | 'suppliers';
  onImportComplete?: (result: ImportResult) => void;
}

export const BatchImport: React.FC<BatchImportProps> = ({ 
  type, 
  onImportComplete 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getTypeConfig = () => {
    const configs = {
      products: {
        title: '批量导入商品',
        description: '支持批量导入商品信息，包括名称、价格、规格等',
        sampleData: batchService.getImportTemplate('products')
      },
      suppliers: {
        title: '批量导入供应商',
        description: '支持批量导入供应商信息，包括公司名称、联系方式等',
        sampleData: batchService.getImportTemplate('suppliers')
      }
    };
    return configs[type];
  };

  const config = getTypeConfig();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: '文件格式错误',
        description: '请选择CSV格式的文件',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    parseCSVFile(selectedFile);
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      const parsed = batchService.parseCSV(csvContent);
      setParsedData(parsed);
      
      if (parsed.length > 0) {
        toast({
          title: '文件解析成功',
          description: `解析到 ${parsed.length} 条数据`
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file || parsedData.length === 0) {
      toast({
        title: '请先选择文件',
        description: '请选择有效的CSV文件进行导入',
        variant: 'destructive'
      });
      return;
    }

    try {
      setImporting(true);
      
      let result: ImportResult;
      if (type === 'products') {
        result = await batchService.importProducts(parsedData);
      } else {
        result = await batchService.importSuppliers(parsedData);
      }

      setImportResult(result);
      onImportComplete?.(result);

      if (result.success > 0) {
        toast({
          title: '导入完成',
          description: `成功导入 ${result.success} 条数据${result.failed > 0 ? `，失败 ${result.failed} 条` : ''}`
        });
      } else {
        toast({
          title: '导入失败',
          description: '所有数据导入失败，请检查数据格式',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = Object.keys(config.sampleData);
    const csvContent = [
      headers.join(','),
      Object.values(config.sampleData).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_template.csv`;
    link.click();
  };

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {config.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {config.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 下载模板 */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">导入模板</p>
              <p className="text-sm text-muted-foreground">
                下载标准的导入模板文件
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            下载模板
          </Button>
        </div>

        <Separator />

        {/* 文件选择 */}
        <div className="space-y-4">
          <Label htmlFor="csv-file" className="text-sm font-medium">
            选择CSV文件
          </Label>
          <div className="flex gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={importing}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={importing}
            >
              选择文件
            </Button>
          </div>
          
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <Badge variant="secondary">
                {parsedData.length} 条数据
              </Badge>
            </div>
          )}
        </div>

        {/* 数据预览 */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">数据预览</Label>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {Object.keys(parsedData[0]).map((header, index) => (
                        <th key={index} className="px-3 py-2 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {Object.values(row).map((cell: any, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <div className="px-3 py-2 bg-muted text-sm text-muted-foreground">
                  显示前5条，共 {parsedData.length} 条数据
                </div>
              )}
            </div>
          </div>
        )}

        {/* 导入按钮 */}
        <div className="flex gap-4">
          <Button 
            onClick={handleImport}
            disabled={!file || parsedData.length === 0 || importing}
            className="gap-2"
          >
            {importing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                开始导入
              </>
            )}
          </Button>
          
          {(file || importResult) && (
            <Button 
              variant="outline" 
              onClick={resetImport}
              disabled={importing}
            >
              重新选择
            </Button>
          )}
        </div>

        {/* 导入进度 */}
        {importing && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">导入进度</Label>
            <Progress value={75} className="w-full" />
            <p className="text-sm text-muted-foreground">
              正在处理数据，请稍候...
            </p>
          </div>
        )}

        {/* 导入结果 */}
        {importResult && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">导入结果</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">成功</p>
                    <p className="text-sm text-green-700">{importResult.success} 条</p>
                  </div>
                </CardContent>
              </Card>
              
              {importResult.failed > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">失败</p>
                      <p className="text-sm text-red-700">{importResult.failed} 条</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">总计</p>
                    <p className="text-sm text-blue-700">
                      {importResult.success + importResult.failed} 条
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 错误详情 */}
            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">错误详情</Label>
                <div className="border border-red-200 rounded-lg p-3 bg-red-50 max-h-32 overflow-auto">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};