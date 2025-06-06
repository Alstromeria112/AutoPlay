const toggle = document.getElementById("toggle");

chrome.storage.local.get(["autoPlayEnabled"], (result) => {
  toggle.checked = result.autoPlayEnabled === true;
});

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ autoPlayEnabled: toggle.checked }, () => {
    console.log("Success:", toggle.checked);
  });
});
