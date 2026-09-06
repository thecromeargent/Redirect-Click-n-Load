const defaults = {
  targethost: '127.0.0.1',
  targetport: '9666',
  targetproto: 'http',
  pyloadmode: false,
  targetuser: '',
  targetpasswd: ''
}

const form = document.getElementById('settingsForm')
const modeToggle = document.getElementById('pyloadmode')
const protocolSelect = document.getElementById('targetproto')
const status = document.getElementById('status')
const testResult = document.getElementById('testResult')
let settingsDirty = false

function readForm() {
  return {
    targethost: document.getElementById('targethost').value.trim(),
    targetport: document.getElementById('targetport').value,
    targetproto: protocolSelect.value,
    pyloadmode: modeToggle.checked,
    targetuser: document.getElementById('targetuser').value,
    targetpasswd: document.getElementById('targetpasswd').value
  }
}

function updateModeUi() {
  const pyloadEnabled = modeToggle.checked
  document.getElementById('modeBadge').textContent = pyloadEnabled ? 'pyLoad' : 'jDownloader'
  document.getElementById('switchLabel').textContent = pyloadEnabled ? 'On' : 'Off'
  document.getElementById('modeHelp').textContent = pyloadEnabled
    ? 'On for remote pyLoad. Requests keep the Host header expected by pyLoad.'
    : 'Off for jDownloader. Standard Click\'n\'Load forwarding stays unchanged.'
}

function updateAuthenticationUi() {
  document.getElementById('authenticationSection').hidden = protocolSelect.value !== 'https'
}

function showStatus(message, isError = false) {
  status.textContent = message
  status.style.color = isError ? 'var(--danger)' : ''
  window.clearTimeout(showStatus.timer)
  showStatus.timer = window.setTimeout(() => {
    status.textContent = ''
    status.style.color = ''
  }, 1800)
}

function persistOptions(callback) {
  if (!form.reportValidity()) return
  chrome.storage.sync.set({ settings: readForm() }, () => {
    if (chrome.runtime.lastError) {
      showStatus('Could not save settings.', true)
      return
    }
    showStatus('Settings saved')
    settingsDirty = false
    if (callback) callback()
  })
}

function restoreOptions() {
  chrome.storage.sync.get({ settings: defaults }, storage => {
    const settings = { ...defaults, ...(storage.settings || {}) }
    document.getElementById('targethost').value = settings.targethost
    document.getElementById('targetport').value = settings.targetport
    protocolSelect.value = settings.targetproto
    modeToggle.checked = settings.pyloadmode === true
    document.getElementById('targetuser').value = settings.targetuser
    document.getElementById('targetpasswd').value = settings.targetpasswd
    updateModeUi()
    updateAuthenticationUi()
    settingsDirty = false
  })
}

function testConnection() {
  if (settingsDirty) {
    testResult.className = 'test-result fail'
    testResult.textContent = 'Save your changes before testing the connection.'
    return
  }
  testResult.className = 'test-result'
  testResult.textContent = 'Testing connection…'
  const settings = readForm()
  chrome.permissions.request({ origins: ['<all_urls>'] }, granted => {
    if (!granted) {
      testResult.className = 'test-result fail'
      testResult.textContent = 'Connection failed: permission to access the target was not granted.'
      return
    }
    const headers = {}
    if (settings.targetproto === 'https' && settings.targetuser) {
      headers.Authorization = 'Basic ' + btoa(settings.targetuser + ':' + settings.targetpasswd)
    }
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5000)
    fetch(`${settings.targetproto}://${settings.targethost}:${settings.targetport}/jdcheck.js`, {
      headers,
      signal: controller.signal
    })
      .then(response => {
        window.clearTimeout(timeout)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.text()
      })
      .then(text => {
        if (!text.includes('jdownloader=true')) throw new Error('unexpected response')
        testResult.className = 'test-result ok'
        testResult.textContent = `Connection OK · ${settings.pyloadmode ? 'pyLoad' : 'jDownloader'} mode`
      })
      .catch(error => {
        window.clearTimeout(timeout)
        testResult.className = 'test-result fail'
        testResult.textContent = `Connection failed: ${error.message}`
      })
  })
}

function exportOptions() {
  chrome.storage.sync.get({ settings: defaults }, storage => {
    const blob = new Blob([JSON.stringify(storage.settings, null, 2)], { type: 'application/json' })
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = 'redirect-clicknload-settings.json'
    anchor.click()
    URL.revokeObjectURL(anchor.href)
  })
}

function importOptions(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const settings = { ...defaults, ...JSON.parse(reader.result) }
      chrome.storage.sync.set({ settings }, () => {
        restoreOptions()
        showStatus('Settings imported')
      })
    } catch (error) {
      showStatus('Invalid settings file.', true)
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

form.addEventListener('submit', event => {
  event.preventDefault()
  persistOptions()
})
form.addEventListener('input', () => { settingsDirty = true })
form.addEventListener('change', () => { settingsDirty = true })
modeToggle.addEventListener('change', updateModeUi)
protocolSelect.addEventListener('change', updateAuthenticationUi)
document.getElementById('test').addEventListener('click', testConnection)
document.getElementById('export').addEventListener('click', exportOptions)
document.getElementById('import').addEventListener('click', () => document.getElementById('importFile').click())
document.getElementById('importFile').addEventListener('change', importOptions)
document.addEventListener('DOMContentLoaded', restoreOptions)
