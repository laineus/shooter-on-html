chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.executeScript(null, { file: 'js/initialize.js' })
})
