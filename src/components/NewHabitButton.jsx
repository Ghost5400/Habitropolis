import { NavLink } from 'react-router-dom';
import './NewHabitButton.css';

export default function NewHabitButton({ onHabitCreated, className = '' }) {
  return (
    <NavLink 
      to="/habits/new" 
      className={`btn btn-primary ${className}`}
      onClick={onHabitCreated}
    >
      New Habit
    </NavLink>
  );
}