// zip -1 -x "*screens*" -x "*metadata*" -x "*/\.*" x ".*"  -x "*.zip" -r addon.zip .



// Saves options to chrome.storage.sync.
function save_options() {

  chrome.storage.sync.set({ settings:
    {
      targethost:   document.getElementById('targethost').value,
      targetport:   document.getElementById('targetport').value,
      targetproto:  document.getElementById('targetproto').value,
      pyloadmode:   document.getElementById('pyloadmode').checked,
      targetuser:   document.getElementById('targetuser').value,
      targetpasswd: document.getElementById('targetpasswd').value
    }
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = ' Saved.';

    //reload background script
    chrome.extension.getBackgroundPage().window.location.reload();
    
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({ settings: 
    {
      targethost: '127.0.0.1',
      targetport: '9666',
      targetproto: 'http',
      pyloadmode: false,
      targetuser: "",
      targetpasswd: ""

    }
  }, function(storage) {
    console.log(storage.settings)
    document.getElementById('targethost').value = storage.settings.targethost;
    document.getElementById('targetport').value = parseInt(storage.settings.targetport);
    document.getElementById('targetproto').value = storage.settings.targetproto;
    document.getElementById('pyloadmode').checked = storage.settings.pyloadmode === true;
    document.getElementById('targetuser').value = storage.settings.targetuser;
    document.getElementById('targetpasswd').value = storage.settings.targetpasswd;
  });
}

// Downloads current settings as a JSON file.
function export_options() {
  chrome.storage.sync.get({ settings: {} }, function(storage) {
    var blob = new Blob([JSON.stringify(storage.settings, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'redirect-clicknload-settings.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

// Reads a JSON file picked by the user and saves it as settings.
function import_options(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function() {
    var settings;
    try {
      settings = JSON.parse(reader.result);
    } catch (e) {
      document.getElementById('status').textContent = ' Invalid JSON file.';
      return;
    }
    chrome.storage.sync.set({ settings: settings }, function() {
      restore_options();
      var status = document.getElementById('status');
      status.textContent = ' Imported.';
      chrome.extension.getBackgroundPage().window.location.reload();
      setTimeout(function() { status.textContent = ''; }, 750);
    });
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Checks reachability of the currently entered target via jdcheck.js.
function test_connection() {
  var result = document.getElementById('testResult');
  var host = document.getElementById('targethost').value;
  var port = document.getElementById('targetport').value;
  var proto = document.getElementById('targetproto').value;
  var user = document.getElementById('targetuser').value;
  var passwd = document.getElementById('targetpasswd').value;

  result.className = '';
  result.textContent = 'Testing...';

  // Firefox always ships the "<all_urls>" host permission as an optional,
  // user-toggleable switch (about:addons > Permissions), regardless of it
  // being listed under host_permissions in the manifest. Request it here so
  // the user gets the native permission prompt instead of a silent CORS
  // failure.
  chrome.permissions.request({ origins: ['<all_urls>'] }, function(granted) {
    if (!granted) {
      result.className = 'fail';
      result.textContent = 'Connection failed: permission to access all sites was not granted.';
      return;
    }
    run_test_connection();
  });

  function run_test_connection() {
    var headers = {};
    if (proto === 'https' && user) {
      headers['Authorization'] = 'Basic ' + btoa(user + ':' + passwd);
    }

    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 5000);

    fetch(proto + '://' + host + ':' + port + '/jdcheck.js', {
      headers: headers,
      signal: controller.signal
    })
      .then(function(response) {
        clearTimeout(timeout);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function(text) {
        if (text.indexOf('jdownloader=true') === -1) throw new Error('unexpected response');
        result.className = 'ok';
        result.textContent = 'Connection OK.';
      })
      .catch(function(err) {
        clearTimeout(timeout);
        result.className = 'fail';
        result.textContent = 'Connection failed: ' + err.message;
      });
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('test').addEventListener('click', test_connection);
document.getElementById('export').addEventListener('click', export_options);
document.getElementById('import').addEventListener('click', function() {
  document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', import_options);