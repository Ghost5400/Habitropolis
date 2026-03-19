import { useNavigate } from 'react-router-dom';
import './QuoteBanner.css';

export default function QuoteBanner() {
  const navigate = useNavigate();

  return (
    <div className="quote-banner glass">
      <p className="quote-text">
        "A habit missed once is a mistake, a habit missed twice is the start of a{' '}
        <span
          className="new-habit-link"
          onClick={() => navigate('/habits/new')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/habits/new')}
        >
          NEW HABIT
        </span>
        "
      </p>
      <p className="quote-author">by ADITYA GOTHE</p>
    </div>
  );
}