/**
 * Hero 线稿视差：加载 hero.svg。
 * - http(s)：优先 fetch 内联 SVG；失败则回退为 <img>。
 * - file://：使用 <img>。
 *
 * 交互：以「整屏视口」为参考归一化指针（不再以 Hero 区块中心为唯一原点），
 * 配合基于时间的平滑与略偏右的透视锚点，接近常见产品站背景层级的观感。
 */
(function () {
  const container = document.getElementById("heroLineart");
  if (!container) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svgUrl = new URL("hero.svg", document.baseURI || window.location.href).href;

  /** 线稿平移：-1 = 与指针反向（远景深度感，更立体）；1 = 与指针同向 */
  const PARALLAX_TRANSLATE_SIGN = -1;

  /** 视口归一化水平偏置：略向右移「中性」点，与右侧线稿视觉对齐（约 -0.05~0.05） */
  const VIEWPORT_BIAS_X = -0.05;

  /** 指数平滑 λ，越大跟手越快 */
  const SMOOTH_POS = 11;
  const SMOOTH_ROT = 9;

  /** 线稿平移最大幅度（px） */
  const MOVE_MAX = 52;
  /** 舞台透视旋转幅度（deg） */
  const ROT_Y_MAX = 4;
  const ROT_X_MAX = 3;

  /** 未分层时给根 svg 或回退用的 img 加单层视差 */
  function ensureParallaxTargets(root) {
    const layers = root.querySelectorAll(".parallax-layer, [data-depth]");
    if (layers.length > 0) return;
    const svg = root.querySelector("svg");
    if (svg) {
      svg.classList.add("parallax-layer");
      svg.setAttribute("data-depth", "1");
      return;
    }
    const img = root.querySelector("img.hero-lineart__graphic");
    if (img) {
      img.classList.add("parallax-layer");
      img.setAttribute("data-depth", "1");
    }
  }

  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let curRotX = 0;
  let curRotY = 0;

  let lastTs = performance.now();

  const lerp = (a, b, t) => a + (b - a) * t;

  /** 以整个视口为基准将指针映射到约 [-1,1]，带轻微水平偏置 */
  function pointerToNormalized(clientX, clientY) {
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    const nx = clamp((clientX / w - 0.5 + VIEWPORT_BIAS_X) * 2, -1, 1);
    const ny = clamp((clientY / h - 0.5) * 2, -1, 1);
    return [nx, ny];
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function applyParallax() {
    container.querySelectorAll(".parallax-layer, [data-depth]").forEach((el) => {
      const d = parseFloat(el.getAttribute("data-depth") || "0.5");
      const tx = PARALLAX_TRANSLATE_SIGN * curX * MOVE_MAX * d;
      const ty = PARALLAX_TRANSLATE_SIGN * curY * MOVE_MAX * d;
      el.style.transform = `translate(${tx}px, ${ty}px)`;
    });
    const stage = container.querySelector(".hero-lineart__stage");
    if (stage) {
      stage.style.transform = `perspective(960px) rotateX(${curRotX}deg) rotateY(${curRotY}deg)`;
    }
  }

  function tick(now) {
    now = now ?? performance.now();
    const dt = Math.min((now - lastTs) / 1000, 0.05);
    lastTs = now;

    if (reducedMotion) {
      curX = targetX;
      curY = targetY;
      curRotX = targetRotX;
      curRotY = targetRotY;
    } else {
      const tp = 1 - Math.exp(-SMOOTH_POS * dt);
      const tr = 1 - Math.exp(-SMOOTH_ROT * dt);
      curX = lerp(curX, targetX, tp);
      curY = lerp(curY, targetY, tp);
      curRotX = lerp(curRotX, targetRotX, tr);
      curRotY = lerp(curRotY, targetRotY, tr);
    }
    applyParallax();
    if (!reducedMotion) {
      requestAnimationFrame(tick);
    }
  }

  function onPointerMove(e) {
    const [nx, ny] = pointerToNormalized(e.clientX, e.clientY);
    targetX = nx;
    targetY = ny;
    /* 旋转朝向指针，与平移反向组合更易出层次 */
    targetRotY = nx * ROT_Y_MAX;
    targetRotX = -ny * ROT_X_MAX;

    // reduced-motion：不使用 requestAnimationFrame 循环，但仍要保持跟手
    if (reducedMotion) {
      curX = targetX;
      curY = targetY;
      curRotX = targetRotX;
      curRotY = targetRotY;
      applyParallax();
    }
  }

  function resetTargets() {
    targetX = 0;
    targetY = 0;
    targetRotX = 0;
    targetRotY = 0;

    if (reducedMotion) {
      curX = targetX;
      curY = targetY;
      curRotX = targetRotX;
      curRotY = targetRotY;
      applyParallax();
    }
  }

  function bindParallax() {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    /* 指针离开文档（例如移出窗口）时缓慢回中 */
    document.documentElement.addEventListener("mouseleave", resetTargets);
    window.addEventListener("blur", resetTargets);
  }

  function startParallax() {
    bindParallax();

    if (reducedMotion) {
      // reduced-motion 下：只做一次渲染，由 onPointerMove / resetTargets 负责更新
      applyParallax();
      return;
    }

    lastTs = performance.now();
    requestAnimationFrame(tick);
  }

  /** 包裹层：用于整体放大矢量图 */
  function createZoomWrap() {
    const zoom = document.createElement("div");
    zoom.className = "hero-lineart__zoom";
    return zoom;
  }

  function loadViaImg() {
    const wrap = document.createElement("div");
    wrap.className = "hero-lineart__stage";
    const zoom = createZoomWrap();
    const img = document.createElement("img");
    img.className = "hero-lineart__graphic";
    img.src = svgUrl;
    img.alt = "";
    img.decoding = "async";
    img.addEventListener("error", () => {
      console.error("[hero-lineart] <img> 无法加载 hero.svg:", svgUrl);
      wrap.remove();
      container.classList.add("hero-lineart--error");
    });
    zoom.appendChild(img);
    wrap.appendChild(zoom);
    container.appendChild(wrap);
    ensureParallaxTargets(zoom);
    startParallax();
  }

  function loadViaInlineSvg(html) {
    const wrap = document.createElement("div");
    wrap.className = "hero-lineart__stage";
    const zoom = createZoomWrap();
    zoom.innerHTML = html;
    wrap.appendChild(zoom);
    container.appendChild(wrap);
    ensureParallaxTargets(zoom);
    startParallax();
  }

  // 重要：为了在 GitHub Pages 上避免“fetch + innerHTML”把超大 hero.svg 内联进 DOM
  // 导致主线程卡顿/首屏重排，默认两端都走 <img> 回退路径。
  // 如果你未来希望分层（多 parallax-layer）粒度更细，再打开 loadViaInlineSvg。
  loadViaImg();
})();
