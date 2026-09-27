import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { NewInvestigationPage } from './pages/NewInvestigationPage';
import { InvestigationDetailsPage } from './pages/InvestigationDetailsPage';
import { EvidenceAttributionPage } from './pages/EvidenceAttributionPage';
import { StartupAnimation } from './components/StartupAnimation';

export const App: React.FC = () => {
  const [animationActive, setAnimationActive] = useState<boolean>(true);

  return (
    <>
      {animationActive && (
        <StartupAnimation onComplete={() => setAnimationActive(false)} />
      )}
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="new" element={<NewInvestigationPage />} />
            <Route path="investigations" element={<InvestigationDetailsPage />} />
            <Route path="attribution" element={<EvidenceAttributionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
