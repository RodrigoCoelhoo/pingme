import api from '../api';
import type { PageResponseDTO } from '../api.dto';
import type { ContactResponse, ContactStatus } from './contact.types';

class ContactService {
	async getContacts(
		status: ContactStatus,
		page: number = 0,
		limit: number = 20
	): Promise<PageResponseDTO<ContactResponse>> {
		const response = await api.get<PageResponseDTO<ContactResponse>>('/contacts', {
			params: { status, page, limit }
		});
		return response.data;
	}

	async addContactByUsername(username: string): Promise<ContactResponse> {
		const response = await api.post<ContactResponse>('/contacts', { username });
		return response.data;
	}
}

export default new ContactService();