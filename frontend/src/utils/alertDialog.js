let dialogCallback = null;

export function setDialogCallback(callback) {
  dialogCallback = callback;
}

export function showAlert(message, title = 'Alert') {
  if (dialogCallback) {
    dialogCallback(message, title);
  } else {
    alert(message);
  }
}
