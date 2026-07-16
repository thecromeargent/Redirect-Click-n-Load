// runs in MAIN world (real page context) at document_start, before page scripts run,
// so the page's own window.fetch is patched before it ever gets a chance to call it.
// MAIN world has no chrome.runtime access, so the intercepted call is relayed via
// postMessage to relay.js (ISOLATED world), which forwards it to the background page.
(function(){
    if (window.__cnlFetchPatched) return
    window.__cnlFetchPatched = true

    let paused = false
    window.addEventListener("message", (event) => {
        if (event.source === window && event.data && event.data.__cnlPauseSync) paused = event.data.paused
    })

    const origFetch = window.fetch
    // Proxy (not a plain reassigned function) so fetch.toString() still reports
    // native code - some sites use that to detect tampering and block as "adblock"
    window.fetch = new Proxy(origFetch, {
        apply(target, thisArg, args){
            const [input, init] = args
            const url = typeof input === "string" ? input : (input && input.url)
            if (url && !paused && /:9666\/flash\/add(\?|$)/.test(url)) {
                const body = init && init.body
                const payload = (body && typeof body !== "string") ? body.toString() : body
                window.postMessage({ __cnl: true, endpoint: "add", payload }, "*")
                return Promise.resolve(new Response("", { status: 200 }))
            }
            return Reflect.apply(target, thisArg, args)
        }
    })
})()
