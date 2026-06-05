import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ShiftSubmit from "./pages/ShiftSubmit";
import MySubmissions from "./pages/MySubmissions";
import ConfirmedShifts from "./pages/ConfirmedShifts";
import AdminShiftRequests from "./pages/AdminShiftRequests";
import AdminConfirmedShiftCreate from "./pages/AdminConfirmedShiftCreate";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/submit" element={<ShiftSubmit />} />
      <Route path="/my-submissions" element={<MySubmissions />} />
      <Route path="/confirmed-shifts" element={<ConfirmedShifts />} />
      <Route path="/admin/shift-requests" element={<AdminShiftRequests />} />
      <Route path="/admin/confirmed-shifts/create" element={<AdminConfirmedShiftCreate />} />
    </Routes>
  );
}

export default App;