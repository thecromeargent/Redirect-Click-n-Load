
## Usage

Open Options and enter hostname or IP of the machine running pyload

<img src="./screens/options.png" width="480">

## Non-https pitfalls

If you use a local IP Address as Target Host you have to allow "mixed-content".

```
chrome://settings/content/siteDetails?site=https%3A%2F%2Ffilecrypt.co
```

<img src="./screens/mixed.png" width="480">


Visit some page which uses Click n Load

<img src="./screens/click n load.png" width="480">


Wait until page gets green

<img src="./screens/sucess.png" width="480">


## Changelog

* 2026-07-16
  * fixed `/flash/add` requests (plain `fetch()`/XHR calls, no `<form>` involved, e.g. hide.cx) not being redirected
  * fixed with a `content_scripts` entry running in the `"world": "MAIN"` at `document_start`, patching `fetch` before the page's own scripts run, then relaying the intercepted call to an ISOLATED-world script via `postMessage` (MAIN world has no `chrome.runtime` access) which forwards it to the background page for the actual request

<br>

* 2026-07-12
  * restyled options page (no CSS library), added dark mode
  * export/import settings now in their own row, Save button aligned right
  * added "Test connection" button to verify the target host/port is reachable before saving
  * "Test connection" now requests the `<all_urls>` host permission at click time, needed because Firefox ships it as an optional, user-toggleable permission (disabled by default) regardless of it being listed in `host_permissions`, causing a silent CORS failure otherwise

<br>

* 2026-06-29
  * migrated to Manifest V3
  * replaced `eval`-based jdcheck.js injection (broke due to CSP) with `declarativeNetRequest` redirect to bundled `jdcheck.js`
  * removed `externally_connectable` (invalid with `<all_urls>` in MV3, unused by current flow)
  * fixed `Authorization` header sending literal `"null"` when no credentials configured

<br>

* 2021-11-28
  * added support for https and basic authentication, due to stronger CORS policy enforcement. https://wicg.github.io/cors-rfc1918

<br>

* 2021-11-08
  * don't return redirectUrl if not matched. fixes [#5](https://github.com/werty1st/Redirect-Click-n-Load/issues/5)

<br>

* 2021-05-10
  * added option to redirect the port number
  * remove request listener on pause to leave the request untouched

<br>

* 2020-05-10
  * removed donation button
  * removed unused permissions
  * removed unused code


## Troubleshooting

* check if plugin is enabled (not paused)
* check if target is running and accessible
* check options if target hostname is still set
* Firefox: "Access your data for all websites" is disabled by default (`about:addons` > Redirect Click'n'Load > Permissions). Click "Test connection" once to trigger the permission prompt, or enable the toggle manually.



Video https://www.youtube.com/watch?v=BLyknZbai5g&feature=youtu.be
