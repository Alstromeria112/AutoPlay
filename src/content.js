class AutoPlayer {
  constructor() {
    this.lessonSelector = "li.sc-1y7jhg7-0";
    this.completedPathSelector = 'svg path[fill="#00c541"]';
    this.clickableSelectors = [
      "div.sc-lcfvsp-10",
      "div.sc-lcfvsp-11",
      "div.sc-lcfvsp-12",
    ];
    this.autoPlayEnabled = false;
    this.handled = new Set();
    this.intervalId = null;
  }

  getLessons() {
    return Array.from(document.querySelectorAll(this.lessonSelector));
  }

  getLessonId(li) {
    return li.dataset.lessonId || li.textContent.trim();
  }

  findClickable(li) {
    return this.clickableSelectors
      .map((sel) => li.querySelector(sel))
      .find(Boolean);
  }

  async clickWhenReady(el, timeout = 2000) {
    const visible = () => {
      const s = getComputedStyle(el);
      return (
        s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0"
      );
    };
    const ready = () =>
      visible() && !el.disabled && el.getAttribute("aria-disabled") !== "true";

    for (let t = 0; t < timeout; t += 100) {
      if (ready()) return el.click();
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  async jumpToFirstUnwatched() {
    for (const li of this.getLessons()) {
      if (!li.querySelector(this.completedPathSelector)) {
        this.handled.add(this.getLessonId(li));
        const el = this.findClickable(li);
        if (el) await this.clickWhenReady(el);
        break;
      } else {
        this.handled.add(this.getLessonId(li));
      }
    }
  }

  async checkCompleted() {
    if (!this.autoPlayEnabled) return;
    const lessons = this.getLessons();

    for (let i = 0; i < lessons.length; i++) {
      const li = lessons[i];
      const id = this.getLessonId(li);

      if (
        li.querySelector(this.completedPathSelector) &&
        !this.handled.has(id)
      ) {
        this.handled.add(id);
        const next = lessons[i + 1];
        if (next) {
          const el = this.findClickable(next);
          if (el) await this.clickWhenReady(el);
        }
        break;
      }
    }
  }

  observe() {
    const list = document.querySelector("ul");
    if (!list) return;
    new MutationObserver(() => this.checkCompleted()).observe(list, {
      childList: true,
      subtree: true,
    });
  }

  startWatcher() {
    if (!this.intervalId)
      this.intervalId = setInterval(() => this.checkCompleted(), 1000);
  }

  stopWatcher() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  init() {
    chrome.storage.local.get(["autoPlayEnabled"], (res) => {
      this.autoPlayEnabled = res.autoPlayEnabled === true;
      if (this.autoPlayEnabled) {
        this.jumpToFirstUnwatched();
        this.startWatcher();
      }
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.autoPlayEnabled) {
        this.autoPlayEnabled = changes.autoPlayEnabled.newValue;
        this.autoPlayEnabled
          ? (this.jumpToFirstUnwatched(), this.startWatcher())
          : this.stopWatcher();
      }
    });

    this.observe();
  }
}

window.addEventListener("load", () => {
  setTimeout(() => new AutoPlayer().init(), 1500);
});
