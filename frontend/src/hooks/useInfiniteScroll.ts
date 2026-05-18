import {
	useRef,
	useEffect,
	useCallback,
	useState,
	useLayoutEffect
} from 'react';

interface UseInfiniteScrollOptions {
	threshold?: number;
	enabled?: boolean;
	direction?: 'top' | 'bottom';
	preserveScrollPosition?: boolean;
	bottomThreshold?: number;
	dependency?: any;
}

export function useInfiniteScroll(
	onLoadMore: () => Promise<void> | void,
	hasMore: boolean,
	isLoading: boolean,
	options: UseInfiniteScrollOptions = {}
) {
	const {
		threshold = 100,
		enabled = true,
		direction = 'top',
		preserveScrollPosition = true,
		bottomThreshold = 100,
		dependency
	} = options;

	const containerRef = useRef<HTMLDivElement>(null);
	const isFetchingRef = useRef(false);
	const previousScrollHeightRef = useRef(0);
	const isAtBottomRef = useRef(false);
	const [isAtBottom, setIsAtBottom] = useState(false);

	const lastFetchTimeRef = useRef(0);

	const checkIfAtBottom = useCallback(() => {
		const container = containerRef.current;
		if (!container) {
			return false;
		}

		const { scrollHeight, scrollTop, clientHeight } = container;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

		if (scrollHeight <= clientHeight) {
			return false;
		}

		return distanceFromBottom <= bottomThreshold;
	}, [bottomThreshold]);

	const scrollToBottom = useCallback(
		(behavior: ScrollBehavior = 'auto') => {
			const container = containerRef.current;
			if (!container) return;

			requestAnimationFrame(() => {
				container.scrollTo({ top: container.scrollHeight, behavior });
				setTimeout(() => {
					const atBottom = checkIfAtBottom();
					isAtBottomRef.current = atBottom;
					setIsAtBottom(atBottom);
				}, 50);
			});
		},
		[checkIfAtBottom]
	);

	const handleScroll = useCallback(() => {
		const container = containerRef.current;

		if (!container) {
			return;
		}

		const atBottom = checkIfAtBottom();
		isAtBottomRef.current = atBottom;
		setIsAtBottom(atBottom);

		if (!enabled || isLoading || !hasMore || isFetchingRef.current) {
			return;
		}

		const { scrollTop, scrollHeight, clientHeight } = container;

		if (direction === 'top') {

			if (scrollTop <= threshold) {

				const now = Date.now();

				// Prevent instant re-fetch after scroll restoration
				if (now - lastFetchTimeRef.current < 300) {
					return;
				}

				lastFetchTimeRef.current = now;
				isFetchingRef.current = true;

				// Save height before loading new messages
				if (preserveScrollPosition) {
					previousScrollHeightRef.current = scrollHeight;
				}

				Promise.resolve(onLoadMore())
					.finally(() => {
						isFetchingRef.current = false;
					});
			}

		} else {
			const distanceFromBottom =scrollHeight - scrollTop - clientHeight;
			
			if (distanceFromBottom <= threshold) {
				const now = Date.now();
				if (now - lastFetchTimeRef.current < 300) {
					return;
				}

				lastFetchTimeRef.current = now;
				isFetchingRef.current = true;

				Promise.resolve(onLoadMore())
					.finally(() => {
						isFetchingRef.current = false;
					});
			}
		}
	}, [
		enabled,
		isLoading,
		hasMore,
		threshold,
		direction,
		preserveScrollPosition,
		checkIfAtBottom,
		onLoadMore
	]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		container.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			container.removeEventListener('scroll', handleScroll);
		};
	}, [handleScroll]);

	useLayoutEffect(() => {
		const container = containerRef.current;

		if (!container) {
			return;
		}

		if (
			direction === 'top' &&
			preserveScrollPosition &&
			previousScrollHeightRef.current > 0
		) {
			const oldHeight = previousScrollHeightRef.current;
			const newHeight = container.scrollHeight;
			const diff = newHeight - oldHeight;

			container.scrollTop += diff;

			previousScrollHeightRef.current = 0;
		}
	}, [dependency]);

	const updateBottomState = useCallback(() => {
		const atBottom = checkIfAtBottom();
		isAtBottomRef.current = atBottom;
		setIsAtBottom(atBottom);
	}, [checkIfAtBottom]);

	return {
		containerRef,
		isAtBottom,
		scrollToBottom,
		updateBottomState
	};
}