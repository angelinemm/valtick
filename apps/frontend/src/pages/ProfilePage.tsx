import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/profile";
import styles from "./ProfilePage.module.css";

const SPECIAL_CHARS = /[\d!@#$%^&*()\-_=+[\]{}|;:,.<>?]/;

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Must be at least 8 characters";
  if (!SPECIAL_CHARS.test(password)) return "Must contain at least one number or special character";
  return null;
}

export function ProfilePage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const canSubmit = currentPassword !== "" && newPassword !== "" && confirmPassword !== "";

  function handleNewPasswordBlur() {
    const err = validatePassword(newPassword);
    setNewPasswordError(err ?? "");
  }

  function handleConfirmBlur() {
    setConfirmError(newPassword !== confirmPassword ? "Passwords do not match" : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSuccess(false);

    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      setNewPasswordError(pwErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    setIsPending(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNewPasswordError("");
      setConfirmError("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsPending(false);
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
        <path
          d="M0,80 L0,55 L70,22 L140,48 L230,8 L320,35 L420,15 L520,40 L630,5 L720,32 L820,18 L920,44 L1020,12 L1120,38 L1200,28 L1200,80 Z"
          fill="#16293e"
        />
        <path
          d="M0,80 L0,68 L90,52 L180,64 L270,44 L370,60 L460,46 L560,62 L660,48 L760,65 L860,50 L960,66 L1060,54 L1160,67 L1200,58 L1200,80 Z"
          fill="#0c1a25"
        />
      </svg>

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <button onClick={() => navigate("/")}>← Back to game</button>
        </div>

        <h1 className={styles.title}>Profile</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionHeading}>Change password</h2>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className={styles.field}>
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setNewPasswordError("");
                }}
                onBlur={handleNewPasswordBlur}
                autoComplete="new-password"
              />
              {newPasswordError && <span className={styles.fieldError}>{newPasswordError}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmError("");
                }}
                onBlur={handleConfirmBlur}
                autoComplete="new-password"
              />
              {confirmError && <span className={styles.fieldError}>{confirmError}</span>}
            </div>

            <div className={styles.actions}>
              <button type="submit" disabled={!canSubmit || isPending}>
                {isPending ? "Saving…" : "Change password"}
              </button>
            </div>

            {success && <div className={styles.success}>Password updated successfully.</div>}
            {submitError && <div className={styles.error}>{submitError}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
