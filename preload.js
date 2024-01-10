// Make edits to the DOM 

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) { // replace text with certain ID(chrome-version ect)
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})