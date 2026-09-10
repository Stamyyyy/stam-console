(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__stamAudio = { level: 0, active: false };

  function outsideContact(e) {
    return !e.target.closest(".contact-grid") && !e.target.closest("#contact-form-scrim");
  }
  ["copy", "cut", "contextmenu"].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      if (outsideContact(e)) e.preventDefault();
    });
  });

  var projectVideos = document.querySelectorAll(".project-video");
  if (reduceMotion) {
    projectVideos.forEach(function (video) {
      video.removeAttribute("loop");
      video.pause();
    });
  } else if ("IntersectionObserver" in window) {
    var videoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25 });
    projectVideos.forEach(function (video) { videoIO.observe(video); });
  } else {
    projectVideos.forEach(function (video) { video.play().catch(function () {}); });
  }

  document.querySelectorAll(".stagger").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, idx) {
      child.style.setProperty("--stagger-i", idx);
    });
  });

  function startHeroIntro() {
    var headline = document.getElementById("hero-headline");
    if (headline && !reduceMotion) {
      headline.classList.add("is-glitching");
      headline.addEventListener("animationend", function () {
        headline.classList.remove("is-glitching");
      }, { once: true });
    }

    var words = document.querySelectorAll("#hero-headline .word");
    words.forEach(function (w, idx) {
      w.style.setProperty("--word-i", idx);
      if (reduceMotion) {
        w.classList.add("is-in");
      } else {
        requestAnimationFrame(function () { w.classList.add("is-in"); });
      }
    });

    var typedEl = document.getElementById("hero-typed");
    var lede = document.getElementById("hero-lede");
    if (reduceMotion) {
      if (typedEl) typedEl.textContent = typedEl.getAttribute("data-text") || "";
      if (lede) lede.classList.add("is-in");
      return;
    }
    if (!typedEl) {
      if (lede) lede.classList.add("is-in");
      return;
    }
    var cursor = typedEl.querySelector(".type-cursor");
    var text = typedEl.getAttribute("data-text") || "";
    var i = 0;
    var textNode = document.createTextNode("");
    typedEl.insertBefore(textNode, cursor);
    setTimeout(function () {
      var timer = setInterval(function () {
        textNode.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          if (cursor) cursor.classList.add("is-done");
          if (lede) lede.classList.add("is-in");
        }
      }, 22);
    }, 350);
  }

  function runBootLog(lines, onDone, startDelay) {
    var logo = document.getElementById("loader-logo");
    var log = document.getElementById("loader-log");
    if (!log) { onDone(); return; }
    log.textContent = "";

    var li = 0;
    function typeLine() {
      if (li >= lines.length) {
        if (logo) {
          logo.classList.add("is-glitching");
          logo.addEventListener("animationend", function () { logo.classList.remove("is-glitching"); }, { once: true });
        }
        setTimeout(onDone, 380);
        return;
      }
      var el = document.createElement("div");
      el.className = "loader-log-line is-current";
      log.appendChild(el);
      var text = lines[li];
      var ci = 0;
      var timer = setInterval(function () {
        el.textContent = text.slice(0, ci);
        ci++;
        if (ci > text.length) {
          clearInterval(timer);
          el.classList.remove("is-current");
          li++;
          setTimeout(typeLine, 90);
        }
      }, 13);
    }
    setTimeout(typeLine, startDelay || 0);
  }

  (function () {
    var loader = document.getElementById("loader");
    if (!loader) { startHeroIntro(); return; }

    var seen = false;
    try { seen = sessionStorage.getItem("stam-intro-seen") === "1"; } catch (e) {}

    if (reduceMotion || seen) {
      loader.classList.add("is-hidden");
      loader.style.display = "none";
      startHeroIntro();
      return;
    }

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      loader.classList.add("is-hidden");
      try { sessionStorage.setItem("stam-intro-seen", "1"); } catch (e) {}
      setTimeout(function () { loader.style.display = "none"; }, 400);
      startHeroIntro();
    }

    runBootLog([
      "> INITIALIZING STAM_CONSOLE",
      "> authenticating... GRANTED",
      "> mounting modules... 12 OK",
      "> render pipeline... ONLINE",
      "> STATUS: READY"
    ], finish, 750);

    loader.addEventListener("click", finish);
    window.addEventListener("keydown", finish, { once: true });
    setTimeout(finish, 4200);
  })();

  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  if (!reduceMotion) {
    document.querySelectorAll(".project-card, .offer-card, .skill-group").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
      });
    });
  }

  (function () {
    var root = document.documentElement;
    var btn = document.getElementById("theme-toggle");
    var STORAGE_KEY = "stam-console-theme";
    var mql = null;

    function systemTheme() {
      return "dark";
    }
    function effectiveTheme() {
      var explicit = root.getAttribute("data-theme");
      return explicit === "light" || explicit === "dark" ? explicit : systemTheme();
    }
    function updateLabel(theme) {
      if (!btn) return;
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }

    updateLabel(effectiveTheme());

    if (mql && mql.addEventListener) {
      mql.addEventListener("change", function () {
        if (!root.getAttribute("data-theme")) updateLabel(effectiveTheme());
      });
    }

    if (btn) {
      btn.addEventListener("click", function () {
        var next = effectiveTheme() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        updateLabel(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      });
    }
  })();

  (function () {
    var burger = document.getElementById("nav-burger");
    var links = document.getElementById("nav-links");
    var navEl = document.querySelector(".nav");
    if (!burger || !links || !navEl) return;

    function setNavHeightVar() {
      document.documentElement.style.setProperty("--nav-h", navEl.offsetHeight + "px");
    }
    function closeMenu() {
      links.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
      document.documentElement.classList.remove("nav-scroll-lock");
    }
    function openMenu() {
      setNavHeightVar();
      links.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Close menu");
      document.documentElement.classList.add("nav-scroll-lock");
    }

    burger.addEventListener("click", function () {
      if (links.classList.contains("is-open")) closeMenu(); else openMenu();
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a, button")) closeMenu();
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) {
        closeMenu();
        burger.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (links.classList.contains("is-open")) setNavHeightVar();
      else if (window.innerWidth > 760) closeMenu();
    });
  })();

  var moreBtn = document.getElementById("projects-more-btn");
  var projectsCollapse = document.getElementById("projects-collapse");
  var moreWrap = moreBtn ? moreBtn.closest(".projects-more-wrap") : null;
  function expandProjects() {
    if (!projectsCollapse || projectsCollapse.classList.contains("is-expanded")) return;
    projectsCollapse.classList.add("is-expanded");
    if (moreBtn) moreBtn.setAttribute("aria-expanded", "true");
    if (moreWrap) moreWrap.classList.add("is-hidden");
  }
  if (moreBtn) moreBtn.addEventListener("click", expandProjects);

  var filterBtns = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll(".project-card");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var filter = btn.getAttribute("data-filter");
      if (filter !== "all") expandProjects();
      cards.forEach(function (card) {
        var cats = (card.getAttribute("data-category") || "").split(" ");
        var show = filter === "all" || cats.indexOf(filter) !== -1;
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  var copyBtn = document.getElementById("copy-discord");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var text = document.getElementById("discord-value").textContent;
      var done = function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = "Copied";
        setTimeout(function () { copyBtn.textContent = original; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {});
      }
    });
  }

  var footerTopBtn = document.getElementById("footer-top-btn");
  if (footerTopBtn) {
    footerTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  var sigOutput = document.getElementById("sig-output");
  if (sigOutput && !reduceMotion) {
    var lastPointerUpdate = 0;
    window.addEventListener("pointermove", function (e) {
      var now = Date.now();
      if (now - lastPointerUpdate < 60) return;
      lastPointerUpdate = now;
      sigOutput.textContent = "{ x: " + Math.round(e.clientX) + ", y: " + Math.round(e.clientY) + " }";
    });
  }

  function initLiquidMetal(canvasId, containerSelector, readoutId) {
    var canvas = document.getElementById(canvasId);
    var heroSection = document.querySelector(containerSelector);
    var readout = readoutId ? document.getElementById(readoutId) : null;
    if (!canvas || !heroSection) return;

    var gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: "low-power" }) ||
      canvas.getContext("experimental-webgl", { antialias: false, alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var VERT = "attribute vec2 aPos;\n" +
      "void main() { gl_Position = vec4(aPos, 0.0, 1.0); }";

    var FRAG = "precision mediump float;\n" +
      "uniform vec2 uRes;\n" +
      "uniform float uTime;\n" +
      "uniform vec2 uMouse;\n" +
      "uniform float uHasMouse;\n" +
      "uniform float uTurb;\n" +
      "uniform vec3 uBase1;\n" +
      "uniform vec3 uBase2;\n" +
      "uniform vec3 uHi1;\n" +
      "uniform vec3 uHi2;\n" +
      "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }\n" +
      "float noise(vec2 p) {\n" +
      "  vec2 i = floor(p); vec2 f = fract(p);\n" +
      "  float a = hash(i), b = hash(i + vec2(1.0, 0.0));\n" +
      "  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));\n" +
      "  vec2 u = f * f * (3.0 - 2.0 * f);\n" +
      "  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;\n" +
      "}\n" +
      "float fbm(vec2 p) {\n" +
      "  float v = 0.0; float amp = 0.5;\n" +
      "  for (int i = 0; i < 5; i++) { v += amp * noise(p); p *= 2.02; amp *= 0.5; }\n" +
      "  return v;\n" +
      "}\n" +
      "void main() {\n" +
      "  vec2 uv = gl_FragCoord.xy / uRes.xy;\n" +
      "  vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 3.0;\n" +
      "  float t = uTime * (0.05 + uTurb * 0.1);\n" +
      "  vec2 mouseOff = uv - uMouse;\n" +
      "  float mouseDist = length(mouseOff);\n" +
      "  float mouseDent = uHasMouse * exp(-mouseDist * 6.0) * 0.6;\n" +
      "  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) + t));\n" +
      "  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 1.7));\n" +
      "  r -= mouseOff * mouseDent;\n" +
      "  float flow = fbm(p + r * 3.0);\n" +
      "  float eps = 0.015;\n" +
      "  float fx = fbm(p + r * 3.0 + vec2(eps, 0.0)) - flow;\n" +
      "  float fy = fbm(p + r * 3.0 + vec2(0.0, eps)) - flow;\n" +
      "  vec3 normal = normalize(vec3(-fx, -fy, 0.4));\n" +
      "  float fresnel = pow(1.0 - max(normal.z, 0.0), 2.5);\n" +
      "  float band = smoothstep(0.35, 0.75, flow) - smoothstep(0.75, 0.95, flow) * 0.6 + fresnel * 0.5;\n" +
      "  vec3 col = mix(uBase1, uBase2, clamp(flow * 1.4, 0.0, 1.0));\n" +
      "  vec3 hiMix = mix(uHi1, uHi2, sin(t * 2.0 + flow * 6.0) * 0.5 + 0.5);\n" +
      "  col += hiMix * pow(max(band, 0.0), 2.0) * (0.5 + uTurb * 0.5);\n" +
      "  float vig = smoothstep(1.1, 0.35, length(uv - 0.5) * 1.4);\n" +
      "  float alpha = clamp(pow(max(band, 0.0), 1.6) * (0.85 + uTurb * 0.3), 0.0, 0.82) + flow * 0.05;\n" +
      "  alpha *= mix(0.35, 1.0, vig);\n" +
      "  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.85));\n" +
      "}";

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(program, "uRes");
    var uTime = gl.getUniformLocation(program, "uTime");
    var uMouse = gl.getUniformLocation(program, "uMouse");
    var uHasMouse = gl.getUniformLocation(program, "uHasMouse");
    var uTurb = gl.getUniformLocation(program, "uTurb");
    var uBase1 = gl.getUniformLocation(program, "uBase1");
    var uBase2 = gl.getUniformLocation(program, "uBase2");
    var uHi1 = gl.getUniformLocation(program, "uHi1");
    var uHi2 = gl.getUniformLocation(program, "uHi2");

    function rgbVar(name, fallback) {
      var raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      var parts = raw.split(",").map(function (n) { return parseFloat(n) / 255; });
      return parts.length === 3 && !parts.some(isNaN) ? parts : fallback;
    }

    function applyThemeColors() {
      var base1 = rgbVar("--metal-1-rgb", [0.02, 0.023, 0.03]);
      var base2 = rgbVar("--metal-2-rgb", [0.24, 0.26, 0.29]);
      var hi1 = rgbVar("--neon-1-rgb", [1, 0.16, 0.16]);
      var hi2 = rgbVar("--neon-2-rgb", [1, 0.16, 0.16]);
      gl.uniform3f(uBase1, base1[0], base1[1], base1[2]);
      gl.uniform3f(uBase2, base2[0], base2[1], base2[2]);
      gl.uniform3f(uHi1, hi1[0], hi1[1], hi1[2]);
      gl.uniform3f(uHi2, hi2[0], hi2[1], hi2[2]);
    }
    applyThemeColors();

    var themeObserver = new MutationObserver(applyThemeColors);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var mouse = { x: 0.5, y: 0.5, has: 0 };
    var visible = true;
    var raf = null;
    var startTime = null;
    var lastReadout = -1;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.floor(rect.width * dpr));
      var h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function draw(time) {
      if (startTime === null) startTime = time;
      var t = (time - startTime) / 1000;
      var audio = (window.__stamAudio && window.__stamAudio.level) || 0;
      var idleTurb = 0.12 + Math.sin(t * 0.15) * 0.05;
      var turb = Math.min(1, idleTurb + audio * 0.9);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouse.x, 1.0 - mouse.y);
      gl.uniform1f(uHasMouse, mouse.has);
      gl.uniform1f(uTurb, turb);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (readout) {
        var pct = Math.round(turb * 100);
        if (pct !== lastReadout) {
          lastReadout = pct;
          readout.textContent = "HEAT " + (pct < 10 ? "0" : "") + pct + "%";
        }
      }
    }

    // resize is driven by ResizeObserver, not called per-frame -- a forced
    // layout read (getBoundingClientRect) on every rAF tick is wasted work
    // on a continuously-running background.
    function loop(time) {
      if (!visible) { raf = null; return; }
      draw(time);
      raf = requestAnimationFrame(loop);
    }

    resize();

    var ro = new ResizeObserver(function () {
      resize();
      if (reduceMotion) { startTime = 0; draw(2400); }
    });
    ro.observe(canvas);

    if (reduceMotion) {
      startTime = 0;
      draw(2400);
      canvas.classList.add("is-ready");
      return;
    }

    canvas.classList.add("is-ready");
    loop(performance.now());

    heroSection.addEventListener("pointermove", function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
      mouse.has = 1;
    });
    heroSection.addEventListener("pointerleave", function () {
      mouse.has = 0;
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting && !document.hidden;
        if (visible && !raf) { startTime = null; raf = requestAnimationFrame(loop); }
      }, { threshold: 0 });
      io.observe(canvas);
    }

    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible && !raf) {
        startTime = null;
        raf = requestAnimationFrame(loop);
      }
    });
  }

  initLiquidMetal("hero-metal", ".hero", "hero-metal-readout");
  initLiquidMetal("footer-metal", "footer", null);

  (function () {
    var canvas = document.getElementById("hero-grid");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: -9999, y: -9999 };
    var particles = [];
    var raf = null;
    var visible = true;
    var W = 0, H = 0;
    var linkDist = 140;

    function textRgb() {
      return getComputedStyle(document.documentElement).getPropertyValue("--text-rgb").trim();
    }

    function seed() {
      var area = (W * H) / (dpr * dpr);
      var count = Math.max(28, Math.min(120, Math.round(area / 9000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.2 * dpr,
          vy: (Math.random() - 0.5) * 0.2 * dpr,
          r: (0.9 + Math.random() * 1.3) * dpr
        });
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      H = canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      seed();
    }

    function step() {
      var rgb = textRgb();
      var audioBoost = (window.__stamAudio && window.__stamAudio.level) || 0;
      var mx = mouse.x * dpr, my = mouse.y * dpr;

      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += W; if (p.x > W) p.x -= W;
        if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
      }

      var linkDistPx = linkDist * dpr;
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var pa = particles[a], pb = particles[b];
          var dx = pa.x - pb.x, dy = pa.y - pb.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDistPx) {
            var alpha = (1 - d / linkDistPx) * (0.16 + audioBoost * 0.1);
            ctx.strokeStyle = "rgba(" + rgb + "," + alpha.toFixed(3) + ")";
            ctx.lineWidth = dpr;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      var cursorRadius2 = 26000 * dpr * dpr;
      for (var j = 0; j < particles.length; j++) {
        var p2 = particles[j];
        var cdx = p2.x - mx, cdy = p2.y - my;
        var near = Math.max(0, 1 - (cdx * cdx + cdy * cdy) / cursorRadius2);
        var size = p2.r * (1 + near * 1.4 + audioBoost * 0.9);
        var alpha = Math.min(1, 0.3 + near * 0.5 + audioBoost * 0.15);
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + rgb + "," + alpha.toFixed(3) + ")";
        ctx.arc(p2.x, p2.y, size, 0, Math.PI * 2);
        ctx.fill();

        if (near > 0.03) {
          ctx.strokeStyle = "rgba(" + rgb + "," + (near * 0.3).toFixed(3) + ")";
          ctx.lineWidth = dpr;
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }
    }

    function loop() {
      if (!visible) { raf = null; return; }
      step();
      raf = requestAnimationFrame(loop);
    }

    resize();
    step();

    if (!reduceMotion) {
      loop();
      canvas.addEventListener("pointermove", function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      canvas.addEventListener("pointerleave", function () {
        mouse.x = -9999; mouse.y = -9999;
      });
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(canvas);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible && !raf) loop();
        }, { threshold: 0 });
        io.observe(canvas);
      }
    }
  })();

  (function () {
    var audioCtx = null;
    var masterGain = null;
    var analyser = null;
    var levelData = null;
    var levelLoopStarted = false;
    var activeNodes = [];
    var loopTimer = null;
    var current = "off";

    function startLevelLoop() {
      if (levelLoopStarted || reduceMotion) return;
      levelLoopStarted = true;
      (function tick() {
        if (analyser && levelData) {
          analyser.getByteTimeDomainData(levelData);
          var sum = 0;
          for (var i = 0; i < levelData.length; i++) {
            var v = (levelData[i] - 128) / 128;
            sum += v * v;
          }
          var rms = Math.sqrt(sum / levelData.length);
          window.__stamAudio.level = Math.min(1, rms * 4);
        }
        requestAnimationFrame(tick);
      })();
    }

    function ensureCtx() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.2;
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        levelData = new Uint8Array(analyser.frequencyBinCount);
        masterGain.connect(analyser);
        analyser.connect(audioCtx.destination);
        startLevelLoop();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function stopAll() {
      activeNodes.forEach(function (n) {
        try { n.stop(); } catch (e) {}
        try { n.disconnect(); } catch (e) {}
      });
      activeNodes = [];
      if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
    }

    function playCalm() {
      ensureCtx();
      stopAll();

      var chords = [
        [220.00, 261.63, 329.63],
        [174.61, 220.00, 261.63],
        [261.63, 329.63, 392.00],
        [196.00, 246.94, 293.66]
      ];
      var pattern = [0, 1, 2, 1];
      var chordIndex = 0;
      var stepIndex = 0;

      function pluck(freq, time, vol, dur) {
        var osc = audioCtx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        var osc2 = audioCtx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.value = freq;
        var filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2000;
        var g = audioCtx.createGain();
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(vol, time + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        osc.start(time);
        osc2.start(time);
        osc.stop(time + dur + 0.05);
        osc2.stop(time + dur + 0.05);
        activeNodes.push(osc, osc2);
      }

      function bassPedal(freq, time, dur) {
        var osc = audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq / 2;
        var g = audioCtx.createGain();
        osc.connect(g);
        g.connect(masterGain);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(0.05, time + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        osc.start(time);
        osc.stop(time + dur + 0.05);
        activeNodes.push(osc);
      }

      loopTimer = setInterval(function () {
        var t = audioCtx.currentTime;
        var chord = chords[chordIndex];
        if (stepIndex % pattern.length === 0) {
          bassPedal(chord[0], t, 2.1);
        }
        var note = chord[pattern[stepIndex % pattern.length]];
        pluck(note, t, 0.06, 1.1);
        if (stepIndex % pattern.length === 2) {
          pluck(note * 2, t + 0.02, 0.025, 0.9);
        }
        stepIndex++;
        if (stepIndex % pattern.length === 0) {
          chordIndex = (chordIndex + 1) % chords.length;
        }
      }, 550);
    }

    function playEnergetic() {
      ensureCtx();
      stopAll();
      var bass = audioCtx.createOscillator();
      bass.type = "sawtooth";
      bass.frequency.value = 98;
      var bassGain = audioCtx.createGain();
      bassGain.gain.value = 0.05;
      bass.connect(bassGain);
      bassGain.connect(masterGain);
      bass.start();
      activeNodes.push(bass);

      var notes = [196.0, 246.94, 293.66, 246.94];
      var i = 0;
      loopTimer = setInterval(function () {
        var osc = audioCtx.createOscillator();
        osc.type = "square";
        osc.frequency.value = notes[i % notes.length];
        var g = audioCtx.createGain();
        osc.connect(g);
        g.connect(masterGain);
        var t = audioCtx.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.start(t);
        osc.stop(t + 0.2);
        i++;
      }, 220);
    }

    var soundBtns = document.querySelectorAll(".sound-btn");
    soundBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-sound");
        if (mode === current) return;
        current = mode;
        window.__stamAudio.active = mode !== "off";
        soundBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        if (mode === "off") {
          stopAll();
          window.__stamAudio.level = 0;
        } else if (mode === "calm") {
          playCalm();
        } else if (mode === "energetic") {
          playEnergetic();
        }
      });
    });
  })();

  (function () {
    var bar = document.getElementById("scroll-progress");
    if (!bar) return;
    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  document.querySelectorAll(".project-card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("a, button")) return;
      card.classList.toggle("is-flipped");
    });
    card.addEventListener("keydown", function (e) {
      if (e.target.closest("a, button")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("is-flipped");
      }
    });
  });

  (function () {
    var mediaBlocks = document.querySelectorAll(".project-media");
    if (!mediaBlocks.length) return;

    var lightbox = document.createElement("div");
    lightbox.className = "video-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Full video");
    lightbox.innerHTML =
      '<button type="button" class="video-lightbox-close" aria-label="Close video">&times;</button>' +
      '<video class="video-lightbox-video" controls playsinline></video>';
    document.body.appendChild(lightbox);

    var lightboxVideo = lightbox.querySelector(".video-lightbox-video");
    var closeBtn = lightbox.querySelector(".video-lightbox-close");
    var lastTrigger = null;

    function openLightbox(sourceVideo, trigger) {
      var source = sourceVideo.querySelector("source");
      if (!source) return;
      lastTrigger = trigger;
      lightboxVideo.poster = sourceVideo.getAttribute("poster") || "";
      lightboxVideo.src = source.src;
      sourceVideo.pause();
      lightbox.classList.add("is-open");
      document.body.classList.add("lightbox-open");
      lightboxVideo.currentTime = 0;
      lightboxVideo.play().catch(function () {});
      closeBtn.focus();
    }

    function closeLightbox() {
      if (!lightbox.classList.contains("is-open")) return;
      lightbox.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
      lightboxVideo.pause();
      lightboxVideo.removeAttribute("src");
      lightboxVideo.load();
      if (lastTrigger) lastTrigger.focus();
    }

    mediaBlocks.forEach(function (media) {
      var video = media.querySelector(".project-video");
      if (!video) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "video-expand-btn";
      btn.setAttribute("aria-label", "View full video");
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        "</svg>";
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        openLightbox(video, btn);
      });
      media.appendChild(btn);
    });

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  })();

  function replayBoot(message) {
    if (reduceMotion) return;
    var loader = document.getElementById("loader");
    if (!loader) return;
    loader.style.display = "flex";
    loader.classList.remove("is-hidden");
    runBootLog([message || "hey, you found it."], function () {
      loader.classList.add("is-hidden");
      setTimeout(function () { loader.style.display = "none"; }, 400);
    }, 150);
  }

  (function () {
    var buffer = "";
    window.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key.length === 1) {
        buffer = (buffer + e.key).slice(-10).toLowerCase();
        if (buffer.indexOf("jarvis") !== -1) {
          buffer = "";
          replayBoot("hey, you found it.");
        }
      }
    });
  })();

  (function () {
    var triggers = document.querySelectorAll("[data-open-terms]");
    var scrim = document.getElementById("terms-scrim");
    var closeBtn = document.getElementById("terms-close");
    if (!triggers.length || !scrim || !closeBtn) return;

    var lastFocused = null;
    function open(e) {
      lastFocused = (e && e.currentTarget) || null;
      scrim.hidden = false;
      closeBtn.focus();
    }
    function close() {
      scrim.hidden = true;
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach(function (t) { t.addEventListener("click", open); });
    closeBtn.addEventListener("click", close);
    scrim.addEventListener("click", function (e) { if (e.target === scrim) close(); });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !scrim.hidden) close();
    });
  })();

  (function () {
    var triggers = document.querySelectorAll("[data-open-privacy]");
    var scrim = document.getElementById("privacy-scrim");
    var closeBtn = document.getElementById("privacy-close");
    if (!triggers.length || !scrim || !closeBtn) return;

    var lastFocused = null;
    function open(e) {
      lastFocused = (e && e.currentTarget) || null;
      scrim.hidden = false;
      closeBtn.focus();
    }
    function close() {
      scrim.hidden = true;
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach(function (t) { t.addEventListener("click", open); });
    closeBtn.addEventListener("click", close);
    scrim.addEventListener("click", function (e) { if (e.target === scrim) close(); });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !scrim.hidden) close();
    });
  })();

  (function () {
    var triggers = document.querySelectorAll("[data-open-contact-form]");
    var scrim = document.getElementById("contact-form-scrim");
    var closeBtn = document.getElementById("contact-form-close");
    var form = document.getElementById("contact-form");
    var status = document.getElementById("contact-form-status");
    var submitBtn = document.getElementById("contact-form-submit");
    var nameField = document.getElementById("contact-form-name");
    if (!triggers.length || !scrim || !closeBtn || !form) return;

    var WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY";
    var lastFocused = null;

    function setStatus(text, state) {
      status.textContent = text;
      if (state) status.setAttribute("data-state", state);
      else status.removeAttribute("data-state");
    }
    function open(e) {
      lastFocused = (e && e.currentTarget) || null;
      scrim.hidden = false;
      setStatus("", null);
      if (nameField) nameField.focus();
    }
    function close() {
      scrim.hidden = true;
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach(function (t) { t.addEventListener("click", open); });
    closeBtn.addEventListener("click", close);
    scrim.addEventListener("click", function (e) { if (e.target === scrim) close(); });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !scrim.hidden) close();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var botcheck = form.querySelector('[name="botcheck"]');
      if (botcheck && botcheck.value) return; // silently drop bot submissions

      if (WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
        setStatus("Form isn't wired up yet — email me directly for now.", "error");
        return;
      }

      var payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: "New message from stam-console",
        name: form.querySelector('[name="name"]').value,
        email: form.querySelector('[name="email"]').value,
        message: form.querySelector('[name="message"]').value
      };

      submitBtn.disabled = true;
      setStatus("Sending...", null);

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          submitBtn.disabled = false;
          if (data.success) {
            setStatus("Message sent. I'll get back to you soon.", "ok");
            form.reset();
          } else {
            setStatus("Something went wrong. Try emailing me directly.", "error");
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          setStatus("Network error. Try emailing me directly.", "error");
        });
    });
  })();

  (function () {
    var scrim = document.getElementById("cmdk-scrim");
    var input = document.getElementById("cmdk-input");
    var list = document.getElementById("cmdk-list");
    var hintBtn = document.getElementById("kbd-hint");
    if (!scrim || !input || !list) return;

    function scrollToId(id) {
      var el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
    }
    function clickSoundBtn(mode) {
      var btn = document.querySelector('.sound-btn[data-sound="' + mode + '"]');
      if (btn) btn.click();
    }

    var commands = [
      { label: "Go to About", hint: "Section", action: function () { scrollToId("about"); } },
      { label: "Go to What I do", hint: "Section", action: function () { scrollToId("offer"); } },
      { label: "Go to Process", hint: "Section", action: function () { scrollToId("how"); } },
      { label: "Go to Work", hint: "Section", action: function () { scrollToId("work"); } },
      { label: "Go to Skills", hint: "Section", action: function () { scrollToId("skills"); } },
      { label: "Go to FAQ", hint: "Section", action: function () { scrollToId("faq"); } },
      { label: "Go to Contact", hint: "Section", action: function () { scrollToId("contact"); } },
      { label: "Send a message", hint: "Modal", action: function () { var t = document.querySelector("[data-open-contact-form]"); if (t) t.click(); } },
      { label: "Read my terms", hint: "Modal", action: function () { var t = document.querySelector("[data-open-terms]"); if (t) t.click(); } },
      { label: "Read privacy notice", hint: "Modal", action: function () { var t = document.querySelector("[data-open-privacy]"); if (t) t.click(); } },
      { label: "Open GitHub", hint: "github.com/Stamyyyy", action: function () { window.open("https://github.com/Stamyyyy", "_blank", "noopener"); } },
      { label: "Copy Discord username", hint: "stamyyyy", action: function () { copyText("stamyyyy"); } },
      { label: "Play calm sound", hint: "Audio", action: function () { clickSoundBtn("calm"); } },
      { label: "Play energetic sound", hint: "Audio", action: function () { clickSoundBtn("energetic"); } },
      { label: "Turn sound off", hint: "Audio", action: function () { clickSoundBtn("off"); } },
      { label: "Visit Frontline: Shattered Steel", hint: "External", action: function () { window.open("https://frontline-shattered-steel.web.app/", "_blank", "noopener"); } }
    ];

    var visibleItems = [];
    var activeIndex = 0;

    function renderList(query) {
      list.innerHTML = "";
      var q = (query || "").toLowerCase();
      visibleItems = commands.filter(function (c) { return c.label.toLowerCase().indexOf(q) !== -1; });
      if (!visibleItems.length) {
        var empty = document.createElement("li");
        empty.className = "cmdk-empty";
        empty.textContent = "No matches.";
        list.appendChild(empty);
        return;
      }
      visibleItems.forEach(function (cmd, idx) {
        var li = document.createElement("li");
        li.className = "cmdk-item" + (idx === activeIndex ? " is-active" : "");
        li.setAttribute("role", "option");
        var label = document.createElement("span");
        label.textContent = cmd.label;
        var hint = document.createElement("span");
        hint.className = "cmdk-item-hint";
        hint.textContent = cmd.hint;
        li.appendChild(label);
        li.appendChild(hint);
        li.addEventListener("click", function () { cmd.action(); closePalette(); });
        list.appendChild(li);
      });
    }

    function openPalette() {
      scrim.hidden = false;
      input.value = "";
      activeIndex = 0;
      renderList("");
      setTimeout(function () { input.focus(); }, 10);
    }
    function closePalette() {
      scrim.hidden = true;
    }

    if (hintBtn) hintBtn.addEventListener("click", openPalette);

    window.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable);
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        if (scrim.hidden) openPalette();
      } else if (e.key === "Escape" && !scrim.hidden) {
        closePalette();
      }
    });

    scrim.addEventListener("click", function (e) {
      if (e.target === scrim) closePalette();
    });

    input.addEventListener("input", function () {
      activeIndex = 0;
      renderList(input.value);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, visibleItems.length - 1);
        renderList(input.value);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        renderList(input.value);
      } else if (e.key === "Enter") {
        e.preventDefault();
        var cmd = visibleItems[activeIndex];
        if (cmd) { cmd.action(); closePalette(); }
      }
    });
  })();

  if (typeof window.createCodeTyper === "function") {
    window.createCodeTyper("about-code-typer", [
      [
        "float fbm(vec2 p) {",
        "  float v = 0.0; float amp = 0.5;",
        "  for (int i = 0; i < 5; i++) {",
        "    v += amp * noise(p);",
        "    p *= 2.02; amp *= 0.5;",
        "  }",
        "  return v;",
        "}"
      ],
      [
        "var d = Math.sqrt(dx * dx + dy * dy);",
        "if (d < linkDistPx) {",
        "  var alpha = (1 - d / linkDistPx) * 0.16;",
        "  ctx.strokeStyle = \"rgba(\" + rgb + \",\" + alpha + \")\";",
        "  ctx.stroke();",
        "}"
      ],
      [
        "function typeLine() {",
        "  if (li >= lines.length) {",
        "    logo.classList.add(\"is-glitching\");",
        "    return setTimeout(onDone, 380);",
        "  }",
        "  el.textContent = text.slice(0, ci);",
        "}"
      ],
      [
        "gl.enable(gl.BLEND);",
        "gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);",
        "gl.uniform1f(uTurb, turb);",
        "gl.clear(gl.COLOR_BUFFER_BIT);",
        "gl.drawArrays(gl.TRIANGLES, 0, 3);"
      ]
    ], { charDelay: 26, lineDelay: 110, holdDelay: 3200 });
  }
})();
