const repo = "repos/luabagg/learning-data-science-ufsm"
const baseFolder = "docs"

// Split method that only splits the separator's last occurance.
function splitLastIndex(item, separator) {
    const pos = item.lastIndexOf(separator)

    return pos == -1 ? [item] :
        [
            item.slice(0, pos),
            item.slice(pos + 1)
        ]
}

function buildClasses(classesData) {
    let classesListing = ""
    for (let classData of classesData) {
        if (classData.type != "dir") {
            continue
        }

        const path = splitLastIndex(classData.path, "/")
        if (path.length != 2) {
            continue
        }

        classesListing += `<h3>
            <a href="./${path[0]}/index.html?path=${path[1]}&sha=${classData.sha}">${path[1]}</a>
        </h3>`
    }

    return classesListing ?? getNoContentText()
}

// Initializes the requests to GitHub's API.
(async () => {
    const response = await fetch(`https://api.github.com/${repo}/contents/${baseFolder}`);
    if (response.status != 200) {
        return document.getElementById("class-listing").innerHTML = "<p>API do GitHub não está OK :(</p>";
    }

    const data = await response.json();

    document.getElementById("class-listing").innerHTML = buildClasses(data)
})()