(() => {
  const FOOTER_SELECTOR = '#main footer';
  const COMPOSER_SELECTOR = '#main footer [contenteditable="true"]';
  const SENT_MESSAGE_SELECTOR = '#main .message-out';
  const SEND_WATCH_MS = 5 * 60 * 1000;
  const TICK_MS = 150;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const ERRORS = {
    signin: 'Sign in to Google first',
    timeout: 'Meet did not respond',
    closed: 'Meet tab was closed',
    error: 'Could not create a link',
  };

  let busy = false;
  let pendingSend = null;
  let tickTimer = null;
  let labelTimer = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function createIcon() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute(
      'd',
      'M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v2.3l3.9-2.6A.7.7 0 0 1 21 6.8v10.4a.7.7 0 0 1-1.1.6L16 15.2v2.3a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 17.5z',
    );
    path.setAttribute('fill', 'currentColor');
    svg.append(path);
    return svg;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'wamb-button';
  button.hidden = true;
  button.title = 'Add a new Google Meet link to this chat';
  const label = document.createElement('span');
  label.textContent = 'Meet';
  button.append(createIcon(), label);
  document.body.append(button);

  function setLabel(text, resetAfterMs) {
    clearTimeout(labelTimer);
    label.textContent = text;
    if (resetAfterMs) {
      labelTimer = setTimeout(() => {
        label.textContent = 'Meet';
        schedule();
      }, resetAfterMs);
    }
    schedule();
  }

  function showLinkToast(url) {
    document.querySelector('.wamb-toast')?.remove();

    const toast = document.createElement('div');
    toast.className = 'wamb-toast';
    toast.setAttribute('role', 'status');

    const text = document.createElement('span');
    text.textContent = url;

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = 'Copy';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        copy.textContent = 'Copied';
      } catch {
        copy.textContent = 'Select and copy it';
      }
    });

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.addEventListener('click', () => toast.remove());

    toast.append(text, copy, close);
    document.body.append(toast);
  }

  function composerText(composer) {
    return (composer?.textContent || '').trim();
  }

  function moveCaretToEnd(composer) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composer);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function insertLink(url) {
    const composer = document.querySelector(COMPOSER_SELECTOR);
    if (!composer) return false;

    composer.focus();
    moveCaretToEnd(composer);
    const text = composerText(composer) ? ` ${url}` : url;

    document.execCommand('insertText', false, text);
    await sleep(TICK_MS);
    if (composerText(document.querySelector(COMPOSER_SELECTOR)).includes(url)) return true;

    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    composer.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
    await sleep(TICK_MS);
    return composerText(document.querySelector(COMPOSER_SELECTOR)).includes(url);
  }

  function wasSent(pending) {
    if (composerText(document.querySelector(COMPOSER_SELECTOR)).includes(pending.url)) return false;
    return [...document.querySelectorAll(SENT_MESSAGE_SELECTOR)].some((message) =>
      message.textContent.includes(pending.code),
    );
  }

  function checkPendingSend() {
    if (!pendingSend) return;
    if (Date.now() > pendingSend.expiresAt) {
      pendingSend = null;
      return;
    }
    if (!wasSent(pendingSend)) return;

    const { url } = pendingSend;
    pendingSend = null;
    chrome.runtime.sendMessage({ type: 'open-meeting', url }).catch(() => {
      showLinkToast(url);
    });
  }

  function positionButton() {
    const footer = document.querySelector(FOOTER_SELECTOR);
    if (!footer) {
      button.hidden = true;
      return;
    }
    button.hidden = false;
    const footerRect = footer.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    button.style.left = `${Math.round(footerRect.right - buttonRect.width - 16)}px`;
    button.style.top = `${Math.round(footerRect.top - buttonRect.height - 10)}px`;
  }

  function tick() {
    tickTimer = null;
    positionButton();
    checkPendingSend();
  }

  function schedule() {
    if (tickTimer === null) tickTimer = setTimeout(tick, TICK_MS);
  }

  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    button.disabled = true;
    setLabel('Creating…');

    try {
      const result = await chrome.runtime.sendMessage({ type: 'create-meet-link' });
      if (!result?.ok) {
        setLabel(ERRORS[result?.reason] || ERRORS.error, 4000);
        return;
      }

      const code = result.url.split('/').pop();
      if (await insertLink(result.url)) {
        pendingSend = { url: result.url, code, expiresAt: Date.now() + SEND_WATCH_MS };
        setLabel('Link added', 2000);
      } else {
        showLinkToast(result.url);
        setLabel('Meet');
      }
    } catch {
      setLabel('Refresh WhatsApp', 4000);
    } finally {
      busy = false;
      button.disabled = false;
    }
  });

  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  window.addEventListener('resize', schedule);
  schedule();
})();
