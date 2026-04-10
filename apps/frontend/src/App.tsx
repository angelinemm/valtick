import { Routes, Route } from "react-router-dom";
import { ResortPage } from "./pages/ResortPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/resort/:guestId" element={<ResortPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
