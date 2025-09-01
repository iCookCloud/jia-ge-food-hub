import * as React from "react"
import { X, Maximize2, Minimize2, Move } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface VR360ViewerDialogProps {
  isOpen: boolean
  onClose: () => void
  vrUrl: string
  title?: string
}

export function VR360ViewerDialog({ 
  isOpen, 
  onClose, 
  vrUrl, 
  title = "360度案例展示" 
}: VR360ViewerDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 100, y: 100 })
  const [size, setSize] = React.useState({ width: 800, height: 600 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  
  const dialogRef = React.useRef<HTMLDivElement>(null)

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullscreen) return
    
    const rect = dialogRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  // 处理拖拽移动
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isFullscreen) return
      
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, isFullscreen])

  // 处理调整大小
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isFullscreen) return
    e.stopPropagation()
    setIsResizing(true)
  }

  React.useEffect(() => {
    const handleResizeMouseMove = (e: MouseEvent) => {
      if (!isResizing || isFullscreen) return
      
      const newWidth = Math.max(400, e.clientX - position.x)
      const newHeight = Math.max(300, e.clientY - position.y)
      
      setSize({ width: newWidth, height: newHeight })
    }

    const handleResizeMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove)
      document.addEventListener('mouseup', handleResizeMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove)
      document.removeEventListener('mouseup', handleResizeMouseUp)
    }
  }, [isResizing, position, isFullscreen])

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // ESC键关闭
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isFullscreen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 z-50 bg-black/20"
        onClick={() => !isFullscreen && onClose()}
      />
      
      {/* 窗口容器 */}
      <div
        ref={dialogRef}
        className={cn(
          "fixed z-50 bg-background border shadow-lg",
          isFullscreen 
            ? "inset-4 rounded-lg" 
            : "rounded-lg",
          isDragging && "select-none"
        )}
        style={
          isFullscreen 
            ? {} 
            : {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
              }
        }
      >
        {/* 标题栏 */}
        <div 
          className={cn(
            "flex items-center justify-between p-3 border-b bg-muted/10",
            !isFullscreen && "cursor-move"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-6 w-6 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 relative overflow-hidden">
          <iframe
            src={vrUrl}
            className="w-full h-full border-0"
            style={{ 
              height: isFullscreen 
                ? 'calc(100vh - 8rem - 49px)' 
                : `${size.height - 49}px` 
            }}
            allowFullScreen
            title="360度案例展示"
          />
        </div>

        {/* 调整大小手柄 */}
        {!isFullscreen && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-muted/50 hover:bg-muted"
            onMouseDown={handleResizeMouseDown}
          >
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-border" />
          </div>
        )}
      </div>
    </>
  )
}