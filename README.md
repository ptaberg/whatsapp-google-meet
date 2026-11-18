# WhatsApp Meet Button

Adds a **Meet** button to WhatsApp Web. Click it, and a new Google Meet link appears in the message box of the open chat. Press Enter to send it, and the meeting opens in a new tab.

## Install

1. Unzip this folder and keep it somewhere permanent, because Chrome runs the extension from there.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the `whatsapp-meet-button` folder.
5. Refresh web.whatsapp.com.

Make sure you are signed in to Google in the same Chrome profile.

## Update

Replace the files in the folder, click the reload icon on the extension in `chrome://extensions`, then refresh WhatsApp.

## Good to know

- It works only in Chrome on web.whatsapp.com, not in the WhatsApp desktop app or on a phone.
- The link is created with your default Google account in this Chrome profile.
- Nothing is sent automatically. If you delete the link instead of sending it, no meeting opens.
- If WhatsApp changes its page, the button may stop appearing or the link may show in a small pop-up with a Copy button. The selectors to update are at the top of `content.js`.
