function extractJobDetails() {
  const url = window.location.href
  let details = { jobUrl: url, source: detectSource(url) }

  if (url.includes("seek.com.au")) {
    details.roleTitle = document.querySelector('[data-automation="job-detail-title"]')?.textContent?.trim()
    details.company = document.querySelector('[data-automation="advertiser-name"]')?.textContent?.trim()
    details.location = document.querySelector('[data-automation="job-detail-location"]')?.textContent?.trim()
    details.deadline = null
  } else if (url.includes("linkedin.com/jobs")) {
    details.roleTitle = document.querySelector(".job-details-jobs-unified-top-card__job-title")?.textContent?.trim()
    details.company = document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim()
    details.location = document.querySelector(".job-details-jobs-unified-top-card__primary-description-container")?.textContent?.trim()
  } else if (url.includes("gradaustralia.com.au")) {
    details.roleTitle = document.querySelector("h1")?.textContent?.trim()
    details.company = document.querySelector(".employer-name")?.textContent?.trim()
    details.deadline = document.querySelector(".closing-date")?.textContent?.replace("Closing:", "").trim()
  } else if (url.includes("prosple.com")) {
    details.roleTitle = document.querySelector("h1")?.textContent?.trim()
    details.company = document.querySelector(".company-name, [class*='employer']")?.textContent?.trim()
  } else if (url.includes("gradconnection.com.au")) {
    details.roleTitle = document.querySelector("h1")?.textContent?.trim()
    details.company = document.querySelector(".company-name, [class*='company']")?.textContent?.trim()
    details.deadline = document.querySelector(".closing-date, [class*='deadline']")?.textContent?.trim()
  }

  return details
}

function detectSource(url) {
  if (url.includes("seek.com.au")) return "SEEK"
  if (url.includes("linkedin.com")) return "LINKEDIN"
  if (url.includes("gradaustralia")) return "GRAD_AUSTRALIA"
  if (url.includes("prosple")) return "PROSPLE"
  if (url.includes("gradconnection")) return "GRAD_CONNECTION"
  return "OTHER"
}

function injectSaveButton() {
  if (document.getElementById("unitrack-save-btn")) return

  const btn = document.createElement("button")
  btn.id = "unitrack-save-btn"
  btn.innerHTML = "📌 Save to UniTrack"
  btn.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    background: #4F46E5; color: white; border: none; border-radius: 8px;
    padding: 10px 16px; font-size: 14px; font-weight: 500;
    cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background 0.2s;
  `
  btn.addEventListener("mouseenter", () => (btn.style.background = "#4338CA"))
  btn.addEventListener("mouseleave", () => (btn.style.background = "#4F46E5"))

  btn.addEventListener("click", async () => {
    const details = extractJobDetails()
    const { apiUrl, authToken } = await chrome.storage.local.get(["apiUrl", "authToken"])

    if (!authToken) {
      btn.innerHTML = "⚠️ Log in to UniTrack first"
      setTimeout(() => (btn.innerHTML = "📌 Save to UniTrack"), 3000)
      return
    }

    btn.innerHTML = "Saving…"
    btn.disabled = true

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
        btn.innerHTML = "✅ Saved to UniTrack!"
        btn.style.background = "#059669"
        setTimeout(() => {
          btn.innerHTML = "📌 Save to UniTrack"
          btn.style.background = "#4F46E5"
          btn.disabled = false
        }, 3000)
      } else {
        throw new Error("Failed")
      }
    } catch {
      btn.innerHTML = "❌ Save failed — try again"
      btn.style.background = "#DC2626"
      btn.disabled = false
      setTimeout(() => {
        btn.innerHTML = "📌 Save to UniTrack"
        btn.style.background = "#4F46E5"
      }, 3000)
    }
  })

  document.body.appendChild(btn)
}

injectSaveButton()
