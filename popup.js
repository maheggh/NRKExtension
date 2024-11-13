document.addEventListener("DOMContentLoaded", function () {
    const categoryContainer = document.getElementById("categoryContainer");
    requestCategories();

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "detectedCategories") {
            const categories = message.categories;
            categoryContainer.innerHTML = ""; 
            categories.forEach((category) => {
                if (!document.getElementById(category)) {
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.id = category;
                    checkbox.value = category;

                    const label = document.createElement("label");
                    label.htmlFor = category;
                    label.textContent = category;

                    const container = document.createElement("div");
                    container.classList.add("category-checkbox");
                    container.appendChild(checkbox);
                    container.appendChild(label);

                    categoryContainer.appendChild(container);

                    checkbox.addEventListener("change", applySelectedFilters);
                }
            });
            loadSavedFilters();
        }
    });

    function requestCategories() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "requestCategories" }, (response) => {
                    if (chrome.runtime.lastError) {
                        injectContentScript(tabs[0].id);
                    }
                });
            }
        });
    }

    function applySelectedFilters() {
        const selectedFilters = Array.from(categoryContainer.querySelectorAll("input:checked"))
            .map((checkbox) => checkbox.value);
        sendMessageToContentScript({ action: "applyFilters", filters: selectedFilters });
        chrome.storage.local.set({ selectedFilters });
    }

    function loadSavedFilters() {
        chrome.storage.local.get("selectedFilters", (data) => {
            if (data.selectedFilters) {
                data.selectedFilters.forEach((filter) => {
                    const checkbox = document.getElementById(filter);
                    if (checkbox) checkbox.checked = true;
                });
            }
        });
    }

    function sendMessageToContentScript(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                    if (chrome.runtime.lastError) {
                        injectContentScript(tabs[0].id, message);
                    }
                });
            }
        });
    }

    function injectContentScript(tabId) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        });
    }

    document.getElementById("showAllButton")?.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "showAll" });
        });
        categoryContainer.querySelectorAll("input[type='checkbox']").forEach(checkbox => checkbox.checked = false);
    });
});
