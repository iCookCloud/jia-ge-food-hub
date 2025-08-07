import { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  children: React.ReactNode;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  hasNextPage,
  isLoading,
  onLoadMore,
  threshold = 300,
  children
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || isLoading || !hasNextPage) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceToBottom < threshold) {
        onLoadMore();
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [hasNextPage, isLoading, onLoadMore, threshold]);

  // 检查窗口滚动
  useEffect(() => {
    const handleWindowScroll = () => {
      if (isLoading || !hasNextPage) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceToBottom < threshold) {
        onLoadMore();
      }
    };

    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [hasNextPage, isLoading, onLoadMore, threshold]);

  return (
    <div ref={scrollRef} className="h-full overflow-auto">
      {children}
    </div>
  );
};