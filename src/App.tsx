import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home/Home';
import LiveGame from './pages/LiveGame/LiveGame';
import QuizEditor from './pages/QuizEditor/QuizEditor';
import QuestionForm from './pages/QuizEditor/QuestionForm';

export default function App() {
  return (
    <HashRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quizzes/:quizId/edit" element={<QuizEditor />} />
        <Route path="/quiz/:id/live" element={<LiveGame />} />
        <Route
          path="/quizzes/:quizId/questions/new"
          element={<QuestionForm />}
        />
        <Route
          path="/quizzes/:quizId/questions/:questionId/edit"
          element={<QuestionForm />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
