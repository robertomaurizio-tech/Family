
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import CategoryManager from './components/CategoryManager';
import ShoppingList from './components/ShoppingList';
import SandroAccount from './components/SandroAccount';
import Settings from './components/Settings';

import CarManager from './components/CarManager';
import MonthlyReport from './components/MonthlyReport';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/spese" element={<ExpenseList />} />
          <Route path="/lista-spesa" element={<ShoppingList />} />
          <Route path="/conto-sandro" element={<SandroAccount />} />
          <Route path="/categorie" element={<CategoryManager />} />
          <Route path="/garage" element={<CarManager />} />
          <Route path="/report/:year/:month" element={<MonthlyReport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
