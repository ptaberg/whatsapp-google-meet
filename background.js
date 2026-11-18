const MEET_NEW_URL = 'https://meet.google.com/new';
const MEETING_URL = /^https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:[/?#]|$)/;
const CREATE_TIMEOUT_MS = 20000;

function cleanMeetingUrl(url) {
  const match = MEETING_URL.exec(url || '');
  return match ? `https://meet.google.com/${match[1]}` : null;
}

function closeTab(tabId) {
  return chrome.tabs.remove(tabId).catch(() => {});
}

async function createMeetLink(sender) {
  const tab = await chrome.tabs.create({
    url: MEET_NEW_URL,
    active: false,
    windowId: sender.tab.windowId,
  });

  return new Promise((resolve) => {
    let finished = false;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      resolve(result);
    };

    const inspect = (current) => {
      const url = cleanMeetingUrl(current.url);
      if (url) {
        closeTab(tab.id);
        finish({ ok: true, url });
        return;
      }
      if (current.status !== 'complete') return;

      // The extension can only see meet.google.com addresses, so an empty URL
      // means Google sent the tab somewhere else, normally the sign-in page.
      const stillCreating = (current.url || '').startsWith(MEET_NEW_URL);
      if (!stillCreating) {
        chrome.tabs.update(tab.id, { active: true }).catch(() => {});
        finish({ ok: false, reason: 'signin' });
      }
    };

    const onUpdated = (tabId, _changeInfo, current) => {
      if (tabId === tab.id) inspect(current);
    };

    const onRemoved = (tabId) => {
      if (tabId === tab.id) finish({ ok: false, reason: 'closed' });
    };

    const timer = setTimeout(() => {
      closeTab(tab.id);
      finish({ ok: false, reason: 'timeout' });
    }, CREATE_TIMEOUT_MS);

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    // The tab may have finished loading before the listeners were attached.
    chrome.tabs.get(tab.id).then(inspect).catch(() => {});
  });
}

async function openMeeting(message, sender) {
  const url = cleanMeetingUrl(message.url);
  if (!url) return { ok: false, reason: 'invalid' };

  await chrome.tabs.create({
    url,
    active: true,
    windowId: sender.tab.windowId,
    index: sender.tab.index + 1,
  });
  return { ok: true };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !sender.tab) return false;

  const handlers = {
    'create-meet-link': () => createMeetLink(sender),
    'open-meeting': () => openMeeting(message, sender),
  };
  const handler = handlers[message && message.type];
  if (!handler) return false;

  handler()
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, reason: 'error', detail: String(error) }));
  return true;
});
