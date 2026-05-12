import { useState, useCallback } from 'react';

export interface ConfirmationConfig {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: 'danger' | 'warning' | 'info';
}

export function useConfirmation() {
	const [isOpen, setIsOpen] = useState(false);
	const [config, setConfig] = useState<ConfirmationConfig | null>(null);
	const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

	const confirm = useCallback((config: ConfirmationConfig): Promise<boolean> => {
		setConfig(config);
		setIsOpen(true);

		return new Promise((resolve) => {
			setResolver(() => resolve);
		});
	}, []);

	const handleConfirm = useCallback(() => {
		if (resolver) {
			resolver(true);
		}
		setIsOpen(false);
		setConfig(null);
		setResolver(null);
	}, [resolver]);

	const handleCancel = useCallback(() => {
		if (resolver) {
			resolver(false);
		}
		setIsOpen(false);
		setConfig(null);
		setResolver(null);
	}, [resolver]);

	return {
		isOpen,
		config,
		confirm,
		handleConfirm,
		handleCancel,
	};
}