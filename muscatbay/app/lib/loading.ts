type LoadingController = {
  show: (message?: string) => void;
  hide: () => void;
};

let _ctrl: LoadingController | null = null;

export function _registerLoadingController(ctrl: LoadingController): void {
  _ctrl = ctrl;
}

/** Show the global loading overlay. Optionally pass a message. */
export function showLoading(message?: string): void {
  _ctrl?.show(message);
}

/** Hide the global loading overlay. */
export function hideLoading(): void {
  _ctrl?.hide();
}
