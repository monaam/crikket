import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    // Trybe fork: pinned public key so the unpacked extension always gets the
    // same ID (jpclpbgghajgfmgnahclacibedmhhpfp), which the S3 bucket CORS allows.
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAszaG/woUpvLr4y83CxPTkg9MyEY+IMlilTbXeUx0TkvOutW76QnPtadgefcqfQAT1vCUc567Rv/mu3lgv41CwsilUMrN4bRjYhcM8fzYBuJ2DxJWlECnZlWg4YxzccCBUObVR6N6Iu7aEtcKv6AnYGUXndE216oavAfgd31q/YcPV8dBlafQbM4e+svuihmH4KXyHh+cX+uM6aa9ipghF5jAsBuBqxr+nGshx8h/edz8NqyZMQetGzegobhEJru+V9Hvvd0ktsEeIlK8kiUDZkl7XAWh5GTx3JaOhXRtQ/a371ho+ZL423nbJ1uBYYnrlYOatYNU9rhrDV+UxUa//wIDAQAB",
    name: "Crikket",
    short_name: "Crikket",
    action: {
      default_title: "Crikket",
      default_popup: "popup.html",
    },
    commands: {
      "start-video-recording": {
        description: "Start video recording",
        suggested_key: {
          default: "Alt+Shift+R",
          mac: "Alt+Shift+R",
        },
      },
      "start-screenshot-capture": {
        description: "Start screenshot capture",
        suggested_key: {
          default: "Alt+Shift+C",
          mac: "Alt+Shift+C",
        },
      },
      "stop-video-recording": {
        description: "Stop video recording",
        suggested_key: {
          default: "Alt+Shift+S",
          mac: "Alt+Shift+S",
        },
      },
    },
    permissions: ["activeTab", "scripting", "storage", "tabCapture", "tabs"],
    host_permissions: ["<all_urls>"],
  },
})
