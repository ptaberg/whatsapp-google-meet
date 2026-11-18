# Chrome Web Store listing text

## Name
Meet Button for WhatsApp Web

## Summary
Add a new Google Meet link to the open WhatsApp Web chat in one click, then join when you send it.

## Description
Starting a video call from a WhatsApp Web conversation usually means opening Google Meet, creating a meeting, copying the link and coming back to the chat. This extension turns that into one click.

How it works:
1. Open a chat on WhatsApp Web and click Meet at the top of the conversation.
2. A new Google Meet link appears in the message box.
3. Press Enter to send it, and the meeting opens in a new tab.

Nothing is sent for you. You always decide whether to send the link, and if you delete it, no meeting opens.

You need to be signed in to Google in the same Chrome profile. The extension has no account, no analytics and no server of its own.

This extension is independent and is not affiliated with, endorsed by or sponsored by WhatsApp, Meta or Google.

## Single purpose
Adds a button to WhatsApp Web that inserts a new Google Meet link into the open chat.

## Host permission justification (https://meet.google.com/*)
Used to open meet.google.com/new in a temporary tab, read the new meeting address from that tab, and open the meeting after the user sends the link. No other Google site is accessed.

## Content script justification (https://web.whatsapp.com/*)
Adds the button to WhatsApp Web, inserts the link into the message box, and checks the open chat to detect that the user sent it. This happens only in the browser.

## Remote code
No. All code is included in the extension package.
