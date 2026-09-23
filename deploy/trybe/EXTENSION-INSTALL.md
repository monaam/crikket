# Trybe Feedback: install the browser extension

Use this to send screenshots and screen recordings of our products straight to the product team.
Setup takes about 5 minutes and only has to be done once.

**You need:** Google Chrome (or Edge/Brave), the file `crikket-extension.zip`, and your login for **https://feedback.thetrybe.xyz** (sent to you by the product team).

---

## 1. Unzip the file

1. Download `crikket-extension.zip` to your computer.
2. Unzip it: double-click it on Mac, or right-click → **Extract All** on Windows.
3. Move the unzipped folder `chrome-mv3` somewhere permanent, such as your **Documents** folder.
   ⚠️ Don't delete or move this folder later, or the extension stops working.

## 2. Add it to Chrome

1. In the address bar, type `chrome://extensions` and press Enter.
2. Turn on **Developer mode** (switch in the top-right corner).
3. Click **Load unpacked** (top-left).
4. Select the `chrome-mv3` folder from step 1 and click **Select**.
5. **Crikket** now shows up in the list.
6. Click the puzzle-piece icon 🧩 next to the address bar, then the pin 📌 next to **Crikket** so its icon is always visible.

> Chrome may sometimes show a banner about "developer mode extensions". That's expected; just close it.

## 3. Sign in

1. Go to **https://feedback.thetrybe.xyz** and sign in with the email and password you were given.
   No password? Click **Forgot password**, or use the emailed sign-in code.
2. Stay signed in. The extension uses this same login.

## 4. ⚠️ Pick the right project workspace BEFORE you capture

Reports are filed under the workspace (**Fatoura, Trybe, ComptaLégal or Tutorios**) that is **currently selected on the website**.
The extension has no workspace picker.

- If you only belong to one workspace, skip this step.
- If you belong to several: open **https://feedback.thetrybe.xyz**, switch to the right workspace with the selector at the top left, **then** capture.

A report filed in the wrong workspace won't be seen by the right team.

## 5. Send feedback

1. Open the page with the problem.
2. Click the **Crikket** icon.
3. Choose one:
   - **Screenshot**: grabs the visible page. You can draw on it or highlight areas.
   - **Record video**: records the tab while you reproduce the problem. Click stop when done.
     Shortcuts: `Alt+Shift+C` screenshot · `Alt+Shift+R` start recording · `Alt+Shift+S` stop.
4. Give it a clear title and describe **what you did, what you expected, and what happened**.
   Set a priority if you know how urgent it is. Mention the product/page in the title (e.g. "CRM – invoice list doesn't load").
5. Click submit. You'll get a link to the report.

Videos are kept for 90 days. Screenshots and the written report stay.

---

## When we release an update

The extension does **not** update by itself. When the product team sends a new zip:

1. Replace the contents of your `chrome-mv3` folder with the new one (same location).
2. Go to `chrome://extensions` and click the **↻ reload** arrow on the Crikket card.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Please sign in" / sent to a login page | Sign in at https://feedback.thetrybe.xyz in the same Chrome profile, then try again. |
| Report went to the wrong workspace | Switch workspace on the website (step 4) and send it again. Ask the product team to delete the wrong one. |
| Crikket disappeared from Chrome | The folder was moved or deleted. Repeat step 2 with the folder in its new place. |
| Upload fails | Check your internet connection and retry. If it keeps failing, screenshot the error and send it to the product team. |
