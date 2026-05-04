import { X, Crown, Shield, UserPlus, UserMinus, LogOut, Trash2, Camera, Edit2, Users, MoreVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Avatar from '../Avatar';
import styles from '../../styles/chat/ChatDetailsModal.module.css';

export enum MemberRole {
	ADMIN = 'admin',
	MODERATOR = 'moderator',
	MEMBER = 'member'
}

export enum ContactStatus {
	PENDING = 'PENDING',
	ACCEPTED = 'ACCEPTED'
}

export interface GroupMember {
	id: string;
	name: string;
	avatarUrl?: string;
	role: MemberRole;
	contactStatus?: ContactStatus | null;
}

export interface ChatDetails {
	id: string;
	name: string;
	imageUrl?: string;
	members: GroupMember[];
	currentUserRole: MemberRole;
}

interface ChatDetailsModalProps {
	group: ChatDetails;
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
	group,
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
	const [newGroupName, setNewGroupName] = useState(group.name);
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const isAdmin = group.currentUserRole === MemberRole.ADMIN;
	const isModerator = group.currentUserRole === MemberRole.MODERATOR;
	const canManageMembers = isAdmin || isModerator;

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

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && onUpdateGroupImage) {
			onUpdateGroupImage(file);
		}
	};

	const handleSaveName = () => {
		if (newGroupName.trim() && newGroupName !== group.name && onUpdateGroupName) {
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
								name={group.name}
								src={group.imageUrl}
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
											setNewGroupName(group.name);
											setIsEditingName(false);
										}
									}}
								/>
								<div className={styles.nameEditActions}>
									<button
										className={styles.cancelBtn}
										onClick={() => {
											setNewGroupName(group.name);
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
								<h3 className={styles.groupName}>{group.name}</h3>
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
								<span>Members ({group.members.length})</span>
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
							{group.members.map((member) => {
								const isCurrentUserAdmin = group.currentUserRole === MemberRole.ADMIN;
								const isCurrentUserModerator = group.currentUserRole === MemberRole.MODERATOR;
								const canModifyMember =
									(isCurrentUserAdmin && member.role !== MemberRole.ADMIN) ||
									(isCurrentUserModerator && member.role === MemberRole.MEMBER);
								const showContactRequest = member.contactStatus === null || member.contactStatus === undefined;

								return (
									<div key={member.id} className={styles.memberItem}>
										<Avatar
											name={member.name}
											src={member.avatarUrl}
											size="sm"
										/>
										<div className={styles.memberInfo}>
											<div className={styles.memberName}>
												{member.name}
												{member.role !== MemberRole.MEMBER && (
													<span className={styles.roleTag}>
														{getRoleIcon(member.role)}
														{getRoleLabel(member.role)}
													</span>
												)}
											</div>
										</div>

										{showContactRequest && (
											<button
												className={styles.contactRequestBtn}
												onClick={() => onSendContactRequest?.(member.id)}
												title="Send contact request"
											>
												<UserPlus size={16} />
											</button>
										)}

										{canModifyMember && (
											<div className={styles.dropdownWrapper} ref={openDropdownId === member.id ? dropdownRef : null}>
												<button
													className={styles.moreBtn}
													onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
												>
													<MoreVertical size={18} />
												</button>

												{openDropdownId === member.id && (
													<div className={styles.dropdown}>
														{isCurrentUserAdmin && (
															<>
																{member.role === MemberRole.MEMBER && (
																	<button
																		className={styles.dropdownItem}
																		onClick={() => {
																			onPromoteMember?.(member.id, MemberRole.MODERATOR);
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
																				onPromoteMember?.(member.id, MemberRole.MEMBER);
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
																		onTransferOwnership?.(member.id);
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
																onKickMember?.(member.id);
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