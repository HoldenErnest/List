// Holden Ernest - 1/11/2024
// This has access to both the DOM and electron

window.addEventListener('DOMContentLoaded', () => {
    
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) { // replace text with certain ID(chrome-version ect)
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
})