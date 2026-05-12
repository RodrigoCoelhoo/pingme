import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
	threshold?: number; // Distance from bottom to trigger load (in pixels)
	enabled?: boolean;
}

export function useInfiniteScroll(
	onLoadMore: () => void,
	hasMore: boolean,
	isLoading: boolean,
	options: UseInfiniteScrollOptions = {}
) {
	const { threshold = 100, enabled = true } = options;
	const containerRef = useRef<HTMLDivElement>(null);
	const [isFetching, setIsFetching] = useState(false);

	const handleScroll = useCallback(() => {
		if (!enabled || isLoading || !hasMore || isFetching) return;

		const container = containerRef.current;
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

		if (distanceFromBottom < threshold) {
			setIsFetching(true);
			onLoadMore();
		}
	}, [enabled, isLoading, hasMore, isFetching, threshold, onLoadMore]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		container.addEventListener('scroll', handleScroll);
		return () => container.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	useEffect(() => {
		if (!isLoading) {
			setIsFetching(false);
		}
	}, [isLoading]);

	return { containerRef };
}