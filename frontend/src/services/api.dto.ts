export interface PageResponseDTO<T> {
	content: T[];
	page: number;
	limit: number;
}