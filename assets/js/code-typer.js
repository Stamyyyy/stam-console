(function (global) {
  var KEYWORDS = /^(var|let|const|function|return|if|else|for|while|new|this|typeof|void|null|true|false|break|continue|switch|case|default|try|catch|throw|class|extends|async|await|in|of|do|delete|instanceof|float|vec2|vec3|vec4|uniform|attribute|precision|mediump|highp|int)$/;

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlight(text) {
    var out = "";
    var i = 0;
    while (i < text.length) {
      var rest = text.slice(i);

      var comment = rest.match(/^\/\/[^\n]*/);
      if (comment) {
        out += '<span class="tok-com">' + escapeHtml(comment[0]) + "</span>";
        i += comment[0].length;
        continue;
      }

      var str = rest.match(/^(["'])(?:\\.|(?!\1)[^\\])*\1?/);
      if (str) {
        out += '<span class="tok-str">' + escapeHtml(str[0]) + "</span>";
        i += str[0].length;
        continue;
      }

      var num = rest.match(/^\d+(\.\d+)?/);
      if (num) {
        out += '<span class="tok-num">' + escapeHtml(num[0]) + "</span>";
        i += num[0].length;
        continue;
      }

      var word = rest.match(/^[A-Za-z_$][\w$]*/);
      if (word) {
        if (KEYWORDS.test(word[0])) {
          out += '<span class="tok-kw">' + word[0] + "</span>";
        } else if (rest.charAt(word[0].length) === "(") {
          out += '<span class="tok-var">' + word[0] + "</span>";
        } else {
          out += escapeHtml(word[0]);
        }
        i += word[0].length;
        continue;
      }

      out += escapeHtml(text.charAt(i));
      i += 1;
    }
    return out;
  }

  function createCodeTyper(target, snippets, options) {
    var el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el || !snippets || !snippets.length) return null;

    var opts = options || {};
    var charDelay = opts.charDelay || 22;
    var lineDelay = opts.lineDelay || 90;
    var holdDelay = opts.holdDelay || 2600;
    var reduced = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var snippetIndex = 0;
    var timer = null;
    var running = true;
    var destroyed = false;

    function typeSnippet(onDone) {
      var snippet = snippets[snippetIndex];
      var lineIndex = 0;

      el.textContent = "";
      var doneEl = document.createElement("span");
      var liveEl = document.createTextNode("");
      var cursorEl = document.createElement("span");
      cursorEl.className = "tok-cursor";
      el.appendChild(doneEl);
      el.appendChild(liveEl);
      el.appendChild(cursorEl);

      function typeLine() {
        if (destroyed) return;
        if (lineIndex >= snippet.length) {
          timer = setTimeout(onDone, holdDelay);
          return;
        }
        var line = snippet[lineIndex];
        var charIndex = 0;
        (function step() {
          if (destroyed) return;
          if (!running) {
            timer = setTimeout(step, 200);
            return;
          }
          liveEl.nodeValue = line.slice(0, charIndex);
          charIndex += 1;
          if (charIndex > line.length) {
            doneEl.insertAdjacentHTML("beforeend", highlight(line) + "\n");
            liveEl.nodeValue = "";
            lineIndex += 1;
            timer = setTimeout(typeLine, lineDelay);
            return;
          }
          timer = setTimeout(step, charDelay);
        })();
      }

      typeLine();
    }

    function cycle() {
      typeSnippet(function () {
        snippetIndex = (snippetIndex + 1) % snippets.length;
        cycle();
      });
    }

    if (reduced) {
      el.innerHTML = snippets[0].map(highlight).join("\n");
      return { destroy: function () { destroyed = true; } };
    }

    cycle();

    var onScreen = true;
    var tabVisible = !document.hidden;

    if ("IntersectionObserver" in global) {
      var io = new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        running = onScreen && tabVisible;
      }, { threshold: 0 });
      io.observe(el);
    }

    document.addEventListener("visibilitychange", function () {
      tabVisible = !document.hidden;
      running = onScreen && tabVisible;
    });

    return {
      destroy: function () {
        destroyed = true;
        if (timer) clearTimeout(timer);
      }
    };
  }

  global.createCodeTyper = createCodeTyper;
})(window);
