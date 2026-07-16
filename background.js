/**
 * default host value
 */
var host = "http://127.0.0.1:9666"
var pause = false
var basicAuthHeader = false


/**
 * load settings from chrome
 */
const defaults = {
    targethost: "127.0.0.1",
    targetport: "9666",
    targetproto: "http",
    pause: false,
    targetuser: "",
    targetpasswd: ""
}

chrome.storage.sync.get({ settings: defaults }).then(storage => {
    const s = storage?.settings ?? defaults
    host = `${s.targetproto}://${s.targethost}:${s.targetport}`
    pause = s.pause

    if (s.targetproto == "https" && s.targetuser.length > 0 && s.targetpasswd.length > 0) {
        basicAuthHeader = "Basic " + btoa(s.targetuser + ":" + s.targetpasswd)
    } else {
        basicAuthHeader = false
    }

    if (!pause) install_listener()
}).catch(err => console.error('CNL storage error:', err))


/**
 * save pause state
 * @param {boolean} pause must be set to true or false 
 */
// Saves options to chrome.storage.sync.
function save_options(pause, callback) {
    chrome.storage.sync.set({
        pause: pause
    }, function() {
        // Update icon status
        callback()
    })
}




/**
 * stage 2 replace form target
 */
function interceptPost(host){

    const forms = document.querySelectorAll(
        'form[action="http://127.0.0.1:9666/flash/addcrypted2"][method="POST"]'
    )

    // forms.forEach((form) => {
    //     form.action = form.action.replace(/http:\/\/127\.0\.0\.1:9666/, host)
    //     form.elements['source'].value = "Redirect Click'n'Load";
    // })

    //method2
    //allows custom referrer for jDownloader Security
    forms.forEach(form => {

        const formData = new FormData(form)

        //ignore empty forms
        if ( formData.get("package") == "" || formData.get("crypted") == "" || formData.get("jk") == "" ) return

        // Modify specific form fields before sending
        if (formData.get("source")) {
            formData.set("source", "Redirect Click'n'Load")
        }
        const urlEncodedData = new URLSearchParams(formData).toString()
        chrome.runtime.sendMessage({ type: "push2jd", endpoint: "addcrypted2", payload: urlEncodedData })

    })

}


//method2
//also receives "push2jd" messages relayed from relay.js (patch-fetch.js intercepting
//plain fetch() calls to /flash/add on sites that don't use a <form>)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "push2jd" && !pause) {

        fetch(`${host}/flash/${message.endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": "https://clickandload.com",
                "Authorization": basicAuthHeader || undefined
            },
            "body": message.payload,
        })
        .then(response => response)
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error))

    }
})

/**
 *
 * stage 1 is the page interesting?
 */
function checkurl2(details) {

    //for stage2
    if (details.url.match(/^[\S]*:9666\/flash\/addcrypted2/) && !pause) {
        try {
            chrome.scripting.executeScript({
                target: { tabId: details.tabId },
                func: interceptPost,
                args: [host]
            })
            console.log('CNL stage2 injected into tab:', details.tabId)
        } catch (error) {
            console.error('Failed to inject stage1:', error)
        }
    }
}


function install_listener(){
    const filter = {
        urls: ["*://127.0.0.1/*", "*://localhost/*"],
        types: ["main_frame", "sub_frame", "script", "object", "xmlhttprequest"]
    }
    chrome.webRequest.onBeforeRequest.addListener(checkurl2, filter, [])
    chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ["ruleset_jdcheck"] })
}

function remove_listener(){
    chrome.webRequest.onBeforeRequest.removeListener(checkurl2)
    chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ["ruleset_jdcheck"] })
}



/**
 * set extension icon to pause state
 */
function disableBrowserAction(){
    chrome.action.setIcon({path:"images/icon_status_pause.png"})
    remove_listener()
}
/**
 * set extension icon to normal state
 */
function enableBrowserAction(){
    chrome.action.setIcon({path:"images/icon_status.png"})
    install_listener()
}

// Handle extension icon click
chrome.action.onClicked.addListener(async () => {

    if(pause == false){
        pause = true
        save_options(pause,function(){
            disableBrowserAction()
        })
    }else{
        pause = false
        save_options(pause,function(){
            enableBrowserAction()
        })   
    }


})


