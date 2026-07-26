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

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlight(escapedText, escapedTerm) {
    if (!escapedTerm) return escapedText;
    var re = new RegExp("(" + escapeRegExp(escapedTerm) + ")", "ig");
    return escapedText.replace(re, "<mark>$1</mark>");
  }

  function renderInline(text, term) {
    // Turn ![alt](url) into an <img>; escape and optionally highlight everything else.
    var parts = text.split(/(!\[[^\]]*\]\([^)]+\))/g);
    return parts.map(function (part) {
      var m = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(part);
      if (m) {
        var alt = escapeHtml(m[1]);
        var url = escapeHtml(m[2]);
        return '<img src="' + url + '" alt="' + alt + '" loading="lazy">';
      }
      var escaped = escapeHtml(part).replace(/\n/g, "<br>");
      return term ? highlight(escaped, escapeHtml(term)) : escaped;
    }).join("");
  }

  function renderBody(content, term) {
    return content
      .split(/\n\s*\n/)
      .map(function (para) {
        return "<p>" + renderInline(para, term) + "</p>";
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

  function entryHtml(post, term) {
    var d = new Date(post.date);
    var titleEscaped = escapeHtml(post.title || "Untitled");
    if (term) titleEscaped = highlight(titleEscaped, escapeHtml(term));
    return (
      '<article class="entry">' +
      '<div class="entry-stamp">' + formatStamp(d) + "</div>" +
      '<h2 class="entry-title">' + titleEscaped + "</h2>" +
      '<div class="entry-body">' + renderBody(post.content || "", term) + "</div>" +
      "</article>"
    );
  }

  function renderGrouped(feed, posts) {
    if (posts.length === 0) {
      feed.innerHTML = '<div class="empty-state">No entries yet. The first page is always blank.</div>';
      return;
    }

    var sorted = posts.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    var now = new Date();
    var currentKey = now.getFullYear() + "-" + now.getMonth();

    var groups = [];
    var groupMap = {};
    sorted.forEach(function (post) {
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
      var entriesHtml = g.posts.map(function (post) { return entryHtml(post, null); }).join("");

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
  }

  function renderSearchResults(feed, posts, term) {
    var matches = posts.filter(function (post) {
      var haystack = ((post.title || "") + " " + (post.content || "")).toLowerCase();
      return haystack.indexOf(term.toLowerCase()) !== -1;
    }).sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    var heading = '<div class="search-results-heading">' +
      matches.length + (matches.length === 1 ? " entry" : " entries") +
      ' matching "' + escapeHtml(term) + '"</div>';

    if (matches.length === 0) {
      feed.innerHTML = heading + '<div class="empty-state">No entries mention that word yet.</div>';
      return;
    }

    feed.innerHTML = heading + matches.map(function (post) { return entryHtml(post, term); }).join("");
  }

  /* ---------- Render ---------- */
  function loadPosts() {
    var feed = document.getElementById("feed");
    var searchBox = document.getElementById("searchBox");
    var allPosts = [];

    fetch("posts.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("could not load posts.json");
        return res.json();
      })
      .then(function (posts) {
        allPosts = Array.isArray(posts) ? posts : [];
        renderGrouped(feed, allPosts);
      })
      .catch(function (err) {
        feed.innerHTML = '<div class="empty-state">Couldn\'t load entries (' + escapeHtml(err.message) + ").</div>";
      });

    if (searchBox) {
      searchBox.addEventListener("input", function () {
        var term = searchBox.value.trim();
        if (!term) {
          renderGrouped(feed, allPosts);
        } else {
          renderSearchResults(feed, allPosts, term);
        }
      });
    }
  }
})();
