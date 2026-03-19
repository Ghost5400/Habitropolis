import { Plus, CheckCircle2 } from 'lucide-react';
import './Counter.css';

export default function Counter({ target = 8, value = 0, completed, onIncrement }) {
  return (
    <div className={`counter-widget ${completed ? 'completed' : ''}`}>
      <div className="counter-display">
        <span className="counter-value">{value}</span>
        <span className="counter-divider">/</span>
        <span className="counter-target">{target}</span>
      </div>

      <div className="counter-dots">
        {Array.from({ length: target }).map((_, i) => (
          <div
            key={i}
            className={`counter-dot ${i < value ? 'filled' : ''}`}
          />
        ))}
      </div>

      {completed ? (
        <div className="counter-done">
          <CheckCircle2 size={20} />
          <span>Complete!</span>
        </div>
      ) : (
        <button className="counter-add-btn" onClick={onIncrement}>
          <Plus size={20} />
          <span>Add one</span>
        </button>
      )}
    </div>
  );
}