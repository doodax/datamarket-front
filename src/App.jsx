import { Routes, Route, Navigate } from 'react-router-dom';
import HomeView from './views/HomeView';
import TeacherLoginView from './views/TeacherLoginView';
import TeacherView from './views/TeacherView';
import TeacherSessionView from './views/TeacherSessionView';
import GroupView from './views/GroupView';
import ResultsView from './views/ResultsView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />

      {/* Espace groupe */}
      <Route path="/group/:code" element={<GroupView />} />
      <Route path="/group/:code/results" element={<ResultsView role="group" />} />

      {/* Espace enseignant·e */}
      <Route path="/teacher/login" element={<TeacherLoginView />} />
      <Route path="/teacher" element={<TeacherView />} />
      <Route path="/teacher/session/:code" element={<TeacherSessionView />} />
      <Route path="/teacher/session/:code/results" element={<ResultsView role="teacher" />} />

      {/* 404 → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
