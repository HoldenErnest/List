

function newEntry() {
    var isHidden = document.getElementById("create").style.display == "none"
    if (isHidden)
        document.getElementById("create").style.display = "block";
    else
    document.getElementById("create").style.display = "none";
}