import {
	Route,
	createBrowserRouter,
	createRoutesFromElements,
	RouterProvider,
} from 'react-router-dom';

import Landing from '../pages/Landing.tsx';
import Signin from '../pages/Signin.tsx';
import Signup from '../pages/Signup.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import Logout from '../pages/Logout.tsx';
import Chat from '../pages/Chat.tsx';
import PublicRoute from './PublicRoute.tsx';
import Layout from '../layouts/Layout.tsx';
import { ThemeProvider } from 'next-themes';

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route element={<PublicRoute />}>
				<Route element={<Layout />}>
					<Route path="/" element={<Landing />} />
				</Route>
				<Route path="/signin" element={<Signin />} />
				<Route path="/signup" element={<Signup />} />
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route path="/chats" element={<Chat />} />
				<Route path="/logout" element={<Logout />} />
			</Route>
		</>
	)
);

export default function App() {
	return (
		<ThemeProvider
			attribute="data-theme"
			defaultTheme="dark"
			enableSystem={false}
		>
			<RouterProvider router={router} />
		</ThemeProvider>
	);
}