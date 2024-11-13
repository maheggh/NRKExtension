function getCategoriesFromPage() {
    const categorySet = new Set();
    document.querySelectorAll("section.kur-floor").forEach((section) => {
        section.querySelectorAll("a").forEach((linkElement) => {
            const href = linkElement.getAttribute("href");
            if (!href || !href.startsWith("https://")) return;

            const match = href.match(/^https:\/\/[^/]+\/([a-zA-Z-]+)\//);
            if (match && match[1]) {
                const category = match[1];
                categorySet.add(category);
            }
        });
    });
    const categoriesArray = Array.from(categorySet);
    categoriesArray.push("minigames", "p3", "radio");
    return categoriesArray;
}

function sendDetectedCategories() {
    const categories = getCategoriesFromPage();
    chrome.runtime.sendMessage({ action: "detectedCategories", categories: categories });
}

function applyFilters(filters) {
    document.querySelectorAll("section.kur-floor .kur-room-wrapper").forEach((article) => {
        const link = article.querySelector("a");
        const href = link?.getAttribute("href") || "";
        let shouldHide = false;

        for (const category of filters) {
            if (category === "minigames" && article.querySelector(".kur-floor__title-text")?.textContent.includes("DAGLIGE MINISPILL")) {
                shouldHide = true;
                break;
            }
            if (category === "p3" && href.includes("p3.no")) {
                shouldHide = true;
                break;
            }
            if (category === "radio" && href.includes("radio.nrk.no")) {
                shouldHide = true;
                break;
            }
            const categoryPattern = new RegExp(`/${category}/`, 'i');
            if (categoryPattern.test(href)) {
                shouldHide = true;
                break;
            }
        }

        article.style.display = shouldHide ? "none" : "block";
    });
}

chrome.storage.local.get("selectedFilters", (data) => {
    if (data.selectedFilters) {
        applyFilters(data.selectedFilters);
    }
});

sendDetectedCategories();

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "applyFilters") {
        const selectedFilters = message.filters;
        chrome.storage.local.set({ "selectedFilters": selectedFilters });
        applyFilters(selectedFilters);
    } else if (message.action === "showAll") {
        document.querySelectorAll("section.kur-floor .kur-room-wrapper").forEach((article) => {
            article.style.display = "block";
        });
    } else if (message.action === "requestCategories") {
        sendDetectedCategories();
    }
});
