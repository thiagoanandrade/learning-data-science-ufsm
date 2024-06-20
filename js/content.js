const repo = "repos/luabagg/learning-data-science-ufsm"
const baseTreeURL = `https://api.github.com/${repo}/git/trees`

// The index used to store the folder content. Other values will be read as folder names.
const contentIndex = ""

// Returns default text for no content.
function getNoContentText() {
    return "<p>Lista de conteúdos vazia :(</p>"
}

// Split method that only splits the separator's last occurance.
function splitLastIndex(item, separator) {
    const pos = item.lastIndexOf(separator)

    return pos == -1 ? [item] :
        [
            item.slice(0, pos),
            item.slice(pos + 1)
        ]
}

// Creates a map of the folder and its files -> { folder1: {folder2...}, "": [my files...]}.
function createListMap(basePath, treeData) {
    let listMap = {}
    listMap[contentIndex] = []

    for (let [key, item] of Object.entries(treeData)) {
        const itemPaths = item.path.split("/")
        const lastIndexSplit = splitLastIndex(item.path, "/")

        // Check if the iteration is in the right depth
        if (lastIndexSplit.length != 2 || basePath != lastIndexSplit[0]) {
            continue
        }

        delete treeData[key]

        if (item.type == "tree") {
            const folderName = itemPaths.slice(-1).pop()
            listMap[folderName] = createListMap(item.path, treeData)
            continue
        }

        if (item.type != "blob") {
            continue
        }

        // Adds the list item to the map
        listMap[contentIndex].push(
            `<li><a href="${item.path}">${lastIndexSplit[1]}</a></li>`
        )
    }

    return listMap
}

// Formats the tag according to the folder's depth.
// Uses <p> if tagNumber greater than 6.
function getTitleTag(title, depth) {
    if (depth > 6) {
        return `<p><strong>${title}</strong></p>`
    }

    return `<h${depth}>${title}</h${depth}>`
}

// Go through each folder recursively, then, appends the html in order.
function getContentRecursively(listMap, depth) {
    let htmlString = ""
    for (let [title, list] of Object.entries(listMap)) {
        if (title) {
            htmlString += getTitleTag(title, depth + 1)
        }

        let content = ""
        if (Array.isArray(list) && title == contentIndex) {
            // If it's
            content += "<ul>" + list.join("\n") + "</ul>";
        } else if (typeof list === "object") {
            content += getContentRecursively(list, depth + 1)
        }

        if (!content) {
            htmlString += getNoContentText()
        } else {
            htmlString += content
        }
    }

    return htmlString
}

// Traverses the folder recursively, then appends the content of each subfolder.
// The folder must be inside ./docs and the folder path and folder sha must be correct.
async function buildContent(folderPath, folderSha) {
    // Get directory info recursively
    const treeResponse = await fetch(`${baseTreeURL}/${folderSha}?recursive=1`);
    if (treeResponse.status != 200) {
        return getNoContentText()
    }
    const treeData = await treeResponse.json();
    if (!treeData.tree) {
        return getNoContentText()
    }

    // Standardizes each node's path to represent the full path
    const fmtTree = treeData.tree.map(function(node) {
        node.path = `${folderPath}/${node.path}`
        return node
    })

    const path = splitLastIndex(folderPath, "/")
    if (path.length != 2) {
        return getNoContentText()
    }

    const title = path[1]

    let listMap = {}
    listMap[title] = createListMap(folderPath, fmtTree)

    return getContentRecursively(listMap, 0) ?? getNoContentText()
}

// Gets the query parameters to generate the content listing.
(async () => {
    const url = new URL(window.location.href);
    const folderPath = url.searchParams.get('path');
    const folderSha = url.searchParams.get('sha');

    content = getNoContentText()
    if (folderSha) {
        content = await buildContent(folderPath, folderSha)
    }

    // Iterate through the directories listed in baseFolder and builds the content
    document.getElementById("class-content").innerHTML = content
})()