
/*
async function loadjd(host, basicAuthHeader){

    //read file from host
    await fetch(`${host}/jdcheck.js`, {
        mode: "no-cors",
        method: "GET",
        headers: {
            "Content-Type": "application/javascript",
            "Authorization": basicAuthHeader?basicAuthHeader:null
        }
    })
    .then(response => response.text())
    .then(script => {
        const sandboxFunction = new Function(`
            ${script}
            return { jdownloader, version };
        `)        
        const result = sandboxFunction()

        jdownloader=result.jdownloader
        version=result.version

    })
    .catch(error => console.error('Error:', error))

}

(async () => {

    // The ID of the extension we want to talk to.
    //const editorExtensionId = 'hnjbnefgkiickkpfidpnlmcodicfgakk' //prod
    const editorExtensionId = 'fcggliphdcdjhgfmclbjaojeoknjbhjn' //debug

    // Check if extension is installed
    if (chrome && chrome.runtime) {
        // Make a request:
        chrome.runtime.sendMessage(
            editorExtensionId,
            {
                type: "push2jd"
            },
            ({host, basicAuthHeader}) => {
                loadjd(host, basicAuthHeader)
            }
        )
    }

})()
*/

jdownloader=true
version=54874