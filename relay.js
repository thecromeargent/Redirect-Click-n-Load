// ISOLATED world, has chrome.runtime access. Relays intercepted fetch() calls
// from patch-fetch.js (MAIN world) to the background page.
window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || !event.data.__cnl) return
    chrome.runtime.sendMessage({ type: "push2jd", endpoint: event.data.endpoint, payload: event.data.payload })
})

// keep patch-fetch.js (MAIN world, no chrome.storage access) in sync with the pause toggle
function syncPause(pause){
    window.postMessage({ __cnlPauseSync: true, paused: !!pause }, "*")
}
chrome.storage.sync.get({ settings: { pause: false } }).then(storage => syncPause(storage.settings.pause))
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.settings) syncPause(changes.settings.newValue.pause)
})
