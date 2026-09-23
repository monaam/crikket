// Trybe fork: "select an area" screenshots. The popup closes as soon as the
// user interacts with the page, so the selection runs from the background:
// overlay in the page -> captureVisibleTab -> recorder crops to the selection.
import { appendDebuggerSessionIdToUrl } from "@crikket/capture-core/debugger/recorder-session"
import { reportNonFatalError } from "@crikket/shared/lib/errors"
import type { DebuggerSessionStore } from "@/lib/bug-report-debugger/engine/background/session-store"
import {
  CAPTURE_CONTEXT_STORAGE_KEY,
  type CaptureContext,
} from "@/lib/capture-context"

export const AREA_SCREENSHOT_MESSAGE = "trybe:area-screenshot"
export const PENDING_SCREENSHOT_CROP_STORAGE_KEY = "pendingScreenshotCrop"

export interface ScreenshotSelection {
  x: number
  y: number
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
}

interface AreaScreenshotRequest {
  type: typeof AREA_SCREENSHOT_MESSAGE
  payload: {
    tabId: number
    windowId: number
    captureContext: CaptureContext
  }
}

type SelectionResult =
  | { kind: "area"; selection: ScreenshotSelection }
  | { kind: "full" }
  | { kind: "cancel" }

export function requestAreaScreenshot(
  payload: AreaScreenshotRequest["payload"]
): Promise<void> {
  return chrome.runtime.sendMessage({
    type: AREA_SCREENSHOT_MESSAGE,
    payload,
  } satisfies AreaScreenshotRequest)
}

export function registerAreaScreenshotListener(
  store: DebuggerSessionStore | null
): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (
      !message ||
      typeof message !== "object" ||
      message.type !== AREA_SCREENSHOT_MESSAGE
    ) {
      return
    }

    // Answer right away: the popup closes as soon as the overlay takes focus.
    sendResponse()
    runAreaScreenshot(store, (message as AreaScreenshotRequest).payload).catch(
      (error: unknown) => {
        reportNonFatalError("Area screenshot capture failed", error)
      }
    )
  })
}

async function runAreaScreenshot(
  store: DebuggerSessionStore | null,
  input: AreaScreenshotRequest["payload"]
): Promise<void> {
  const selection = await selectArea(input.tabId)
  if (selection.kind === "cancel") {
    return
  }

  const screenshot = await chrome.tabs.captureVisibleTab(input.windowId, {
    format: "png",
  })

  const session = store
    ? await store.startSession({
        captureTabId: input.tabId,
        captureType: "screenshot",
        instantReplayLookbackMs: 10_000,
      })
    : null

  await chrome.storage.local.set({
    [CAPTURE_CONTEXT_STORAGE_KEY]: input.captureContext,
    pendingScreenshot: screenshot,
    [PENDING_SCREENSHOT_CROP_STORAGE_KEY]:
      selection.kind === "area" ? selection.selection : null,
  })

  const recorderUrl = chrome.runtime.getURL(
    "/recorder.html?captureType=screenshot"
  )
  await chrome.tabs.create({
    url: session
      ? appendDebuggerSessionIdToUrl(recorderUrl, session.sessionId)
      : recorderUrl,
  })
}

async function selectArea(tabId: number): Promise<SelectionResult> {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: selectAreaInPage,
    })
    return (
      (injection?.result as SelectionResult | undefined) ?? {
        kind: "full",
      }
    )
  } catch (error) {
    // Pages that refuse script injection (e.g. the Chrome Web Store) fall back
    // to a full visible-tab screenshot.
    reportNonFatalError("Area selection unavailable; using full tab", error)
    return { kind: "full" }
  }
}

// Serialized into the page by chrome.scripting: must stay self-contained.
function selectAreaInPage(): Promise<SelectionResult> {
  return new Promise((resolve) => {
    const host = document.createElement("div")
    host.style.cssText =
      "all:initial;position:fixed;inset:0;z-index:2147483647;cursor:crosshair;"
    const root = host.attachShadow({ mode: "closed" })
    root.innerHTML = `
      <style>
        .dim { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.35); }
        .box { position: fixed; display: none; border: 2px solid #fff;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.45); border-radius: 2px; }
        .hint { position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          background: #0f172a; color: #fff; padding: 8px 14px; border-radius: 8px;
          font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-shadow: 0 4px 16px rgba(0,0,0,.25); pointer-events: none; white-space: nowrap; }
      </style>
      <div class="dim"></div>
      <div class="box"></div>
      <div class="hint">Drag to select an area · Click for the whole visible page · Esc to cancel</div>`
    const dim = root.querySelector(".dim") as HTMLElement
    const box = root.querySelector(".box") as HTMLElement
    const hint = root.querySelector(".hint") as HTMLElement
    document.documentElement.appendChild(host)

    let origin: { x: number; y: number } | null = null
    let current = { x: 0, y: 0, width: 0, height: 0 }

    const finish = (result: SelectionResult) => {
      window.removeEventListener("keydown", onKeyDown, true)
      host.remove()
      // Let the browser repaint without the overlay before the capture.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setTimeout(() => resolve(result), 50))
      )
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        finish({ kind: "cancel" })
      }
    }

    host.addEventListener("pointerdown", (event) => {
      event.preventDefault()
      host.setPointerCapture(event.pointerId)
      origin = { x: event.clientX, y: event.clientY }
      current = { x: origin.x, y: origin.y, width: 0, height: 0 }
    })

    host.addEventListener("pointermove", (event) => {
      if (!origin) return
      current = {
        x: Math.min(origin.x, event.clientX),
        y: Math.min(origin.y, event.clientY),
        width: Math.abs(event.clientX - origin.x),
        height: Math.abs(event.clientY - origin.y),
      }
      dim.style.display = "none"
      hint.style.display = "none"
      box.style.display = "block"
      box.style.left = `${current.x}px`
      box.style.top = `${current.y}px`
      box.style.width = `${current.width}px`
      box.style.height = `${current.height}px`
    })

    host.addEventListener("pointerup", () => {
      if (!origin) return
      origin = null
      if (current.width < 8 || current.height < 8) {
        finish({ kind: "full" })
        return
      }
      finish({
        kind: "area",
        selection: {
          ...current,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        },
      })
    })

    window.addEventListener("keydown", onKeyDown, true)
  })
}

export async function cropScreenshotToSelection(
  blob: Blob,
  selection: ScreenshotSelection
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const scaleX = bitmap.width / selection.viewportWidth
  const scaleY = bitmap.height / selection.viewportHeight
  const sx = Math.max(0, Math.round(selection.x * scaleX))
  const sy = Math.max(0, Math.round(selection.y * scaleY))
  const width = Math.min(
    bitmap.width - sx,
    Math.round(selection.width * scaleX)
  )
  const height = Math.min(
    bitmap.height - sy,
    Math.round(selection.height * scaleY)
  )

  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Failed to crop screenshot.")
  }
  context.drawImage(bitmap, sx, sy, width, height, 0, 0, width, height)
  bitmap.close()

  return canvas.convertToBlob({ type: "image/png" })
}
