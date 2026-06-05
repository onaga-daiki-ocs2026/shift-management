import Home from "./pages/Home";
import ShiftSubmit from "./pages/ShiftSubmit";
import MySubmissions from "./pages/MySubmissions";
import ConfirmedShifts from "./pages/ConfirmedShifts";

function App() {
  const path = window.location.pathname;

  if (path === "/submit") {
    return <ShiftSubmit />;
  }

  if (path === "/my-submissions") {
    return <MySubmissions />;
  }

  if (path === "/confirmed-shifts") {
    return <ConfirmedShifts />;
  }

  return <Home />;
}

export default App;