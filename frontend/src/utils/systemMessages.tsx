import type { ReactNode } from 'react';

export function parseSystemMessage(content: string): ReactNode {
	try {
		const data = JSON.parse(content);

		switch (data.event) {
			case 'MEMBER_LEFT':
				return (
					<div>
						<strong>@{data.targetNames[0]}</strong>
						<span> saiu do grupo</span>
					</div>
				);

			case 'MEMBER_ADDED':
				return (
					<div>
						<strong>@{data.actorName}</strong>
						<span> adicionou </span>
						<strong>@{data.targetNames.join(', @')}</strong>
					</div>
				);

			case 'MEMBER_KICKED':
				return (
					<div>
						<strong>@{data.actorName}</strong>
						<span> removeu </span>
						<strong>@{data.targetNames[0]}</strong>
						<span> do grupo</span>
					</div>
				);

			case 'MEMBER_PROMOTED':
				return (
					<div>
						<strong>@{data.actorName}</strong>
						<span> promoveu </span>
						<strong>@{data.targetNames[0]}</strong>
						<span> para </span>
						<strong>MODERADOR</strong>
					</div>
				);

			case 'MEMBER_DEMOTED':
				return (
					<div>
						<strong>@{data.actorName}</strong>
						<span> removeu privilégios de <strong>MODERADOR</strong> de </span>
						<strong>@{data.targetNames[0]}</strong>
					</div>
				);

			case 'OWNERSHIP_TRANSFERRED':
				return (
					<div>
						<strong>@{data.actorName}</strong>
						<span> transferiu a propriedade do grupo para </span>
						<strong>@{data.targetNames[0]}</strong>
					</div>
				);

			default:
				return 'Mensagem de sistema';
		}
	} catch {
		return content;
	}
}