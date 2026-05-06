import { X, Crown, Shield, UserPlus, UserMinus, LogOut, Trash2, Camera, Edit2, Users, MoreVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Avatar from '../Avatar';
import styles from '../../styles/chat/ChatDetailsModal.module.css';
import { MemberRole, type ChatMember, type ChatPreview } from '../../services/chat/chat.types';
import chatService from '../../services/chat/chat.service';
import { useAuth } from '../../contexts/AuthContext';

interface ChatDetailsModalProps {
	chat: ChatPreview;
	onClose: () => void;
	onLeaveGroup?: () => void;
	onDeleteGroup?: () => void;
	onTransferOwnership?: (memberId: string) => void;
	onKickMember?: (memberId: string) => void;
	onAddMembers?: () => void;
	onUpdateGroupName?: (name: string) => void;
	onUpdateGroupImage?: (file: File) => void;
	onPromoteMember?: (memberId: string, newRole: MemberRole) => void;
	onSendContactRequest?: (memberId: string) => void;
}

export default function ChatDetailsModal({
	chat,
	onClose,
	onLeaveGroup,
	onDeleteGroup,
	onTransferOwnership,
	onKickMember,
	onAddMembers,
	onUpdateGroupName,
	onUpdateGroupImage,
	onPromoteMember,
	onSendContactRequest
}: ChatDetailsModalProps) {
	const [isEditingName, setIsEditingName] = useState(false);
	const [newGroupName, setNewGroupName] = useState(chat.chatName);
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const { user } = useAuth();

	const userId = user?.id || '';
	const isAdmin = chat.role === MemberRole.ADMIN;
	const isModerator = chat.role === MemberRole.MODERATOR;
	const canManageMembers = isAdmin || isModerator;

	const [members, setMembers] = useState<ChatMember[]>([]);
	const [loadingMembers, setLoadingMembers] = useState(false);
	const [membersError, setMembersError] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [totalMembers, setTotalMembers] = useState(0);


	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setOpenDropdownId(null);
			}
		};

		if (openDropdownId) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [openDropdownId]);

	useEffect(() => {
		fetchMembers(0, false);
	}, [chat.chatId]);

	const fetchMembers = async (pageNumber = 0, append = false) => {
		try {
			setLoadingMembers(true);
			setMembersError(null);

			const res = await chatService.getChatMembers(chat.chatId, pageNumber, 20);

			setMembers(prev =>
				append ? [...prev, ...res.members] : res.members
			);

			setHasMore(members.length === res.totalMembers);
			setPage(pageNumber);
			setTotalMembers(res.totalMembers);
		} catch (err: any) {
			setMembersError(err.message || 'Error loading members');
		} finally {
			setLoadingMembers(false);
		}
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && onUpdateGroupImage) {
			onUpdateGroupImage(file);
		}
	};

	const handleSaveName = () => {
		if (newGroupName.trim() && newGroupName !== chat.chatName && onUpdateGroupName) {
			onUpdateGroupName(newGroupName.trim());
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

	return (
		<>
			<div className={styles.overlay} onClick={onClose} />
			<div className={styles.modal}>
				<div className={styles.header}>
					<h2 className={styles.title}>Group Details</h2>
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
										Cancel
									</button>
									<button
										className={styles.saveBtn}
										onClick={handleSaveName}
									>
										Save
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
					<div className={styles.section}>
						<div className={styles.sectionHeader}>
							<div className={styles.sectionTitle}>
								<Users size={18} />
								<span>Members ({totalMembers})</span>
							</div>
							{canManageMembers && (
								<button
									className={styles.addMemberBtn}
									onClick={onAddMembers}
								>
									<UserPlus size={18} />
									<span>Add</span>
								</button>
							)}
						</div>

						<div className={styles.membersList}>
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
												onClick={() => onSendContactRequest?.(memberId)}
												title="Send contact request"
											>
												<UserPlus size={16} />
											</button>
										)}

										{canModifyMember && (
											<div className={styles.dropdownWrapper} ref={openDropdownId === memberId ? dropdownRef : null}>
												<button
													className={styles.moreBtn}
													onClick={() => setOpenDropdownId(openDropdownId === memberId ? null : memberId)}
												>
													<MoreVertical size={18} />
												</button>

												{openDropdownId === memberId && (
													<div className={styles.dropdown}>
														{isAdmin && (
															<>
																{member.role === MemberRole.MEMBER && (
																	<button
																		className={styles.dropdownItem}
																		onClick={() => {
																			onPromoteMember?.(memberId, MemberRole.MODERATOR);
																			setOpenDropdownId(null);
																		}}
																	>
																		<ArrowUp size={16} />
																		<span>Promote to Moderator</span>
																	</button>
																)}
																{member.role === MemberRole.MODERATOR && (
																	<>
																		<button
																			className={styles.dropdownItem}
																			onClick={() => {
																				onPromoteMember?.(memberId, MemberRole.MEMBER);
																				setOpenDropdownId(null);
																			}}
																		>
																			<ArrowDown size={16} />
																			<span>Demote to Member</span>
																		</button>
																	</>
																)}
																<button
																	className={`${styles.dropdownItem} ${styles.danger}`}
																	onClick={() => {
																		onTransferOwnership?.(memberId);
																		setOpenDropdownId(null);
																	}}
																>
																	<Crown size={16} />
																	<span>Transfer Ownership</span>
																</button>
															</>
														)}
														<button
															className={`${styles.dropdownItem} ${styles.danger}`}
															onClick={() => {
																onKickMember?.(memberId);
																setOpenDropdownId(null);
															}}
														>
															<UserMinus size={16} />
															<span>Kick Member</span>
														</button>
													</div>
												)}
											</div>
										)}
									</div>
								);
							})}
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
								<span>Delete Group</span>
							</button>
						) : (
							<button
								className={styles.leaveBtn}
								onClick={onLeaveGroup}
							>
								<LogOut size={18} />
								<span>Leave Group</span>
							</button>
						)}
					</div>
				</div>
			</div>
		</>
	);
}