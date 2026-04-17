import {
	Route,
	createBrowserRouter,
	createRoutesFromElements,
	RouterProvider,
	Navigate,
} from 'react-router-dom'
import Landing from '../pages/Landing.tsx';
import Signin from '../pages/SignIn.tsx';
import Signup from '../pages/Signup.tsx';


const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route>
				<Route path="/" element={<Navigate to="/home" replace />} />
				<Route path="/home" element={<Landing />} />
				<Route path="/signin" element={<Signin />} />
				<Route path="/signup" element={<Signup />} />
			</Route>
		</>
	)
);

export default function App() {
	return (
		<RouterProvider router={router} />
	);
};