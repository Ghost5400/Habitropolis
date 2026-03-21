import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Tutorial from './Tutorial';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      <Tutorial />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}