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
import Chats from '../pages/Chats.tsx';
import PublicRoute from './PublicRoute.tsx';
import Layout from '../layouts/Layout.tsx';

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<Layout />}>
			<Route element={<PublicRoute />}>
				<Route path="/" element={<Landing />} />
				<Route path="/signin" element={<Signin />} />
				<Route path="/signup" element={<Signup />} />
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route path="/chats" element={<Chats />} />
				<Route path="/logout" element={<Logout />} />
			</Route>
		</Route>
	)
);

export default function App() {
	return <RouterProvider router={router} />;
}