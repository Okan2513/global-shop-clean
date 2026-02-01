import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export default function AdminPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API}/admin/stats`, {
      headers: {
        Authorization: "Basic " + btoa("Yusuf:2012")
      }
    })
    .then(res => setStats(res.data))
    .catch(err => console.log(err));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      {stats && (
        <div>
          <p>Total Products: {stats.total_products}</p>
        </div>
      )}
    </div>
  );
}
