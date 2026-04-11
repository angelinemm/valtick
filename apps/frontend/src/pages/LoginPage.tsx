import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { login } from "../api/auth";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login({ username, password });
      queryClient.setQueryData(["me"], data.user);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <svg
        className={styles.mountains}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Far range — lighter, taller peaks */}
        <path
          d="M0,80 L0,55 L70,22 L140,48 L230,8 L320,35 L420,15 L520,40 L630,5 L720,32 L820,18 L920,44 L1020,12 L1120,38 L1200,28 L1200,80 Z"
          fill="#16293e"
        />
        {/* Near range — darker foreground silhouette */}
        <path
          d="M0,80 L0,68 L90,52 L180,64 L270,44 L370,60 L460,46 L560,62 L660,48 L760,65 L860,50 L960,66 L1060,54 L1160,67 L1200,58 L1200,80 Z"
          fill="#0c1a25"
        />
      </svg>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Val-Tick</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
