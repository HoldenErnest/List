function showDiv(selectedDiv) {
    // Hide all content divs
    const divs = document.querySelectorAll('.content');
    divs.forEach(div => {
        div.style.display = 'none';
    });

    // Show the selected div
    document.getElementById(selectedDiv).style.display = 'block';
}