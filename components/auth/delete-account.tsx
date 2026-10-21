import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { showToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/utils/custom-fetch";

export function useDeleteAccount() {
  const logout = useAuthStore((state) => state.logout);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await apiFetch("/user/delete-account", {
        method: "POST",
      });
      if (response.status !== 200 && response.status !== 201) {
        const { message } = await response
          .json()
          .catch(() => ({ message: "" }));
        showToast(message || "Couldn't delete your account", "error");
        return;
      }
      setDialogVisible(false);
      await logout();
      showToast("Your account has been deleted", "success");
    } catch {
      showToast("Couldn't delete your account", "error");
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleting,
    dialogVisible,
    openDialog: () => setDialogVisible(true),
    closeDialog: () => {
      if (!deleting) setDialogVisible(false);
    },
    confirmDelete,
  };
}

export function DeleteAccountDialog({
  visible,
  deleting,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      visible={visible}
      title="Delete Account"
      message="Your account, organizations, channels and posts will be deleted. This action cannot be undone, are you sure?"
      confirmLabel={deleting ? "Deleting..." : "Yes, delete my account"}
      confirmDestructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
