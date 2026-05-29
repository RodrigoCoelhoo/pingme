import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function getCookie(name: string): string | null {
	const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
	return match ? decodeURIComponent(match[2]) : null
}

function deleteCookie(name: string) {
	document.cookie = `${name}=; Max-Age=0; path=/`
}

export default function AuthCallback() {
	const navigate = useNavigate()
	const { handleOAuthCallback } = useAuth()

	useEffect(() => {
		const token = getCookie('accessToken')

		if (token) {
			deleteCookie('accessToken')
			handleOAuthCallback(token).then(() => navigate('/chats', { replace: true }))
		} else {
			navigate('/signin?error=oauth_failed', { replace: true })
		}
	}, [])

	return <div>A autenticar...</div>
}