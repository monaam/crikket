import { reportNonFatalError } from "@crikket/shared/lib/errors"
import { registerAreaScreenshotListener } from "@/lib/area-screenshot"
import { registerDebuggerBackgroundListeners } from "@/lib/bug-report-debugger/engine/background"
import { handleRecorderHotkeyCommand } from "@/lib/recorder-hotkey-commands"

export default defineBackground(() => {
  const debuggerStore = registerDebuggerBackgroundListeners()
  registerAreaScreenshotListener(debuggerStore)

  chrome.commands.onCommand.addListener((command) => {
    handleRecorderHotkeyCommand(command).catch(async (error: unknown) => {
      reportNonFatalError("Failed to execute recorder hotkey command", error)
      try {
        await chrome.action.openPopup()
      } catch (openPopupError) {
        reportNonFatalError(
          "Failed to open popup after hotkey failure",
          openPopupError
        )
      }
    })
  })
})
