let dialogCallback = null;
let confirmCallback = null;

export function setDialogCallback(callback) {
  dialogCallback = callback;
}

export function setConfirmCallback(callback) {
  confirmCallback = callback;
}

export function showAlert(message, title = 'Alert') {
  if (dialogCallback) {
    dialogCallback(message, title);
  } else {
    alert(message);
  }
}

export function showConfirm(message, title = 'Confirm', onConfirm = () => {}, onCancel = () => {}) {
  if (confirmCallback) {
    confirmCallback(message, title, onConfirm, onCancel);
  } else {
    if (window.confirm(message)) {
      onConfirm();
    } else {
      onCancel();
    }
  }
}
