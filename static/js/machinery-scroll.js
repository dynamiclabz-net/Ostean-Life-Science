(function () {
  "use strict";

  function initMachineryScroll(root) {
    var track = root.querySelector(".mx-track");
    var stage = root.querySelector(".mx-stage");
    var viewport = root.querySelector(".mx-list-viewport");
    var list = root.querySelector(".mx-list");
    var panel = root.querySelector(".mx-panel");
    var items = Array.prototype.slice.call(root.querySelectorAll(".mx-item"));
    var photoFrame = root.querySelector(".mx-photo-frame");
    var titleEl = root.querySelector(".mx-panel-title");
    var descEl = root.querySelector(".mx-panel-desc");
    var tagEl = root.querySelector(".mx-tag");
    var counterEl = root.querySelector(".mx-counter");
    var barEl = root.querySelector(".mx-progress-bar");

    if (!track || !stage || !list || !items.length) return;

    var count = items.length;
    var activeIndex = -1;
    var ticking = false;
    var changeTimer = null;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.style.setProperty("--mx-count", count);

    // One photo layer per machine so images cross-fade. Use data-image on an item to supply a real photo.
    var photos = items.map(function (item) {
      var layer = document.createElement("div");
      layer.className = "mx-photo";
      layer.setAttribute("aria-hidden", "true");

      var imageSrc = item.getAttribute("data-image");
      if (imageSrc) {
        var img = document.createElement("img");
        img.src = imageSrc;
        img.alt = "";
        img.loading = "lazy";
        layer.appendChild(img);
      } else {
        var icon = document.createElement("i");
        icon.className = "bi bi-image";
        var label = document.createElement("span");
        label.className = "mx-photo-label";
        label.textContent = item.getAttribute("data-title");
        layer.appendChild(icon);
        layer.appendChild(label);
      }
      photoFrame.appendChild(layer);
      return layer;
    });

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function centerActiveItem() {
      var item = items[activeIndex];
      var offset = item.offsetTop + item.offsetHeight / 2 - viewport.clientHeight / 2;
      var maxOffset = Math.max(0, list.scrollHeight - viewport.clientHeight);
      offset = Math.min(Math.max(offset, 0), maxOffset);
      list.style.transform = "translateY(" + -offset + "px)";
    }

    function setActive(index) {
      if (index === activeIndex) return;
      var first = activeIndex === -1;
      activeIndex = index;

      items.forEach(function (item, i) {
        var isActive = i === index;
        item.classList.toggle("is-active", isActive);
        if (isActive) {
          item.setAttribute("aria-current", "true");
        } else {
          item.removeAttribute("aria-current");
        }
        photos[i].classList.toggle("is-active", isActive);
      });

      var item = items[index];
      var applyText = function () {
        titleEl.textContent = item.getAttribute("data-title");
        descEl.textContent = item.getAttribute("data-desc");
        tagEl.textContent = item.getAttribute("data-tag");
        counterEl.textContent = pad(index + 1) + " / " + pad(count);
        panel.classList.remove("is-changing");
      };

      clearTimeout(changeTimer);
      if (first || reduceMotion) {
        applyText();
      } else {
        panel.classList.add("is-changing");
        changeTimer = setTimeout(applyText, 180);
      }

      barEl.style.width = ((index + 1) / count) * 100 + "%";
      centerActiveItem();
    }

    function getProgress() {
      var rect = track.getBoundingClientRect();
      var travel = track.offsetHeight - stage.offsetHeight;
      if (travel <= 0) return 0;
      var stuckAt = parseFloat(getComputedStyle(stage).top) || 0;
      return Math.min(Math.max((stuckAt - rect.top) / travel, 0), 1);
    }

    function update() {
      ticking = false;
      var index = Math.min(count - 1, Math.floor(getProgress() * count));
      setActive(index);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    // Clicking a machine scrolls the page to the point that activates it.
    items.forEach(function (item, i) {
      item.addEventListener("click", function () {
        var travel = track.offsetHeight - stage.offsetHeight;
        var stuckAt = parseFloat(getComputedStyle(stage).top) || 0;
        var trackTop = track.getBoundingClientRect().top + window.scrollY;
        var target = trackTop - stuckAt + ((i + 0.5) / count) * travel;
        window.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
      });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      if (activeIndex > -1) centerActiveItem();
      onScroll();
    });
    window.addEventListener("load", function () {
      if (activeIndex > -1) centerActiveItem();
      onScroll();
    });

    update();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-mx-scroll]").forEach(initMachineryScroll);
  });
})();
