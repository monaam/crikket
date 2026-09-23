import { useEffect, useRef } from "react"
import {
  cropScreenshotToSelection,
  PENDING_SCREENSHOT_CROP_STORAGE_KEY,
  type ScreenshotSelection,
} from "@/lib/area-screenshot"

export type CaptureType = "video" | "screenshot"

interface UseRecorderInitProps {
  onCaptureTypeChange: (type: CaptureType) => void
  onScreenshotLoaded: (blob: Blob) => void
  onStartRecording: () => void
  onError: (error: string) => void
}

export function useRecorderInit({
  onCaptureTypeChange,
  onScreenshotLoaded,
  onStartRecording,
  onError,
}: UseRecorderInitProps) {
  const autoStartChecked = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = (params.get("captureType") as CaptureType) || "video"
    onCaptureTypeChange(type)

    if (type === "screenshot") {
      chrome.storage.local.get(
        ["pendingScreenshot", PENDING_SCREENSHOT_CROP_STORAGE_KEY],
        (result) => {
          if (result.pendingScreenshot) {
            const selection = result[PENDING_SCREENSHOT_CROP_STORAGE_KEY] as
              | ScreenshotSelection
              | null
              | undefined
            fetch(result.pendingScreenshot as string)
              .then((res) => res.blob())
              .then((blob) =>
                selection ? cropScreenshotToSelection(blob, selection) : blob
              )
              .then((blob) => {
                onScreenshotLoaded(blob)
                chrome.storage.local.remove([
                  "pendingScreenshot",
                  PENDING_SCREENSHOT_CROP_STORAGE_KEY,
                ])
              })
              .catch((err) => {
                console.error("Failed to load screenshot:", err)
                onError("Failed to load screenshot")
              })
          }
        }
      )
    } else if (type === "video") {
      if (autoStartChecked.current) return
      autoStartChecked.current = true

      chrome.storage.local.get(["startRecordingImmediately"], (result) => {
        if (result.startRecordingImmediately) {
          chrome.storage.local.remove(["startRecordingImmediately"])
          onStartRecording()
        }
      })
    }
  }, [onCaptureTypeChange, onScreenshotLoaded, onStartRecording, onError])
}
