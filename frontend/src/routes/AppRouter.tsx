import {
	Route,
	createBrowserRouter,
	createRoutesFromElements,
	RouterProvider,
	Navigate,
} from 'react-router-dom'
import LandingPage from '../pages/LandingPage';


const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route>
				<Route path="/" element={<Navigate to="/home" replace />} />
				<Route path="/home" element={<LandingPage />} />
			</Route>
		</>
	)
);

export default function App() {
	return (
		<RouterProvider router={router} />
	);
};