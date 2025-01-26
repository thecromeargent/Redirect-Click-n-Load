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
        host = `${storage.settings.targetproto}://${storage.settings.targethost}:${storage.settings.targetport}`
    }

    basicAuthHeader = "Basic " + btoa( storage.settings.targetuser + ":" +  storage.settings.targetpasswd)
    

    //TODO
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


//find form with non blocking onBeforeRequest
//replace form target
//todo replace form submit with custom post to add security header

/**
 * stage 2 replace form target
 */
function interceptPost(host){

    const forms = document.querySelectorAll(
        'form[action="http://127.0.0.1:9666/flash/addcrypted2"][method="POST"]'
    )

    //method1 
    forms.forEach((form) => {
        form.action = form.action.replace(/http:\/\/127\.0\.0\.1:9666/, host)
        form.elements['source'].value = "Redirect Click'n'Load";
    })
    
    //method2
    //allows custom referrer for jDownloader Security
    // forms.forEach(form => {

    //     const formData = new FormData(form)
        
    //     //ignore empty forms    
    //     if ( formData.get("package") == "" || formData.get("crypted") == "" || formData.get("jk") == "" ) return
        
    //     // Modify specific form fields before sending
    //     if (formData.get("source")) {
    //         formData.set("source", "Redirect Click'n'Load")
    //     }
    //     const urlEncodedData = new URLSearchParams(formData).toString()
    //     chrome.runtime.sendMessage({ type: "push2jd", payload: urlEncodedData })

    // })
}

//method2
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.type === "push2jd") {
            
//         fetch(`${host}/flash/addcrypted2`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded",
//                 "Referer": "https://clickandload.com",
//                 "Authorization": basicAuthHeader?basicAuthHeader:null
//             },
//             "body": message.payload,
//         })
//         .then(response => response)
//         .then(data => console.log(data))
//         .catch(error => console.error('Error:', error))

//     }
// })

/**
 * 
 * stage 1 is the page interesting?
 */
function checkurl2(details) {

    console.log("any request", details.url)
    
    //if (details.url.match(/^[\S]*:9666\//) ) {
    if (details.url.match(/^[\S]*:9666\//) && !pause) {

        console.log('Potential CNL page detected:', details.url)        
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




const RULE = {
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

const DEBUGFN = () => {
    if (chrome.runtime.lastError) {
        console.log("Error updating rules:", chrome.runtime.lastError)
    } else {
        console.log("Dynamic rule added successfully.")
    }
}
const DEBUGFN2 = () => {
    if (chrome.runtime.lastError) {
        console.log("Error removing rules:", chrome.runtime.lastError)
    } else {
        console.log("Dynamic rule removed successfully.")
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
    chrome.declarativeNetRequest.updateDynamicRules({ addRules: [ RULE ], removeRuleIds: [ RULE.id ] }, DEBUGFN)
}

/**
 * if paused remove onBeforeRequestListener
 */
function remove_listener(){
    chrome.webRequest.onBeforeRequest.removeListener( checkurl2 )
    chrome.declarativeNetRequest.updateDynamicRules({ addRules: [  ], removeRuleIds: [ RULE.id ] }, DEBUGFN2)
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


