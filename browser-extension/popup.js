const $ = (id) => document.getElementById(id)

async function getStorage(keys) {
  return chrome.storage.local.get(keys)
}

async function setStorage(data) {
  return chrome.storage.local.set(data)
}

function showMsg(el, text, type) {
  el.className = `msg ${type}`
  el.textContent = text
  el.style.display = "block"
}

function hideMsg(el) {
  el.style.display = "none"
  el.textContent = ""
}

async function renderView() {
  const { apiUrl, authToken } = await getStorage(["apiUrl", "authToken"])

  if (authToken) {
    $("view-login").style.display = "none"
    $("view-connected").style.display = "block"
    $("connected-url").textContent = apiUrl || "http://localhost:3000"
    $("settings-api-url").value = apiUrl || ""
    $("settings-token").value = authToken || ""
  } else {
    $("view-login").style.display = "block"
    $("view-connected").style.display = "none"
    const { apiUrl: saved } = await getStorage(["apiUrl"])
    if (saved) $("api-url-input").value = saved
  }
}

// Validate token by calling /api/auth/me
async function verifyToken(apiUrl, token) {
  try {
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

$("connect-btn").addEventListener("click", async () => {
  const btn = $("connect-btn")
  const msgEl = $("login-msg")
  hideMsg(msgEl)

  const rawUrl = $("api-url-input").value.trim().replace(/\/$/, "")
  const token = $("token-input").value.trim()

  if (!rawUrl) { showMsg(msgEl, "Please enter your UniTrack API URL.", "error"); return }
  if (!token) { showMsg(msgEl, "Please enter your extension token.", "error"); return }

  btn.disabled = true
  btn.innerHTML = `<span class="spinner"></span> Connecting…`

  const ok = await verifyToken(rawUrl, token)

  if (ok) {
    await setStorage({ apiUrl: rawUrl, authToken: token })
    await renderView()
  } else {
    btn.disabled = false
    btn.innerHTML = "Connect"
    showMsg(msgEl, "Could not connect — check your URL and token.", "error")
  }
})

$("disconnect-btn").addEventListener("click", async () => {
  await chrome.storage.local.remove(["authToken"])
  await renderView()
})

$("update-btn").addEventListener("click", async () => {
  const url = $("settings-api-url").value.trim().replace(/\/$/, "")
  const token = $("settings-token").value.trim()
  if (!url || !token) return

  const btn = $("update-btn")
  btn.disabled = true
  btn.textContent = "Saving…"

  const ok = await verifyToken(url, token)
  if (ok) {
    await setStorage({ apiUrl: url, authToken: token })
    $("connected-url").textContent = url
    btn.textContent = "✓ Saved"
    setTimeout(() => { btn.textContent = "Update"; btn.disabled = false }, 2000)
  } else {
    btn.textContent = "Update"
    btn.disabled = false
    alert("Could not verify — check URL and token.")
  }
})

$("save-current-btn").addEventListener("click", async () => {
  const msgEl = $("save-msg")
  hideMsg(msgEl)

  const { apiUrl, authToken } = await getStorage(["apiUrl", "authToken"])

  // Ask the active tab's content script to extract job details
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) { showMsg(msgEl, "No active tab found.", "error"); return }

  let details
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (typeof extractJobDetails === "function") return extractJobDetails()
        return { jobUrl: window.location.href, source: "OTHER" }
      },
    })
    details = results[0]?.result
  } catch {
    showMsg(msgEl, "Cannot read this page — try the floating button instead.", "info")
    return
  }

  if (!details?.company && !details?.roleTitle) {
    showMsg(msgEl, "No job details found on this page.", "info")
    return
  }

  const btn = $("save-current-btn")
  btn.disabled = true
  btn.textContent = "Saving…"

  try {
    const res = await fetch(`${apiUrl || "http://localhost:3000"}/api/jobs/extension`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(details),
    })

    if (res.ok) {
      btn.textContent = "📌 Save current page"
      btn.disabled = false
      showMsg(msgEl, "✅ Saved to UniTrack!", "success")
    } else {
      throw new Error("Failed")
    }
  } catch {
    btn.textContent = "📌 Save current page"
    btn.disabled = false
    showMsg(msgEl, "Save failed — try again.", "error")
  }
})

// Init
renderView()
