import { useAuth } from "../contexts/AuthContext";

export default function Logout() {

	const { signOut } = useAuth();

	return <button onClick={signOut}>Logging out...</button>;
}