import { useState } from "react";
import { useAuth, MAX_ACCOUNTS, Account } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";

const AVATAR_COLORS = [
  ["#2ca5e0", "#1a7bbf"],
  ["#e17055", "#c0392b"],
  ["#6c5ce7", "#4834d4"],
  ["#00b894", "#00a381"],
];

function getAvatarGradient(index: number) {
  const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
}

function getInitials(acc: Account): string {
  if (acc.user.name) {
    const parts = acc.user.name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  // Use digits from phone
  return acc.user.phone.replace(/\D/g, "").slice(-2);
}

interface AccountSwitcherProps {
  onAddAccount: () => void;
  onClose: () => void;
}

export default function AccountSwitcher({ onAddAccount, onClose }: AccountSwitcherProps) {
  const { accounts, user, switchAccount, removeAccount, logout, canAddAccount } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  function handleSwitch(userId: number) {
    if (userId === user?.id) {
      onClose();
      return;
    }
    switchAccount(userId);
    onClose();
  }

  function handleRemove(userId: number) {
    if (confirmRemove === userId) {
      if (userId === user?.id) {
        logout();
      } else {
        removeAccount(userId);
      }
      setConfirmRemove(null);
      if (accounts.length <= 1) onClose();
    } else {
      setConfirmRemove(userId);
    }
  }

  return (
    <div className="account-switcher-overlay" onClick={onClose}>
      <div
        className="account-switcher-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="account-switcher-header">
          <span className="account-switcher-title">Аккаунты</span>
          <button className="tg-icon-btn" onClick={onClose}>
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Account list */}
        <div className="account-switcher-list">
          {accounts.map((acc, i) => {
            const isActive = acc.user.id === user?.id;
            const isRemoving = confirmRemove === acc.user.id;
            return (
              <div
                key={acc.user.id}
                className={`account-switcher-item ${isActive ? "account-switcher-item-active" : ""}`}
              >
                <button
                  className="account-switcher-main"
                  onClick={() => handleSwitch(acc.user.id)}
                >
                  {/* Avatar */}
                  <div
                    className="account-switcher-avatar"
                    style={{ background: getAvatarGradient(i) }}
                  >
                    {getInitials(acc)}
                  </div>

                  {/* Info */}
                  <div className="account-switcher-info">
                    <span className="account-switcher-name">
                      {acc.user.name || "Без имени"}
                    </span>
                    <span className="account-switcher-phone">{acc.user.phone}</span>
                  </div>

                  {/* Active checkmark */}
                  {isActive && (
                    <div className="account-switcher-check">
                      <Icon name="Check" size={16} />
                    </div>
                  )}
                </button>

                {/* Remove button */}
                <button
                  className={`account-switcher-remove ${isRemoving ? "account-switcher-remove-confirm" : ""}`}
                  onClick={() => handleRemove(acc.user.id)}
                  title={isRemoving ? "Нажмите ещё раз для подтверждения" : "Удалить аккаунт"}
                >
                  {isRemoving ? (
                    <Icon name="AlertCircle" size={15} />
                  ) : (
                    <Icon name="LogOut" size={15} />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Add account */}
        {canAddAccount && (
          <button
            className="account-switcher-add"
            onClick={() => { onAddAccount(); onClose(); }}
          >
            <div className="account-switcher-add-icon">
              <Icon name="Plus" size={18} />
            </div>
            <span>Добавить аккаунт</span>
            <span className="account-switcher-add-count">
              {accounts.length}/{MAX_ACCOUNTS}
            </span>
          </button>
        )}

        {!canAddAccount && (
          <div className="account-switcher-limit">
            <Icon name="Info" size={14} />
            <span>Максимум {MAX_ACCOUNTS} аккаунта</span>
          </div>
        )}
      </div>
    </div>
  );
}
