/* ============================================================
   Jerusalem Temple (TAG) — interactions
   ============================================================ */
(function(){
  "use strict";

  /* ---------- Loader ---------- */
  window.addEventListener("load", function(){
    var l = document.querySelector(".loader");
    if(l){ setTimeout(function(){ l.classList.add("hide"); }, 550); }
  });

  /* ---------- Theme toggle (persisted in localStorage) ---------- */
  var root = document.documentElement;
  var THEME_KEY = "theme";
  var savedTheme = null;
  try{
    savedTheme = localStorage.getItem(THEME_KEY);
  }catch(e){ /* localStorage unavailable (e.g. private mode) */ }
  root.setAttribute("data-theme", savedTheme === "dark" ? "dark" : "light");

  document.querySelectorAll(".theme-toggle").forEach(function(btn){
    btn.addEventListener("click", function(){
      var cur = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", cur);
      try{
        localStorage.setItem(THEME_KEY, cur);
      }catch(e){ /* ignore write errors */ }
    });
  });

  /* ---------- Mobile nav ---------- */
  var burger = document.querySelector(".burger");
  var links = document.querySelector(".nav-links");
  if(burger && links){
    burger.addEventListener("click", function(){
      burger.classList.toggle("open");
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ burger.classList.remove("open"); links.classList.remove("open"); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-scale");
  if("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold:0.15, rootMargin:"0px 0px -60px 0px" });
    revealEls.forEach(function(el, i){
      el.style.setProperty("--i", el.closest(".stagger") ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0);
      io.observe(el);
    });
  } else {
    revealEls.forEach(function(el){ el.classList.add("in"); });
  }

  /* ---------- Back to top ---------- */
  var top = document.querySelector(".to-top");
  if(top){
    window.addEventListener("scroll", function(){
      top.classList.toggle("show", window.scrollY > 500);
    });
    top.addEventListener("click", function(){ window.scrollTo({top:0, behavior:"smooth"}); });
  }

  /* ---------- Active nav link ---------- */
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function(a){
    var href = a.getAttribute("href");
    if(href === path || (path === "" && href === "index.html")){ a.classList.add("active"); }
  });

  /* ============================================================
     HERO CAROUSEL
     ============================================================ */
  var heroSlidesData = window.HERO_SLIDES || [];
  var heroEl = document.querySelector(".hero");
  if(heroEl && heroSlidesData.length){
    var slidesWrap = heroEl.querySelector(".hero-slides");
    var dotsWrap = heroEl.querySelector(".hero-dots");
    var captionH = heroEl.querySelector(".hero-caption h4");
    var captionP = heroEl.querySelector(".hero-caption p");
    var idx = 0, timer;

    heroSlidesData.forEach(function(s, i){
      var d = document.createElement("div");
      d.className = "hero-slide" + (i===0 ? " active" : "");
      d.style.backgroundImage = "url('" + s.img + "')";
      slidesWrap.appendChild(d);

      var dot = document.createElement("button");
      if(i===0) dot.classList.add("active");
      dot.setAttribute("aria-label", "Slide " + (i+1));
      dot.addEventListener("click", function(){ goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });

    var slideEls = slidesWrap.querySelectorAll(".hero-slide");
    var dotEls = dotsWrap.querySelectorAll("button");

    function render(){
      slideEls.forEach(function(el,i){ el.classList.toggle("active", i===idx); });
      dotEls.forEach(function(el,i){ el.classList.toggle("active", i===idx); });
      captionH.textContent = heroSlidesData[idx].title;
      captionP.textContent = heroSlidesData[idx].desc;
    }
    function goTo(i){ idx = (i + heroSlidesData.length) % heroSlidesData.length; render(); }
    function next(){ goTo(idx+1); }
    function prev(){ goTo(idx-1); }
    function resetTimer(){ clearInterval(timer); timer = setInterval(next, 5500); }

    render();
    resetTimer();

    var nextBtn = heroEl.querySelector(".hero-nav.next");
    var prevBtn = heroEl.querySelector(".hero-nav.prev");
    if(nextBtn) nextBtn.addEventListener("click", function(){ next(); resetTimer(); });
    if(prevBtn) prevBtn.addEventListener("click", function(){ prev(); resetTimer(); });

    /* swipe */
    var touchX = null;
    heroEl.addEventListener("touchstart", function(e){ touchX = e.touches[0].clientX; }, {passive:true});
    heroEl.addEventListener("touchend", function(e){
      if(touchX===null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if(Math.abs(dx) > 40){ dx < 0 ? next() : prev(); resetTimer(); }
      touchX = null;
    }, {passive:true});

    /* subtle parallax on cursor for hero */
    heroEl.addEventListener("mousemove", function(e){
      var r = heroEl.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      slideEls.forEach(function(el){
        el.style.transform = "scale(1.06) translate(" + (px*-14) + "px," + (py*-10) + "px)";
      });
    });
    heroEl.addEventListener("mouseleave", function(){
      slideEls.forEach(function(el){ el.style.transform = ""; });
    });
  }

  /* ============================================================
     3D TILT — interactive showcase image (uploaded photo)
     Responds to cursor move AND touch move / device tilt
     ============================================================ */
  document.querySelectorAll(".tilt-card").forEach(function(card){
    var img = card.querySelector(".tilt-image");
    var maxTilt = 14;
    var bounds;

    function update(px, py){
      // px, py in range -0.5..0.5
      var rx = (py * -maxTilt).toFixed(2);
      var ry = (px * maxTilt).toFixed(2);
      card.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg) scale3d(1.02,1.02,1.02)";
      card.style.setProperty("--gx", (50 + px*100) + "%");
      card.style.setProperty("--gy", (50 + py*100) + "%");
      if(img){ img.style.transform = "translateZ(24px) translate(" + (px*-10) + "px," + (py*-10) + "px)"; }
    }
    function reset(){
      card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      if(img){ img.style.transform = "translateZ(0)"; }
    }

    card.addEventListener("mousemove", function(e){
      bounds = card.getBoundingClientRect();
      var px = (e.clientX - bounds.left) / bounds.width - 0.5;
      var py = (e.clientY - bounds.top) / bounds.height - 0.5;
      update(px, py);
    });
    card.addEventListener("mouseleave", reset);

    card.addEventListener("touchmove", function(e){
      bounds = card.getBoundingClientRect();
      var t = e.touches[0];
      var px = (t.clientX - bounds.left) / bounds.width - 0.5;
      var py = (t.clientY - bounds.top) / bounds.height - 0.5;
      px = Math.max(-0.5, Math.min(0.5, px));
      py = Math.max(-0.5, Math.min(0.5, py));
      update(px, py);
      // no preventDefault: keep page scroll working on mobile while still tilting
    }, {passive:true});
    card.addEventListener("touchend", reset);

    // gentle device-orientation tilt for mobile (fallback ambient motion)
    var hasOrientation = false;
    window.addEventListener("deviceorientation", function(e){
      if(!isInViewport(card)) return;
      hasOrientation = true;
      var px = Math.max(-0.5, Math.min(0.5, (e.gamma||0)/60));
      var py = Math.max(-0.5, Math.min(0.5, (e.beta||0-45)/90));
      update(px, py);
    });

    function isInViewport(el){
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    }
  });

  /* ---------- generic card tilt (ministry / value cards) ---------- */
  document.querySelectorAll(".card, .photo-card").forEach(function(card){
    var max = 6;
    card.addEventListener("mousemove", function(e){
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left)/r.width - 0.5;
      var py = (e.clientY - r.top)/r.height - 0.5;
      card.style.transform = "perspective(900px) rotateX(" + (py*-max) + "deg) rotateY(" + (px*max) + "deg) translateY(-4px)";
    });
    card.addEventListener("mouseleave", function(){ card.style.transform = ""; });
  });

  /* ---------- Lightbox for gallery ---------- */
  var lightbox = document.querySelector(".lightbox");
  if(lightbox){
    var lbImg = lightbox.querySelector("img");
    var lbCap = lightbox.querySelector(".lb-cap");
    document.querySelectorAll("[data-lightbox]").forEach(function(el){
      el.addEventListener("click", function(e){
        e.preventDefault();
        lbImg.src = el.getAttribute("data-lightbox");
        lbCap.textContent = el.getAttribute("data-caption") || "";
        lightbox.classList.add("open");
      });
    });
    lightbox.addEventListener("click", function(){ lightbox.classList.remove("open"); });
  }

  /* ---------- Contact form (static demo submit) ---------- */
  var prayerForm = document.querySelector("#prayerForm");
  if(prayerForm){
    prayerForm.addEventListener("submit", function(e){
      var native = prayerForm.getAttribute("data-native-submit");
      if(native === "true") return; // let it post to Google Forms
      e.preventDefault();
      var msg = prayerForm.querySelector(".form-msg");
      if(msg){ msg.textContent = "Asante! Ujumbe wako umepokelewa. Tutawasiliana nawe hivi karibuni."; msg.classList.add("show"); }
      prayerForm.reset();
    });
  }
})();
