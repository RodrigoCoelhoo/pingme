import {
	Route,
	createBrowserRouter,
	createRoutesFromElements,
	RouterProvider,
	Navigate,
} from 'react-router-dom'
import Landing from '../pages/Landing.tsx';
import SignIn from '../pages/SignIn.tsx';
import SignUp from '../pages/Signup.tsx';


const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route>
				<Route path="/" element={<Navigate to="/home" replace />} />
				<Route path="/home" element={<Landing />} />
				<Route path="/signin" element={<SignIn />} />
				<Route path="/signup" element={<SignUp />} />
			</Route>
		</>
	)
);

export default function App() {
	return (
		<RouterProvider router={router} />
	);
};