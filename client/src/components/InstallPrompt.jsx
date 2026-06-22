import React, { useState, useEffect } from 'react';

/**
 * Lightweight install affordance.
 * - Android / desktop Chrome: captures `beforeinstallprompt` and shows an Install button.
 * - iOS Safari (no such event): shows a one-time "Add to Home Screen" hint.
 * Dismissals are remembered in localStorage.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('installDismissed') === '1') return;

    // Already installed?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) return;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS doesn't fire beforeinstallprompt — detect and show a hint instead
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIos) {
      setIosHint(true);
      setShow(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('installDismissed', '1');
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="install-banner">
      <img src="/pwa-192x192.png" alt="" className="install-icon" />
      <div className="install-text">
        <strong>Install Routine</strong>
        {iosHint ? (
          <span>Tap the Share button, then “Add to Home Screen”.</span>
        ) : (
          <span>Add the app to your home screen.</span>
        )}
      </div>
      {!iosHint && (
        <button className="install-btn" onClick={install}>Install</button>
      )}
      <button className="install-close" onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}
