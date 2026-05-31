import { X, Crown, Shield, UserPlus, UserMinus, LogOut, Trash2, Camera, Edit2, Users, MoreVertical, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Avatar from '../Avatar';
import styles from '../../styles/chat/ChatDetailsModal.module.css';
import { MemberRole, type ChatMember, type ChatPreview, type UpdateChatRequest } from '../../services/chat/chat.types';
import chatService from '../../services/chat/chat.service';
import { useAuth } from '../../contexts/AuthContext';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { createPortal } from 'react-dom';
import { ContactStatus } from '../../services/contact/contact.types';
import { useTranslation } from 'react-i18next';

interface ChatDetailsModalProps {
	chat: ChatPreview;
	onClose: () => void;
	onLeaveGroup: () => void;
	onDeleteGroup: () => void;
	onAddMembers: () => void;
	onTransferOwnership: (memberId: string) => void;
	onKickMember: (memberId: string) => void;
	onUpdateChat: (updates?: UpdateChatRequest, file?: File) => Promise<ChatPreview>;
	onPromoteMember: (memberId: string, newRole: MemberRole) => void;
	onSendContactRequest: (memberUsername: string) => void;
}

export default function ChatDetailsModal({
	chat,
	onClose,
	onLeaveGroup,
	onDeleteGroup,
	onTransferOwnership,
	onKickMember,
	onAddMembers,
	onUpdateChat,
	onPromoteMember,
	onSendContactRequest
}: ChatDetailsModalProps) {
	const [isEditingName, setIsEditingName] = useState(false);
	const [newGroupName, setNewGroupName] = useState(chat.chatName);
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const [showSearch, setShowSearch] = useState(false);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	const { user } = useAuth();
	const { t } = useTranslation("chat");

	const userId = user?.id || '';
	const isAdmin = chat.role === MemberRole.ADMIN;
	const isModerator = chat.role === MemberRole.MODERATOR;
	const canManageMembers = isAdmin || isModerator;

	const [members, setMembers] = useState<ChatMember[]>([]);
	const [loadingMembers, setLoadingMembers] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [totalMembers, setTotalMembers] = useState(0);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setOpenDropdownId(null);
				setDropdownPos(null);
			}
		};

		if (openDropdownId) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [openDropdownId]);

	useEffect(() => {
		updateMemberRole(userId, chat.role);
	}, [chat.role]);

	useEffect(() => {
		fetchMembers(0, false);
	}, [chat.chatId, debouncedSearch]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 300);

		return () => clearTimeout(timeout);
	}, [search]);

	const fetchMembers = async (pageNumber = 0, append = false) => {
		try {
			setLoadingMembers(true);

			const res = await chatService.getChatMembers(chat.chatId, pageNumber, 20, debouncedSearch);

			setMembers(prev =>
				append ? [...prev, ...res.content] : res.content
			);

			setHasMore(res.hasNext);
			setPage(pageNumber);
			setTotalMembers(res.totalElements);
		} catch (err: any) {
		} finally {
			setLoadingMembers(false);
		}
	};

	const loadMoreMembers = async () => {
		if (loadingMembers || !hasMore) return;

		await fetchMembers(page + 1, true);
	};

	const { containerRef } = useInfiniteScroll(
		loadMoreMembers,
		hasMore,
		loadingMembers,
		{
			threshold: 120,
			enabled: true
		}
	);

	const handleImageChange = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];

		if (!file) return;

		try {
			const updatedChat = await onUpdateChat(undefined, file);

			chat.chatImageUrl = updatedChat.chatImageUrl;
		} catch (error) {
			console.error(error);
		}
	};

	const handleSaveName = async () => {
		if (
			newGroupName.trim() &&
			newGroupName !== chat.chatName
		) {
			try {
				const updatedChat = await onUpdateChat({
					chatName: newGroupName.trim()
				});

				chat.chatName = updatedChat.chatName;
			} catch (error) {
				console.error(error);
			}
		}

		setIsEditingName(false);
	};

	const getRoleIcon = (role: MemberRole) => {
		if (role === MemberRole.ADMIN) return <Crown size={14} className={styles.roleIcon} />;
		if (role === MemberRole.MODERATOR) return <Shield size={14} className={styles.roleIcon} />;
		return null;
	};

	const getRoleLabel = (role: MemberRole) => {
		if (role === MemberRole.ADMIN) return 'Admin';
		if (role === MemberRole.MODERATOR) return 'Moderator';
		return '';
	};

	const updateMemberRole = (memberId: string, role: MemberRole) => {
		setMembers(prev => prev.map(member => (
			member.memberId === memberId
				? {
					...member,
					role: role
				}
				: member
		)
		));
	}

	const kickMember = (memberId: string) => {
		setMembers(prev =>
			prev.filter(member =>
				member.memberId !== memberId
			)
		);

		setTotalMembers(prev => prev - 1);
	}

	return (
		<>
			<div className={styles.overlay} onClick={onClose} />
			<div className={styles.modal}>
				<div className={styles.header}>
					<h2 className={styles.title}>{t("modal.title")}</h2>
					<button className={styles.closeBtn} onClick={onClose}>
						<X size={24} />
					</button>
				</div>

				<div className={styles.content}>
					{/* Group Image & Name */}
					<div className={styles.groupInfo}>
						<div className={styles.avatarWrapper}>
							<Avatar
								name={chat.chatName}
								src={chat.chatImageUrl}
								size="xl"
							/>
							{isAdmin && (
								<label className={styles.editImageBtn}>
									<Camera size={18} />
									<input
										type="file"
										accept="image/*"
										onChange={handleImageChange}
										hidden
									/>
								</label>
							)}
						</div>

						{isEditingName ? (
							<div className={styles.nameEdit}>
								<input
									type="text"
									value={newGroupName}
									onChange={(e) => setNewGroupName(e.target.value)}
									className={styles.nameInput}
									autoFocus
									maxLength={50}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleSaveName();
										if (e.key === 'Escape') {
											setNewGroupName(chat.chatName);
											setIsEditingName(false);
										}
									}}
								/>
								<div className={styles.nameEditActions}>
									<button
										className={styles.cancelBtn}
										onClick={() => {
											setNewGroupName(chat.chatName);
											setIsEditingName(false);
										}}
									>
										{t("cancel")}
									</button>
									<button
										className={styles.saveBtn}
										onClick={handleSaveName}
									>
										{t("save")}
									</button>
								</div>
							</div>
						) : (
							<div className={styles.nameDisplay}>
								<h3 className={styles.groupName}>{chat.chatName}</h3>
								{isAdmin && (
									<button
										className={styles.editNameBtn}
										onClick={() => setIsEditingName(true)}
									>
										<Edit2 size={16} />
									</button>
								)}
							</div>
						)}
					</div>

					{/* Members Section */}
					<div className={`${styles.section} ${styles.membersSection}`}>
						<div className={styles.sectionHeader}>
							<div className={styles.sectionTitle}>
								<Users size={18} />
								<span>{t("modal.members")} ({totalMembers})</span>
							</div>

							<div className={styles.sectionActions}>
								<button
									className={styles.searchBtn}
									onClick={() => {
										if (showSearch) {
											setSearch('');
										}

										setShowSearch(prev => !prev);
									}}
								>
									<Search size={18} />
								</button>

								{canManageMembers && (
									<button
										className={styles.addMemberBtn}
										onClick={onAddMembers}
									>
										<UserPlus size={18} />
										<span>{t("add")}</span>
									</button>
								)}
							</div>
						</div>

						{showSearch && (
							<div className={styles.searchWrapper}>
								<Search size={16} className={styles.searchIcon} />

								<input
									type="text"
									placeholder={t("search")}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className={styles.searchInput}
									autoFocus
								/>

								<button
									className={styles.closeSearchBtn}
									onClick={() => {
										setShowSearch(false);
										setSearch('');
									}}
								>
									<X size={16} />
								</button>
							</div>
						)}

						<div className={styles.membersList} ref={containerRef}>
							{members.map((member) => {
								const memberId = member.memberId;
								const isCurrentUser = memberId === userId;
								const canModifyMember = (
									(isAdmin && member.role !== MemberRole.ADMIN) ||
									(isModerator && member.role === MemberRole.MEMBER)
								);
								const showContactRequest = (member.status === null || member.status === undefined) && !isCurrentUser;

								return (
									<div key={memberId} className={styles.memberItem}>
										<Avatar
											name={member.displayName}
											src={member.avatarUrl}
											size="sm"
										/>
										<div className={styles.memberInfo}>
											<div className={styles.memberText}>
												<div className={styles.memberDisplayName}>
													{member.displayName}
												</div>

												<div className={styles.memberUsername}>
													@{member.username}
												</div>
											</div>

											{member.role !== MemberRole.MEMBER && (
												<span className={styles.roleTag}>
													{getRoleIcon(member.role)}
													{getRoleLabel(member.role)}
												</span>
											)}
										</div>

										{showContactRequest && (
											<button
												className={styles.contactRequestBtn}
												onClick={async () => {
													try {
														await onSendContactRequest?.(member.username);

														setMembers(prev => prev.map(member => (
															member.memberId === memberId
																? {
																	...member,
																	status: ContactStatus.PENDING,
																}
																: member
														)

														));
													} catch (error) {
														console.error(error)
													}
												}}
												title="Send contact request"
											>
												<UserPlus size={16} />
											</button>
										)}

										{canModifyMember && (
											<div className={styles.dropdownWrapper} ref={openDropdownId === memberId ? dropdownRef : null}>
												<button
													className={styles.moreBtn}
													onClick={(e) => {
														if (openDropdownId === memberId) {
															setOpenDropdownId(null);
															setDropdownPos(null);
														} else {
															const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
															setDropdownPos({
																top: rect.bottom + 4,
																right: window.innerWidth - rect.right,
															});
															setOpenDropdownId(memberId);
														}
													}}
												>
													<MoreVertical size={18} />
												</button>

												{openDropdownId === memberId && dropdownPos && createPortal(
													<div
														ref={dropdownRef}
														className={styles.dropdown}
														style={{
															position: 'fixed',
															top: dropdownPos.top,
															right: dropdownPos.right,
															zIndex: 9999,
														}}
													>
														{isAdmin && (
															<>
																{member.role === MemberRole.MEMBER && (
																	<button
																		className={styles.dropdownItem}
																		onClick={() => {
																			onPromoteMember?.(memberId, MemberRole.MODERATOR);
																			updateMemberRole(memberId, MemberRole.MODERATOR);
																			setOpenDropdownId(null);
																		}}
																	>
																		<ArrowUp size={16} />
																		<span>{t("modal.actions.promote")}</span>
																	</button>
																)}
																{member.role === MemberRole.MODERATOR && (
																	<>
																		<button
																			className={styles.dropdownItem}
																			onClick={() => {
																				onPromoteMember?.(memberId, MemberRole.MEMBER);
																				updateMemberRole(memberId, MemberRole.MEMBER);
																				setOpenDropdownId(null);
																			}}
																		>
																			<ArrowDown size={16} />
																			<span>{t("modal.actions.demote")}</span>
																		</button>
																	</>
																)}
																<button
																	className={`${styles.dropdownItem} ${styles.danger}`}
																	onClick={async () => {
																		try {
																			await onTransferOwnership?.(memberId);

																			setMembers(prev =>
																				prev.map(member => {
																					if (member.memberId === memberId) {
																						return {
																							...member,
																							role: MemberRole.ADMIN
																						};
																					}

																					if (member.memberId === userId) {
																						return {
																							...member,
																							role: MemberRole.MODERATOR
																						};
																					}

																					return member;
																				})
																			);
																		} finally {
																			setOpenDropdownId(null);
																		}
																	}}
																>
																	<Crown size={16} />
																	<span>{t("modal.actions.transferOwnership")}</span>
																</button>
															</>
														)}
														<button
															className={`${styles.dropdownItem} ${styles.danger}`}
															onClick={() => {
																onKickMember?.(memberId);
																kickMember(memberId);
																setOpenDropdownId(null);
															}}
														>
															<UserMinus size={16} />
															<span>{t("modal.actions.kick")}</span>
														</button>
													</div>,
													document.body
												)}
											</div>
										)}
									</div>
								);
							})}

							{loadingMembers && (
								<div className={styles.membersLoading}>
									{t("loading")}
								</div>
							)}

							{!loadingMembers && members.length === 0 && (
								<div className={styles.membersEmpty}>
									{t("noMembers")}
								</div>
							)}
						</div>
					</div>

					{/* Leave Group / Delete Group */}
					<div className={styles.section}>
						{isAdmin ? (
							<button
								className={`${styles.actionBtn} ${styles.danger}`}
								onClick={onDeleteGroup}
							>
								<Trash2 size={18} />
								<span>{t("modal.actions.deleteChat")}</span>
							</button>
						) : (
							<button
								className={styles.leaveBtn}
								onClick={onLeaveGroup}
							>
								<LogOut size={18} />
								<span>{t("modal.actions.leaveGroup")}</span>
							</button>
						)}
					</div>
				</div>
			</div>
		</>
	);
}