import type { TFunction } from 'i18next';
import { FileText, ImageIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function parseMessage(
	content: string,
	t: TFunction
): ReactNode {
	try {
		const data = JSON.parse(content);

		if (
			typeof data !== 'object' ||
			data === null ||
			!('event' in data)
		) {
			return content;
		}

		switch (data.event) {
			case 'MEMBER_LEFT':
				return (
					<div
						style={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						<strong>@{data.targetNames[0]}</strong>
						<span> {t('system.memberLeft')}</span>
					</div>
				);

			case 'MEMBER_ADDED':
				return (
					<div
						style={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						<strong>@{data.actorName}</strong>
						<span> {t('system.memberAdded')} </span>
						<strong>@{data.targetNames.join(', @')}</strong>
					</div>
				);

			case 'MEMBER_KICKED':
				return (
					<div
						style={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						<strong>@{data.actorName}</strong>
						<span> {t('system.memberKicked')} </span>
						<strong>@{data.targetNames[0]}</strong>
						<span> {t('system.memberKickedSuffix')}</span>
					</div>
				);

			case 'MEMBER_PROMOTED':
				return (
					<div
						style={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						<strong>@{data.actorName}</strong>
						<span> {t('system.memberPromoted')} </span>
						<strong>@{data.targetNames[0]}</strong>
						<span> {t('system.memberPromotedSuffix')} </span>
						<strong>{t('system.moderator')}</strong>
					</div>
				);

			case 'MEMBER_DEMOTED':
				return (
					<div
						style={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						<strong>@{data.actorName}</strong>
						<span> {t('system.memberDemoted')} </span>
						<strong>{t('system.moderator')}</strong>
						<span> {t('system.memberDemotedSuffix')} </span>
						<strong>@{data.targetNames[0]}</strong>
					</div>
				);

			case 'OWNERSHIP_TRANSFERRED':
				return (
					<div
						style={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						<strong>@{data.actorName}</strong>
						<span> {t('system.ownershipTransferred')} </span>
						<strong>@{data.targetNames[0]}</strong>
					</div>
				);

			default:
				return content;
		}
	} catch {
		const isCloudinary = content.includes('res.cloudinary.com');

		if (isCloudinary) {
			const isImage = content.includes('/image/upload/');
			const isFile = content.includes('/raw/upload/');

			if (isImage) {
				return (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '4px'
						}}
					>
						<ImageIcon size={16} />
						<span>{t('system.image')}</span>
					</div>
				);
			}

			if (isFile) {
				return (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
							minWidth: 0
						}}
					>
						<FileText
							size={16}
							style={{ flexShrink: 0 }}
						/>

						<span
							style={{
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap'
							}}
						>
							{decodeURIComponent(
								(new URL(content).pathname.split('/').pop() || 'file')
									.replace(/_[^_.]+(?=\.[^.]+$)/, '')
							)}
						</span>
					</div>
				);
			}
		}

		return content;
	}
}