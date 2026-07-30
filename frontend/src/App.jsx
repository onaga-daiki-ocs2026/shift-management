import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import ShiftSubmit from "./pages/ShiftSubmit";
import MySubmissions from "./pages/MySubmissions";
import ConfirmedShifts from "./pages/ConfirmedShifts";
import AdminShiftRequests from "./pages/AdminShiftRequests";
import AdminConfirmedShiftCreate from "./pages/AdminConfirmedShiftCreate";
import AdminUserManagement from "./pages/AdminUserManagement";
import Help from "./pages/Help";

function AdminRoute({ children }) {
	let loginUser;
	try {
		loginUser = JSON.parse(localStorage.getItem("loginUser"));
	} catch {
		loginUser = null;
	}

	if (loginUser?.role !== "ADMIN") {
		return <Navigate to="/" replace />;
	}

	return children;
}

function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/submit" element={<ShiftSubmit />} />
			<Route path="/my-submissions" element={<MySubmissions />} />
			<Route path="/confirmed-shifts" element={<ConfirmedShifts />} />
			<Route
				path="/admin/shift-requests"
				element={
					<AdminRoute>
						<AdminShiftRequests />
					</AdminRoute>
				}
			/>
			<Route
				path="/admin/confirmed-shifts/create"
				element={
					<AdminRoute>
						<AdminConfirmedShiftCreate />
					</AdminRoute>
				}
			/>
			<Route
				path="/admin/users"
				element={
					<AdminRoute>
						<AdminUserManagement />
					</AdminRoute>
				}
			/>
			<Route path="/help" element={<Help />} />
		</Routes>
	);
}

export default App;
