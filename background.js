/**
 * default host value
 */
var host = "http://127.0.0.1:9666"
var pause = false
var basicAuthHeader = false


/**
 * load settings from chrome
 */
chrome.storage.sync.get({ settings: 
{
    targethost: "127.0.0.1",
    targetport: "9666",
    targetproto: "http",
    pause: false,
    targetuser: "",
    targetpasswd: ""
} 
}, function(storage) {
    //GLOBALS
    host = `${storage.settings.targetproto}://${storage.settings.targethost}:${storage.settings.targetport}`
    pause = storage.settings.pause
        
    //build auth header (must not be used without https)
    if (storage.settings.targetproto == "https" && storage.settings.targetuser.length > 0 && storage.settings.targetpasswd.length > 0 ){
        basicAuthHeader = "Basic " + btoa( storage.settings.targetuser + ":" +  storage.settings.targetpasswd)
    } else {
        basicAuthHeader = false
    }

    if (!pause)install_listener()
})


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
 * on click handler for extension icon
 * switch state, store and update icon
 */
function updateState( ){
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
}


/**
 * stage 2 replace form target
 */
function interceptPost(host){

    const forms = document.querySelectorAll(
        'form[action="http://127.0.0.1:9666/flash/addcrypted2"][method="POST"]'
    )

    forms.forEach((form) => {
        form.action = form.action.replace(/http:\/\/127\.0\.0\.1:9666/, host)
        form.elements['source'].value = "Redirect Click'n'Load";
    })
    
}


/**
 * 
 * stage 1 is the page interesting?
 */
function checkurl2(details) {
    
    if (details.url.match(/^[\S]*:9666\//) && !pause) {
        try {
            chrome.scripting.executeScript({
                target: { tabId: details.tabId },
                func: interceptPost,
                args: [host]
            })
            console.log('CNL monitor injected into tab:', details.tabId)
        } catch (error) {
            console.error('Failed to inject CNL monitor:', error)
        }
    }
}


//send host to content script
// i have added this workaround to have a chance to get feedback
// if the transmission to jD was sucessfull
chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "push2jd") {
            sendResponse({host,basicAuthHeader})
        }
})


const declarativeNetRequestRule = {
    id: 2,
    priority: 1,
    action: {
        type: "redirect",
        redirect:  { "extensionPath": "/jdcheck.js" }
    },
    condition: {
        urlFilter: "|http://127.0.0.1:9666",
        resourceTypes: ["xmlhttprequest", "script"]
    }
}

/**
 * install onBeforeRequestListener after settings are loaded
 */
function install_listener(){

    const filter = {
        urls: [
            "*://127.0.0.1/*",
            "*://localhost/*"        
        ],
        types: ["main_frame", "sub_frame", "script", "object", "xmlhttprequest"]
    }

    chrome.webRequest.onBeforeRequest.addListener(checkurl2, filter, [] )
    chrome.declarativeNetRequest.updateDynamicRules({ addRules: [ declarativeNetRequestRule ], removeRuleIds: [ declarativeNetRequestRule.id ] })
}

/**
 * if paused remove onBeforeRequestListener
 */
function remove_listener(){
    chrome.webRequest.onBeforeRequest.removeListener( checkurl2 )
    chrome.declarativeNetRequest.updateDynamicRules({ addRules: [  ], removeRuleIds: [ declarativeNetRequestRule.id ] })
}


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


