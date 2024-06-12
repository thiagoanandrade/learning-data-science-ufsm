const repo = "repos/luabagg/learning-data-science-ufsm"
const baseFolder = "docs"
const baseTreeURL = `https://api.github.com/${repo}/git/trees`
const baseFolderIndex = ""

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
    listMap[baseFolderIndex] = []

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
        listMap[baseFolderIndex].push(
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
function writeListRecursively(listMap, depth) {
    let htmlString = ""
    for (let [title, list] of Object.entries(listMap)) {
        if (title) {
            htmlString += getTitleTag(title, depth + 1)
        }

        let content = ""
        if (Array.isArray(list) && title == baseFolderIndex) {
            content += "<ul>" + list.join("\n") + "</ul>";
        } else if (typeof list === "object") {
            content += writeListRecursively(list, depth + 1)
        }

        if (!content) {
            htmlString += getNoContentText()
        } else {
            htmlString += content
        }
    }

    return htmlString
}

// Traverses the subFolders starting by the base folder (defined as "").
// Then appends the html of each subfolder.
async function buildHtml(dirs) {
    let listMap = {}
    // Get directory info recursively
    for (let subFolder of dirs) {
        if (subFolder.type != "dir") {
            continue
        }

        const treeResponse = await fetch(`${baseTreeURL}/${subFolder.sha}?recursive=1`);
        if (treeResponse.status != 200) {
            return getNoContentText()
        }
        const treeData = await treeResponse.json();
        if (!treeData.tree) {
            return getNoContentText()
        }

        // Standardizes each node's path to represent the full path
        const fmtTree = treeData.tree.map(function(node) {
            node.path = `${subFolder.path}/${node.path}`
            return node
        })

        const folder = splitLastIndex(subFolder.path, "/")
        if (folder.length != 2) {
            continue
        }
        listMap[folder[1]] = createListMap(subFolder.path, fmtTree)
    }

    return writeListRecursively(listMap, 1) ?? getNoContentText()
}

// Initializes the requests to GitHub's API.
(async () => {
    const response = await fetch(`https://api.github.com/${repo}/contents/${baseFolder}`);
    if (response.status != 200) {
        return document.getElementById("container").innerHTML = "<p>API do GitHub não está OK :(</p>";
    }

    const data = await response.json();

    // Iterate through the directories listed in baseFolder and builds the content
    document.getElementById("container").innerHTML = await buildHtml(data)
})()