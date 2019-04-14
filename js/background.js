const alreadyInjectedTabs = []
chrome.browserAction.onClicked.addListener(tab => {
  if (!alreadyInjectedTabs.includes(tab.id)) {
    alreadyInjectedTabs.push(tab.id)
    chrome.tabs.executeScript(null, { file: 'js/index.js' })
    chrome.tabs.insertCSS(null, { file: 'css/style.css' })
  }
  chrome.tabs.executeScript(null, { file: 'js/initialize.js' })
})
