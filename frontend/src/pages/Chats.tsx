import { useEffect, useState } from "react"
import authService from "../services/auth/authService";
import type { UserProfile } from "../services/auth/authTypes";

export default function Chats() {
	const [profile, setProfile] = useState<UserProfile | null>(null);

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			const response = await authService.getProfile();
			setProfile(response);
		} catch (error) {
			console.error('Failed to fetch profile:', error);
		}
	};

	return (
		<div>
			<h1>Profile Page</h1>
			<p>This is a protected route. Only authenticated users can see this.</p>

			{profile &&
				<div>
					<h2>Welcome, {profile.displayName || profile.username}!</h2>
					<p>Email: {profile.email}</p>
					<p>Username: {profile.username}</p>
				</div>
			}

			<button onClick={fetchProfile}>Refresh Profile</button>
			<button onClick={() => setProfile(null)}>Clear Profile</button>
		</div>
	)
}