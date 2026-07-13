import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home/Home';
import QuizEditorPlaceholder from './pages/QuizEditor/QuizEditorPlaceholder';

export default function App() {
  return (
    <HashRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/quizzes/:quizId/edit"
          element={<QuizEditorPlaceholder />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
