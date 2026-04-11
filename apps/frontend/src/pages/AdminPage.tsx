import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminUsers,
  createAdminUser,
  adminResetPassword,
  adminResetResort,
} from "../api/admin";
import type { AdminUserDTO } from "@val-tick/shared";
import styles from "./AdminPage.module.css";

export function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AdminUserDTO | null>(null);
  const [resetResortTarget, setResetResortTarget] = useState<AdminUserDTO | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<{
    forUser: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  function handleCopy(password: string) {
    void navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Admin — Users &amp; Resorts</h1>

      <div className={styles.toolbar}>
        <button onClick={() => navigate("/")}>← Back to game</button>
        <button
          onClick={() => {
            setRevealedPassword(null);
            setShowCreateModal(true);
          }}
        >
          Create user
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Resort</th>
            <th>Money</th>
            <th>Lifts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email ?? <span className={styles.muted}>—</span>}</td>
              <td>
                <span
                  className={`${styles.roleBadge} ${user.role === "ADMIN" ? styles.roleAdmin : styles.roleUser}`}
                >
                  {user.role}
                </span>
              </td>
              <td>{user.resort?.name ?? <span className={styles.muted}>none</span>}</td>
              <td>
                {user.resort != null ? (
                  `$${(user.resort.moneyCents / 100).toFixed(2)}`
                ) : (
                  <span className={styles.muted}>—</span>
                )}
              </td>
              <td>{user.resort?.liftsCount ?? <span className={styles.muted}>—</span>}</td>
              <td>
                <div className={styles.actions}>
                  <button
                    onClick={() => {
                      setRevealedPassword(null);
                      setResetPasswordTarget(user);
                    }}
                  >
                    Reset password
                  </button>
                  <button className={styles.dangerBtn} onClick={() => setResetResortTarget(user)}>
                    Reset resort
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(username, password) => {
            setRevealedPassword({ forUser: username, password });
            setShowCreateModal(false);
            void invalidate();
          }}
        />
      )}

      {resetPasswordTarget && (
        <ResetPasswordModal
          user={resetPasswordTarget}
          onClose={() => setResetPasswordTarget(null)}
          onReset={(password) => {
            setRevealedPassword({ forUser: resetPasswordTarget.username, password });
            setResetPasswordTarget(null);
          }}
        />
      )}

      {resetResortTarget && (
        <ResetResortModal
          user={resetResortTarget}
          onClose={() => setResetResortTarget(null)}
          onReset={() => {
            setResetResortTarget(null);
            void invalidate();
          }}
        />
      )}

      {revealedPassword && (
        <div className={styles.overlay} onClick={() => setRevealedPassword(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Password for {revealedPassword.forUser}</div>
            <div className={styles.passwordReveal}>
              <div className={styles.passwordWarning}>
                Copy this password now — it won&apos;t be shown again.
              </div>
              <div className={styles.passwordValue}>
                <span className={styles.passwordText}>{revealedPassword.password}</span>
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopy(revealedPassword.password)}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setRevealedPassword(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (username: string, password: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: (data) => onCreated(data.user.username, data.password),
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    mutation.mutate({ username, ...(email ? { email } : {}) });
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalTitle}>Create user</div>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="new-username">Username</label>
            <input
              id="new-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="new-email">Email (optional)</label>
            <input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onReset,
}: {
  user: AdminUserDTO;
  onClose: () => void;
  onReset: (password: string) => void;
}) {
  const mutation = useMutation({
    mutationFn: () => adminResetPassword(user.id),
    onSuccess: (data) => onReset(data.password),
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalTitle}>Reset password for {user.username}?</div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
          A new random password will be generated. The old one will stop working immediately.
        </p>
        <div className={styles.modalActions}>
          <button onClick={onClose}>Cancel</button>
          <button
            className={styles.dangerBtn}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Resetting…" : "Reset password"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetResortModal({
  user,
  onClose,
  onReset,
}: {
  user: AdminUserDTO;
  onClose: () => void;
  onReset: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () => adminResetResort(user.id),
    onSuccess: onReset,
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalTitle}>Reset {user.username}&apos;s resort?</div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
          This will wipe all lifts and reset money to $5. This cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <button onClick={onClose}>Cancel</button>
          <button
            className={styles.dangerBtn}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Resetting…" : "Reset resort"}
          </button>
        </div>
      </div>
    </div>
  );
}
