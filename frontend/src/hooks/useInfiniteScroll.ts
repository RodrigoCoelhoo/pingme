import {
	useRef,
	useEffect,
	useCallback,
	useState
} from 'react';

interface UseInfiniteScrollOptions {
	threshold?: number;
	enabled?: boolean;
	direction?: 'top' | 'bottom';
	preserveScrollPosition?: boolean;
	bottomThreshold?: number;
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
		bottomThreshold = 100
	} = options;

	const containerRef = useRef<HTMLDivElement>(null);
	const isFetchingRef = useRef(false);
	const previousScrollHeightRef = useRef(0);
	const isAtBottomRef = useRef(false);
	const [isAtBottom, setIsAtBottom] = useState(false);

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
		if (!container) return;

		const atBottom = checkIfAtBottom();
		isAtBottomRef.current = atBottom;
		setIsAtBottom(atBottom);

		if (!enabled || isLoading || !hasMore || isFetchingRef.current) return;

		const { scrollTop, scrollHeight, clientHeight } = container;

		if (direction === 'top') {
			if (scrollTop <= threshold) {
				isFetchingRef.current = true;
				container.scrollTop = threshold + 1;
				if (preserveScrollPosition) {
					previousScrollHeightRef.current = scrollHeight;
				}
				onLoadMore();
			}
		} else {
			const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
			if (distanceFromBottom <= threshold) {
				isFetchingRef.current = true;
				onLoadMore();
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

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		if (isLoading) return;

		isFetchingRef.current = false;

		if (direction === 'top' && preserveScrollPosition) {
			requestAnimationFrame(() => {
				const newScrollHeight = container.scrollHeight;
				const heightDifference = newScrollHeight - previousScrollHeightRef.current;
				if (heightDifference > 0) {
					container.scrollTop += heightDifference;
					setTimeout(() => {
						const atBottom = checkIfAtBottom();
						isAtBottomRef.current = atBottom;
						setIsAtBottom(atBottom);
					}, 0);
				}
			});
		}
	}, [isLoading, direction, preserveScrollPosition, checkIfAtBottom]);

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