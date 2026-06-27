import { useEffect, useState } from 'react';
import HaloMark from './HaloMark.jsx';

const DISMISS_KEY = 'halo_install_dismissed';

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return ios && safari;
}

// A small dismissible banner that helps users install Halo to their home
// screen. Android gets a one-tap install button; iOS gets the Share-menu hint
// (Apple offers no programmatic prompt). Hidden once installed or dismissed.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [iosHint, setIosHint] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setOpen(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', dismiss);

    if (isIosSafari()) {
      setIosHint(true);
      setOpen(true);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', dismiss);
    };
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1400] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-navy-600 bg-navy-800/95 p-3 shadow-2xl backdrop-blur">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950 ring-1 ring-navy-600">
          <HaloMark className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">Install Halo</p>
          {iosHint ? (
            <p className="text-xs leading-snug text-slate-400">
              Tap the Share icon{' '}
              <ShareIcon />, then{' '}
              <span className="font-medium text-slate-200">
                “Add to Home Screen.”
              </span>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Add it to your home screen for quick, full-screen access.
            </p>
          )}
        </div>

        {!iosHint && (
          <button
            onClick={install}
            className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-navy-950 transition hover:bg-accent-dark"
          >
            Install
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-navy-700 hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      className="inline-block align-text-bottom"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        d="M12 16V4M12 4 8 8M12 4l4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
