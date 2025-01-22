/**
 * default host value
 */
var host = "http://127.0.0.1:9666"
var pause = false
var basicAuthHeader = false


/**
 * filter settings url
 */
var filter = {
    urls: [
        "*://127.0.0.1/*",
        "*://localhost/*"        
    ],
    types: ["main_frame", "sub_frame", "script", "object", "xmlhttprequest"]
}


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
    host = storage.settings.targetproto + "://" + storage.settings.targethost + ":" + storage.settings.targetport
    pause = storage.settings.pause
        
    //build auth header (must not be used without https)
    if (storage.settings.targetproto == "https" && storage.settings.targetuser.length > 0 && storage.settings.targetpasswd.length > 0 ){
        
        //required for checkHeader function
        filter.urls.push("*://" + storage.settings.targethost + "/*")

        basicAuthHeader = {
            name: "Authorization",
            value: "Basic " + btoa( storage.settings.targetuser + ":" +  storage.settings.targetpasswd )        
        }
    }

    //TODO
    //if (!pause)install_listener()
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


// Handle extension icon click
chrome.action.onClicked.addListener(async () => {
    pause = !pause
    //await updateRules()
    
    // Update icon
    const iconPath = pause ? 
        "images/icon_status_pause.png" : 
        "images/icon_status.png"
    
    await chrome.action.setIcon({ path: iconPath })
})






self.addEventListener("install", (event) => {
    console.log("sw-omnibox.js")
})


// For debugging
console.log('Service worker initialized')


// const newRules = await getNewRules();
// const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
// const oldRuleIds = oldRules.map(rule => rule.id);

// // Use the arrays to update the dynamic rules
// await chrome.declarativeNetRequest.updateDynamicRules({
//     removeRuleIds: oldRuleIds,
//     addRules: newRules
// });

chrome.declarativeNetRequest.updateDynamicRules(
    {
        addRules: [
            // {
            //     "id": 1,
            //     "priority": 1,
            //     "action": { "type": "redirect", "redirect": { "extensionPath": "/a.jpg" } },
            //     "condition": {
            //         "urlFilter": "||https://www.example.com/",
            //         "resourceTypes": ["main_frame"]
            //     }
            // },
            // {
            //     id: 2,
            //     priority: 1,
            //     action: {
            //         type: "redirect",
            //         redirect: { url: "http://192.168.81.1:9666" }
            //     },
            //     condition: {
            //         urlFilter: "|http://127.0.0.1:9666",
            //         resourceTypes: ["xmlhttprequest", "script"]
            //     }
            // },
            {
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
            },
            {
                id: 3,
                priority: 1,
                action: {
                    type: "redirect",
                    redirect:  { "extensionPath": "/addcrypted2.js" }
                },
                condition: {
                    urlFilter: "|http://127.0.0.1:9666/flash/addcrypted2",
                    resourceTypes: ["xmlhttprequest", "script"]
                }
            }
        ],
        removeRuleIds: [2] // Optionally remove existing rules by ID
    },
        () => {
            if (chrome.runtime.lastError) {
                console.log("Error updating rules:", chrome.runtime.lastError)
            } else {
                console.log("Dynamic rule added successfully.")
            }
        }
)

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
    (info)=>{
        
        console.log(info)
    }
)


function knusper(){

    chrome.declarativeNetRequest.getMatchedRules(null,
        (info)=>{
            
            console.log(info)
        }
    )

}