let alreadyInjected = false

chrome.browserAction.onClicked.addListener(() => {
  if (!alreadyInjected) {
    alreadyInjected = true
    chrome.tabs.executeScript(null, { file: 'js/index.js' })
    chrome.tabs.insertCSS(null, { file: 'css/style.css' })
  }
  chrome.tabs.executeScript(null, { file: 'js/initialize.js' })
})

chrome.tabs.onUpdated.addListener(() => {
  alreadyInjected = false
})
