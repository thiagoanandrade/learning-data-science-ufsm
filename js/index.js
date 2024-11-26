const repo = "repos/thiagoanandrade/learning-data-science-ufsm"
const baseTreeURL = `https://api.github.com/${repo}/git/trees`
const baseFolder = "docs"

// Loads the file extension icons library.
const icons = require('file-icons-js')

// The index used to store the folder content. Other values will be read as folder names.
const contentIndex = "contentItemsList"

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

// Creates the classes listing HTML.
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

        const title = path[1]

        classesListing += `<h3>
            <a href="./${path[0]}?path=${classData.path}&sha=${classData.sha}">${title}</a>
        </h3>`
    }

    return classesListing ?? "<p>Nenhuma turma encontrada.</p>"
}

// Applies some regex to convert filenames to title.
function convertFilenameToTitle(filename) {
    return filename
        .replace(/\.[^/.]+$/, "")
        .replace(/[`~^*_|+\='".\{\}\[\]\\\/]/gi, ' ')
        .replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        )
}

// Creates a map of the folder and its files -> { folder1: {folder2...}, "": [my files...]}.
async function createListMap(basePath, treeData) {
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
            if (folderName == contentIndex) {
                continue
            }
            listMap[folderName] = await createListMap(item.path, treeData)
            continue
        }

        if (item.type != "blob") {
            continue
        }

        const title = convertFilenameToTitle(lastIndexSplit[1])
        const extensionIcon = await icons.getClass(lastIndexSplit[1])

        // Adds the list item to the map
        listMap[contentIndex].push(
            `<li>
                <a href="${item.path}">${title}</a>
                <i class="${extensionIcon}"></i>
            </li>`
        )
    }

    return listMap
}

// Creates a return button.
function getReturnButton() {
    return `<a href="./" style="float:right;">Voltar</a>`
}

// Formats the tag according to the folder's depth.
// Uses <p> if tagNumber greater than 5.
function getTitleTag(title, depth) {
    if (depth > 5) {
        return `<p><strong>${title}</strong></p>`
    }

    return `<h${depth}>${title}</h${depth}>`
}

// Go through each folder recursively, then, appends the html in order.
function getContentRecursively(listMap, depth) {
    let htmlString = ""
    for (let [title, list] of Object.entries(listMap)) {
        if (depth == 0) {
            htmlString += getReturnButton()
        }

        if (title && title != contentIndex) {
            htmlString += getTitleTag(title, depth + 1)
        }

        let content = ""
        if (Array.isArray(list) && title == contentIndex) {
            if (list.length > 0) {
                content += "<ul>" + list.join("\n") + "</ul>";
            }
        } else if (typeof list === "object") {
            content += getContentRecursively(list, depth + 1)
        } else {
            content = getNoContentText()
        }

        htmlString += content
    }

    return htmlString
}

// Creates the content listing HTML.
//
// Traverses the folder recursively, then appends the content of each subfolder.
// The folder must be inside baseTreeURL and the folder path and folder sha must be correct.
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
    treeData.tree.map(function (node) {
        node.path = `${folderPath}/${node.path}`
        return node
    })

    const path = splitLastIndex(folderPath, "/")
    if (path.length != 2) {
        return getNoContentText()
    }

    const title = path[1]

    let listMap = {}
    listMap[title] = await createListMap(folderPath, treeData.tree)

    return getContentRecursively(listMap, 0) ?? getNoContentText()
}

// Initializes the requests to GitHub's API.
(async () => {
    const classListing = document.getElementById("class-listing");
    if (classListing) {
        const response = await fetch(`https://api.github.com/${repo}/contents/${baseFolder}`);
        if (response.status != 200) {
            return classListing.innerHTML = "<p>API do GitHub não está OK :(</p>";
        }

        const data = await response.json();
        const sectionTitle = "<h2>Turmas</h2>"

        classListing.innerHTML = sectionTitle + buildClasses(data)
    }

    const contentListing = document.getElementById("class-content");
    if (contentListing) {
        // Gets the query parameters to generate the content listing.
        const url = new URL(window.location.href);
        const folderPath = url.searchParams.get('path');
        const folderSha = url.searchParams.get('sha');

        let content = getNoContentText()
        if (folderSha) {
            content = await buildContent(folderPath, folderSha)
        }

        // Iterate through the directories listed in baseFolder and builds the content
        contentListing.innerHTML = content
    }
})()
