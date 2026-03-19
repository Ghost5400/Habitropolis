import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TestConnection() {
  const [status, setStatus] = useState('Checking...');
  const [data, setData] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test the connection by trying to get the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus(`Connection failed: ${error.message}`);
          return;
        }
        
        setStatus('Connected to Supabase!');
        setData(session);
      } catch (err) {
        setStatus(`Error: ${err.message}`);
      }
    }
    
    testConnection();
  }, []);

  return (
    <div className="glass p-4">
      <h2>Supabase Connection Test</h2>
      <p className="text-secondary">{status}</p>
      {data && (
        <div className="mt-4">
          <h3>Session Data:</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}