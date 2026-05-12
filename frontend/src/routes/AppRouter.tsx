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
import { Toaster } from 'react-hot-toast';

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
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 3000,
					style: {
						background: 'var(--surface)',
						color: 'var(--text)',
						border: '1px solid var(--border)',
					},
					success: {
						iconTheme: {
							primary: '#22c55e',
							secondary: '#fff',
						},
					},
					error: {
						iconTheme: {
							primary: '#ef4444',
							secondary: '#fff',
						},
					},
				}}
			/>

			<RouterProvider router={router} />
		</ThemeProvider>
	);
}