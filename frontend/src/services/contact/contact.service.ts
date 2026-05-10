import api from '../api';
import type { PagedResponse } from '../api.types';
import type { ContactAction, ContactResponse, ContactStatus, PendingType } from './contact.types';

class ContactService {
	async getContacts(
		status: ContactStatus,
		page: number = 0,
		limit: number = 20,
		search: string = '',
		pendingType: PendingType | null = null
	): Promise<PagedResponse<ContactResponse>> {
		const response = await api.get<PagedResponse<ContactResponse>>('/contacts', {
			params: { status, page, limit, search, pendingType }
		});

		return response.data;
	}

	async addContactByUsername(username: string): Promise<ContactResponse> {
		const response = await api.post<ContactResponse>('/contacts', { username });
		return response.data;
	}

	async handleContactRequest(contactId: string, action: ContactAction): Promise<void> {
		const params = new URLSearchParams({
			action: action.toString(),
		});
		await api.put(`/contacts/${contactId}?${params.toString()}`);
	}

	async deleteContact(contactId: string): Promise<void> {
		await api.delete(`/contacts/${contactId}`);
	}
}

export default new ContactService();