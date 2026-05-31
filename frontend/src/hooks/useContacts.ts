import { useState, useCallback, useEffect } from 'react';
import { ContactAction, ContactStatus, PendingType, type ContactResponse } from '../services/contact/contact.types';
import contactService from '../services/contact/contact.service';

const CONTACTS_PAGE_SIZE = 20;

interface UseContactsProps {
	searchQuery?: string;
}

export function useContacts({ searchQuery = '' }: UseContactsProps = {}) {
	// Accepted contacts
	const [acceptedContacts, setAcceptedContacts] = useState<ContactResponse[]>([]);
	const [acceptedPage, setAcceptedPage] = useState(0);
	const [acceptedHasMore, setAcceptedHasMore] = useState(true);
	const [isLoadingAccepted, setIsLoadingAccepted] = useState(false);

	// Received pending
	const [receivedPending, setReceivedPending] = useState<ContactResponse[]>([]);
	const [receivedPendingPage, setReceivedPendingPage] = useState(0);
	const [receivedPendingHasMore, setReceivedPendingHasMore] = useState(true);
	const [isLoadingReceivedPending, setIsLoadingReceivedPending] = useState(false);

	// Sent pending
	const [sentPending, setSentPending] = useState<ContactResponse[]>([]);
	const [sentPendingPage, setSentPendingPage] = useState(0);
	const [sentPendingHasMore, setSentPendingHasMore] = useState(true);
	const [isLoadingSentPending, setIsLoadingSentPending] = useState(false);

	const loadAcceptedContacts = useCallback(async (page: number, search: string, append: boolean = false) => {
		setIsLoadingAccepted(true);
		try {
			const response = await contactService.getContacts(
				ContactStatus.ACCEPTED,
				page,
				CONTACTS_PAGE_SIZE,
				search
			);

			if (append) {
				setAcceptedContacts(prev => [...prev, ...response.content]);
			} else {
				setAcceptedContacts(response.content);
			}

			setAcceptedHasMore(response.hasNext);
			setAcceptedPage(page);
		} catch (error) {
			console.error('Error loading accepted contacts:', error);
		} finally {
			setIsLoadingAccepted(false);
		}
	}, []);

	const loadReceivedPending = useCallback(async (page: number, search: string, append: boolean = false) => {
		setIsLoadingReceivedPending(true);
		try {
			const response = await contactService.getContacts(
				ContactStatus.PENDING,
				page,
				CONTACTS_PAGE_SIZE,
				search,
				PendingType.RECEIVED
			);

			if (append) {
				setReceivedPending(prev => [...prev, ...response.content]);
			} else {
				setReceivedPending(response.content);
			}

			setReceivedPendingHasMore(response.hasNext);
			setReceivedPendingPage(page);
		} catch (error) {
			console.error('Error loading received pending contacts:', error);
		} finally {
			setIsLoadingReceivedPending(false);
		}
	}, []);

	const loadSentPending = useCallback(async (page: number, search: string, append: boolean = false) => {
		setIsLoadingSentPending(true);
		try {
			const response = await contactService.getContacts(
				ContactStatus.PENDING,
				page,
				CONTACTS_PAGE_SIZE,
				search,
				PendingType.SENT
			);

			if (append) {
				setSentPending(prev => [...prev, ...response.content]);
			} else {
				setSentPending(response.content);
			}

			setSentPendingHasMore(response.hasNext);
			setSentPendingPage(page);
		} catch (error) {
			console.error('Error loading sent pending contacts:', error);
		} finally {
			setIsLoadingSentPending(false);
		}
	}, []);

	// Initial load
	useEffect(() => {
		loadAcceptedContacts(0, '');
		loadReceivedPending(0, '');
		loadSentPending(0, '');
	}, [loadAcceptedContacts, loadReceivedPending, loadSentPending]);

	// Search handler with debounce
	useEffect(() => {
		const timer = setTimeout(() => {
			const search = searchQuery.trim();
			loadAcceptedContacts(0, search);
			loadReceivedPending(0, search);
			loadSentPending(0, search);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, loadAcceptedContacts, loadReceivedPending, loadSentPending]);

	// Load more functions
	const loadMoreAccepted = useCallback(() => {
		if (!isLoadingAccepted && acceptedHasMore) {
			loadAcceptedContacts(acceptedPage + 1, searchQuery, true);
		}
	}, [isLoadingAccepted, acceptedHasMore, acceptedPage, searchQuery, loadAcceptedContacts]);

	const loadMoreReceivedPending = useCallback(() => {
		if (!isLoadingReceivedPending && receivedPendingHasMore) {
			loadReceivedPending(receivedPendingPage + 1, searchQuery, true);
		}
	}, [isLoadingReceivedPending, receivedPendingHasMore, receivedPendingPage, searchQuery, loadReceivedPending]);

	const loadMoreSentPending = useCallback(() => {
		if (!isLoadingSentPending && sentPendingHasMore) {
			loadSentPending(sentPendingPage + 1, searchQuery, true);
		}
	}, [isLoadingSentPending, sentPendingHasMore, sentPendingPage, searchQuery, loadSentPending]);

	// Actions
	const handleAcceptContact = async (contactId: string) => {
		try {
			await contactService.handleContactRequest(contactId, ContactAction.ACCEPT);

			const contact = receivedPending.find(c => c.contactId === contactId);
			if (contact) {
				setReceivedPending(prev => prev.filter(c => c.contactId !== contactId));
				setAcceptedContacts(prev => [{ ...contact, status: ContactStatus.ACCEPTED }, ...prev]);
			}
		} catch (error) {
			console.error('Error accepting contact:', error);
			throw error;
		}
	};

	const handleRejectContact = async (contactId: string) => {
		try {
			await contactService.handleContactRequest(contactId, ContactAction.REJECT);
			setReceivedPending(prev => prev.filter(c => c.contactId !== contactId));
		} catch (error) {
			console.error('Error rejecting contact:', error);
			throw error;
		}
	};

	const handleCancelRequest = async (contactId: string) => {
		try {
			await contactService.handleContactRequest(contactId, ContactAction.CANCEL);
			setSentPending(prev => prev.filter(c => c.contactId !== contactId));
		} catch (error) {
			console.error('Error canceling contact request:', error);
			throw error;
		}
	};

	const handleAddContact = async (username: string) => {
		try {
			const newContact = await contactService.addContactByUsername(username);
			setSentPending(prev => [newContact, ...prev]);
		} catch (error) {
			console.error('Error adding contact:', error);
			throw error;
		}
	};

	const handleDeleteContact = async (contactId: string) => {
		try {
			await contactService.deleteContact(contactId);
			setAcceptedContacts(prev => prev.filter(c => c.contactId !== contactId));
		} catch (error) {
			console.error('Error canceling contact request:', error);
			throw error;
		}
	}

	const addSentPendingContact = (contact: ContactResponse) => {
		setSentPending(prev => [contact, ...prev]);
	};

	const addReceivedPendingContact = (contact: ContactResponse) => {
		setReceivedPending(prev => {
			if (prev.some(c => c.contactId === contact.contactId)) {
				return prev;
			}
			return [contact, ...prev];
		});
	};

	const removeSentPendingContact = (contactId: string) => {
		setSentPending(prev =>
			prev.filter(c => c.contactId !== contactId)
		);
	};

	const removeReceivedPendingContact = (contactId: string) => {
		setReceivedPending(prev =>
			prev.filter(c => c.contactId !== contactId)
		);
	};

	const removeAcceptedContact = (contactId: string) => {
		setAcceptedContacts(prev =>
			prev.filter(c => c.contactId !== contactId)
		);
	};

	const addAcceptedContact = (contact: ContactResponse) => {
		setAcceptedContacts(prev => {
			if (prev.some(c => c.contactId === contact.contactId)) {
				return prev;
			}
			return [
				{ ...contact, status: ContactStatus.ACCEPTED },
				...prev
			];
		});
	};

	return {
		// Accepted contacts
		acceptedContacts,
		isLoadingAccepted,
		acceptedHasMore,
		loadMoreAccepted,

		// Received pending
		receivedPending,
		isLoadingReceivedPending,
		receivedPendingHasMore,
		loadMoreReceivedPending,

		// Sent pending
		sentPending,
		isLoadingSentPending,
		sentPendingHasMore,
		loadMoreSentPending,

		// Actions
		handleAcceptContact,
		handleRejectContact,
		handleCancelRequest,
		handleAddContact,
		handleDeleteContact,
		addSentPendingContact,
		addReceivedPendingContact,
		addAcceptedContact,
		removeReceivedPendingContact,
		removeSentPendingContact,
		removeAcceptedContact
	};
}