(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var stored = localStorage.getItem("theme");
  if (stored) {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }

  function updateToggleLabel() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    var isDark = root.getAttribute("data-theme") === "dark";
    btn.textContent = isDark ? "☀ Light" : "☾ Dark";
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateToggleLabel();
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var isDark = root.getAttribute("data-theme") === "dark";
        var next = isDark ? "light" : "dark";
        root.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
        updateToggleLabel();
      });
    }
    loadPosts();
  });

  /* ---------- Helpers ---------- */
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderInline(text) {
    // Turn ![alt](url) into an <img>; escape everything else.
    var parts = text.split(/(!\[[^\]]*\]\([^)]+\))/g);
    return parts.map(function (part) {
      var m = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(part);
      if (m) {
        var alt = escapeHtml(m[1]);
        var url = escapeHtml(m[2]);
        return '<img src="' + url + '" alt="' + alt + '" loading="lazy">';
      }
      return escapeHtml(part).replace(/\n/g, "<br>");
    }).join("");
  }

  function renderBody(content) {
    return content
      .split(/\n\s*\n/)
      .map(function (para) {
        return "<p>" + renderInline(para) + "</p>";
      })
      .join("");
  }

  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  function formatStamp(d) {
    var day = String(d.getDate()).padStart(2, "0");
    var mon = MONTHS[d.getMonth()].slice(0, 3).toUpperCase();
    var hh = String(d.getHours()).padStart(2, "0");
    var mm = String(d.getMinutes()).padStart(2, "0");
    return day + " " + mon + " " + d.getFullYear() + " · " + hh + ":" + mm;
  }

  /* ---------- Render ---------- */
  function loadPosts() {
    var feed = document.getElementById("feed");
    fetch("posts.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("could not load posts.json");
        return res.json();
      })
      .then(function (posts) {
        if (!Array.isArray(posts) || posts.length === 0) {
          feed.innerHTML = '<div class="empty-state">No entries yet. The first page is always blank.</div>';
          return;
        }

        posts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

        var now = new Date();
        var currentKey = now.getFullYear() + "-" + now.getMonth();

        var groups = [];
        var groupMap = {};
        posts.forEach(function (post) {
          var d = new Date(post.date);
          var key = d.getFullYear() + "-" + d.getMonth();
          if (!groupMap[key]) {
            var g = { key: key, label: MONTHS[d.getMonth()] + " " + d.getFullYear(), posts: [] };
            groupMap[key] = g;
            groups.push(g);
          }
          groupMap[key].posts.push(post);
        });

        feed.innerHTML = groups.map(function (g) {
          var isCurrent = g.key === currentKey;
          var entriesHtml = g.posts.map(function (post) {
            var d = new Date(post.date);
            return (
              '<article class="entry">' +
              '<div class="entry-stamp">' + formatStamp(d) + "</div>" +
              '<h2 class="entry-title">' + escapeHtml(post.title || "Untitled") + "</h2>" +
              '<div class="entry-body">' + renderBody(post.content || "") + "</div>" +
              "</article>"
            );
          }).join("");

          return (
            "<details class=\"month-group\"" + (isCurrent ? " open" : "") + ">" +
            '<summary class="month-summary">' +
            "<span>" + g.label + "</span>" +
            '<span class="rule"></span>' +
            '<span class="count">' + g.posts.length + (g.posts.length === 1 ? " entry" : " entries") + "</span>" +
            "</summary>" +
            entriesHtml +
            "</details>"
          );
        }).join("");
      })
      .catch(function (err) {
        feed.innerHTML = '<div class="empty-state">Couldn\'t load entries (' + escapeHtml(err.message) + ").</div>";
      });
  }
})();
