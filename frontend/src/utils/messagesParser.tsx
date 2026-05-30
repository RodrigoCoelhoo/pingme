import { FileText, ImageIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function parseMessage(content: string): ReactNode {
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
						<span> saiu do grupo</span>
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
						<span> adicionou </span>
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
						<span> removeu </span>
						<strong>@{data.targetNames[0]}</strong>
						<span> do grupo</span>
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
						<span> promoveu </span>
						<strong>@{data.targetNames[0]}</strong>
						<span> para </span>
						<strong>MODERADOR</strong>
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
						<span> removeu privilégios de </span>
						<strong>MODERADOR</strong>
						<span> de </span>
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
						<span> transferiu a propriedade do grupo para </span>
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
						<span>Imagem</span>
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