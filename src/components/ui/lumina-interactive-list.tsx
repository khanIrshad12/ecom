"use client";

import React, { useEffect, useRef } from "react";
import type * as THREE from "three";

export type LuminaSlide = {
  title: string;
  description: string;
  media: string;
};

const DEFAULT_ECOM_SLIDES: LuminaSlide[] = [
  { title: "Women", description: "Curated styles for her. Discover the latest trends.", media: "/images/Women/sales.jpg" },
  { title: "Men", description: "Sharp looks for him. Quality that lasts.", media: "/images/Men/men.jpg" },
  { title: "Kids", description: "Comfortable & fun. Perfect for every adventure.", media: "/images/kids/kids.jpg" },
  { title: "New Arrivals", description: "Fresh drops every week. Be the first to shop.", media: "/images/Women/women cover.jpg" },
  { title: "Trending", description: "What's hot right now. Don't miss out.", media: "/images/Men/men cover.jpg" },
  { title: "Sale", description: "Limited-time offers. Save on your favorites.", media: "/images/Women/women cover.jpg" },
];

export function LuminaInteractiveList({ slides = DEFAULT_ECOM_SLIDES }: { slides?: LuminaSlide[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const run = async () => {
      const gsap = (await import("gsap")).default;
      const THREE = await import("three");

      const SLIDER_CONFIG: Record<string, unknown> = {
        settings: {
          transitionDuration: 2.5,
          autoSlideSpeed: 5000,
          currentEffect: "glass",
          currentEffectPreset: "Default",
          globalIntensity: 1.0,
          speedMultiplier: 1.0,
          distortionStrength: 1.0,
          colorEnhancement: 1.0,
          glassRefractionStrength: 1.0,
          glassChromaticAberration: 1.0,
          glassBubbleClarity: 1.0,
          glassEdgeGlow: 1.0,
          glassLiquidFlow: 1.0,
          frostIntensity: 1.5,
          frostCrystalSize: 1.0,
          frostIceCoverage: 1.0,
          frostTemperature: 1.0,
          frostTexture: 1.0,
          rippleFrequency: 25.0,
          rippleAmplitude: 0.08,
          rippleWaveSpeed: 1.0,
          rippleRippleCount: 1.0,
          rippleDecay: 1.0,
          plasmaIntensity: 1.2,
          plasmaSpeed: 0.8,
          plasmaEnergyIntensity: 0.4,
          plasmaContrastBoost: 0.3,
          plasmaTurbulence: 1.0,
          timeshiftDistortion: 1.6,
          timeshiftBlur: 1.5,
          timeshiftFlow: 1.4,
          timeshiftChromatic: 1.5,
          timeshiftTurbulence: 1.4,
        },
      };

      let currentSlideIndex = 0;
      let isTransitioning = false;
      let shaderMaterial: THREE.ShaderMaterial | null = null;
      let renderer: THREE.WebGLRenderer | null = null;
      let scene: THREE.Scene | null = null;
      let camera: THREE.OrthographicCamera | null = null;
      const slideTextures: THREE.Texture[] = [];
      let texturesLoaded = false;
      let progressAnimation: ReturnType<typeof setInterval> | null = null;
      let autoSlideTimer: ReturnType<typeof setTimeout> | null = null;
      let sliderEnabled = false;

      const settings = SLIDER_CONFIG.settings as Record<string, number | string>;
      const SLIDE_DURATION = () => (settings.autoSlideSpeed as number) || 5000;
      const PROGRESS_UPDATE_INTERVAL = 50;
      const TRANSITION_DURATION = () => (settings.transitionDuration as number) || 2.5;

      const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
      const fragmentShader = `
        uniform sampler2D uTexture1, uTexture2;
        uniform float uProgress;
        uniform vec2 uResolution, uTexture1Size, uTexture2Size;
        uniform int uEffectType;
        uniform int uFitMode;
        uniform float uGlobalIntensity, uSpeedMultiplier, uDistortionStrength, uColorEnhancement;
        uniform float uGlassRefractionStrength, uGlassChromaticAberration, uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
        uniform float uFrostIntensity, uFrostCrystalSize, uFrostIceCoverage, uFrostTemperature, uFrostTexture;
        uniform float uRippleFrequency, uRippleAmplitude, uRippleWaveSpeed, uRippleRippleCount, uRippleDecay;
        uniform float uPlasmaIntensity, uPlasmaSpeed, uPlasmaEnergyIntensity, uPlasmaContrastBoost, uPlasmaTurbulence;
        uniform float uTimeshiftDistortion, uTimeshiftBlur, uTimeshiftFlow, uTimeshiftChromatic, uTimeshiftTurbulence;
        varying vec2 vUv;

        vec2 getCoverUV(vec2 uv, vec2 textureSize) {
          vec2 s = uResolution / textureSize;
          float scale = max(s.x, s.y);
          vec2 scaledSize = textureSize * scale;
          vec2 offset = (uResolution - scaledSize) * 0.5;
          return (uv * uResolution - offset) / scaledSize;
        }
        vec2 getContainUV(vec2 uv, vec2 textureSize) {
          vec2 s = uResolution / textureSize;
          float scale = min(s.x, s.y);
          vec2 scaledSize = textureSize * scale;
          vec2 offset = (uResolution - scaledSize) * 0.5;
          return (uv * uResolution - offset) / scaledSize;
        }
        vec2 getUV(vec2 uv, vec2 textureSize) {
          if (uFitMode == 1) return getContainUV(uv, textureSize);
          return getCoverUV(uv, textureSize);
        }

        vec4 glassEffect(vec2 uv, float progress) {
          float time = progress * 5.0 * uSpeedMultiplier;
          vec2 uv1 = getUV(uv, uTexture1Size);
          vec2 uv2 = getUV(uv, uTexture2Size);
          float maxR = length(uResolution) * 0.85;
          float br = progress * maxR;
          vec2 p = uv * uResolution;
          vec2 c = uResolution * 0.5;
          float d = length(p - c);
          float nd = d / max(br, 0.001);
          float param = smoothstep(br + 3.0, br - 3.0, d);
          vec4 img;
          if (param > 0.0) {
            float ro = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.0, nd), 1.5);
            vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
            vec2 distUV = uv2 - dir * ro;
            distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uGlassLiquidFlow * uSpeedMultiplier * nd * param;
            float ca = 0.02 * uGlassChromaticAberration * uGlobalIntensity * pow(smoothstep(0.3, 1.0, nd), 1.2);
            img = vec4(texture2D(uTexture2, distUV + dir * ca * 1.2).r, texture2D(uTexture2, distUV + dir * ca * 0.2).g, texture2D(uTexture2, distUV - dir * ca * 0.8).b, 1.0);
            if (uGlassEdgeGlow > 0.0) {
              float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
              img.rgb += rim * 0.08 * uGlassEdgeGlow * uGlobalIntensity;
            }
          } else {
            img = texture2D(uTexture2, uv2);
          }
          vec4 oldImg = texture2D(uTexture1, uv1);
          if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
          return mix(oldImg, img, param);
        }

        vec4 frostEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getUV(uv, uTexture1Size)), texture2D(uTexture2, getUV(uv, uTexture2Size)), progress); }
        vec4 rippleEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getUV(uv, uTexture1Size)), texture2D(uTexture2, getUV(uv, uTexture2Size)), progress); }
        vec4 plasmaEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getUV(uv, uTexture1Size)), texture2D(uTexture2, getUV(uv, uTexture2Size)), progress); }
        vec4 timeshiftEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getUV(uv, uTexture1Size)), texture2D(uTexture2, getUV(uv, uTexture2Size)), progress); }

        void main() {
          if (uEffectType == 0) gl_FragColor = glassEffect(vUv, uProgress);
          else if (uEffectType == 1) gl_FragColor = frostEffect(vUv, uProgress);
          else if (uEffectType == 2) gl_FragColor = rippleEffect(vUv, uProgress);
          else if (uEffectType == 3) gl_FragColor = plasmaEffect(vUv, uProgress);
          else gl_FragColor = timeshiftEffect(vUv, uProgress);
        }
      `;

      const getEffectIndex = (n: string) => ({ glass: 0, frost: 1, ripple: 2, plasma: 3, timeshift: 4 })[n] ?? 0;

      const updateShaderUniforms = () => {
        if (!shaderMaterial) return;
        const u = shaderMaterial.uniforms as Record<string, { value: unknown }>;
        for (const key in settings) {
          const uName = "u" + key.charAt(0).toUpperCase() + key.slice(1);
          if (u[uName]) (u[uName] as { value: number }).value = settings[key] as number;
        }
        (u.uEffectType as { value: number }).value = getEffectIndex((settings.currentEffect as string) || "glass");
      };

      const splitText = (text: string) =>
        text
          .split("")
          .map((char) => `<span style="display: inline-block; opacity: 0;">${char === " " ? "&nbsp;" : char}</span>`)
          .join("");

      const updateContent = (idx: number) => {
        const titleEl = containerRef.current?.querySelector("#luminaMainTitle");
        const descEl = containerRef.current?.querySelector("#luminaMainDesc");
        if (!titleEl || !descEl) return;
        gsap.to(titleEl.children, { y: -20, opacity: 0, duration: 0.5, stagger: 0.02, ease: "power2.in" });
        gsap.to(descEl, { y: -10, opacity: 0, duration: 0.4, ease: "power2.in" });

        setTimeout(() => {
          titleEl.innerHTML = splitText(slides[idx].title);
          descEl.textContent = slides[idx].description;
          gsap.set(titleEl.children, { opacity: 0 });
          gsap.set(descEl, { y: 20, opacity: 0 });

          const children = titleEl.children;
          switch (idx % 6) {
            case 0:
              gsap.set(children, { y: 20 });
              gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "power3.out" });
              gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
              break;
            case 1:
              gsap.set(children, { y: -20 });
              gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "back.out(1.7)" });
              gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
              break;
            case 2:
              gsap.set(children, { filter: "blur(10px)", scale: 1.5, y: 0 });
              gsap.to(children, { filter: "blur(0px)", scale: 1, opacity: 1, duration: 1, stagger: { amount: 0.5, from: "random" }, ease: "power2.out" });
              gsap.to(descEl, { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power2.out" });
              break;
            case 3:
              gsap.set(children, { scale: 0, y: 0 });
              gsap.to(children, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.05, ease: "back.out(1.5)" });
              gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
              break;
            case 4:
              gsap.set(children, { rotationX: 90, y: 0, transformOrigin: "50% 50%" });
              gsap.to(children, { rotationX: 0, opacity: 1, duration: 0.8, stagger: 0.04, ease: "power2.out" });
              gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power2.out" });
              break;
            default:
              gsap.set(children, { x: 30, y: 0 });
              gsap.to(children, { x: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "power3.out" });
              gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
          }
        }, 500);
      };

      const updateCounter = (idx: number) => {
        const sn = containerRef.current?.querySelector("#luminaSlideNumber");
        const st = containerRef.current?.querySelector("#luminaSlideTotal");
        if (sn) sn.textContent = String(idx + 1).padStart(2, "0");
        if (st) st.textContent = String(slides.length).padStart(2, "0");
      };

      const updateNavigationState = (idx: number) => {
        containerRef.current?.querySelectorAll(".lumina-slide-nav-item").forEach((el, i) => el.classList.toggle("active", i === idx));
      };

      const updateSlideProgress = (idx: number, prog: number) => {
        const el = containerRef.current?.querySelectorAll(".lumina-slide-nav-item")[idx]?.querySelector(".lumina-slide-progress-fill") as HTMLElement | null;
        if (el) {
          el.style.width = `${prog}%`;
          el.style.opacity = "1";
        }
      };

      const fadeSlideProgress = (idx: number) => {
        const el = containerRef.current?.querySelectorAll(".lumina-slide-nav-item")[idx]?.querySelector(".lumina-slide-progress-fill") as HTMLElement | null;
        if (el) {
          el.style.opacity = "0";
          setTimeout(() => (el.style.width = "0%"), 300);
        }
      };

      const quickResetProgress = (idx: number) => {
        const el = containerRef.current?.querySelectorAll(".lumina-slide-nav-item")[idx]?.querySelector(".lumina-slide-progress-fill") as HTMLElement | null;
        if (el) {
          el.style.transition = "width 0.2s ease-out";
          el.style.width = "0%";
          setTimeout(() => (el.style.transition = "width 0.1s ease, opacity 0.3s ease"), 200);
        }
      };

      const stopAutoSlideTimer = () => {
        if (progressAnimation) clearInterval(progressAnimation);
        if (autoSlideTimer) clearTimeout(autoSlideTimer);
        progressAnimation = null;
        autoSlideTimer = null;
      };

      const startAutoSlideTimer = () => {
        if (!texturesLoaded || !sliderEnabled) return;
        stopAutoSlideTimer();
        let progress = 0;
        const increment = (100 / SLIDE_DURATION()) * PROGRESS_UPDATE_INTERVAL;
        progressAnimation = setInterval(() => {
          if (!sliderEnabled) {
            stopAutoSlideTimer();
            return;
          }
          progress += increment;
          updateSlideProgress(currentSlideIndex, progress);
          if (progress >= 100) {
            if (progressAnimation) clearInterval(progressAnimation);
            progressAnimation = null;
            fadeSlideProgress(currentSlideIndex);
            if (!isTransitioning) handleSlideChange();
          }
        }, PROGRESS_UPDATE_INTERVAL);
      };

      const safeStartTimer = (delay = 0) => {
        stopAutoSlideTimer();
        if (sliderEnabled && texturesLoaded) {
          if (delay > 0) autoSlideTimer = setTimeout(startAutoSlideTimer, delay);
          else startAutoSlideTimer();
        }
      };

      const handleSlideChange = () => {
        if (isTransitioning || !texturesLoaded || !sliderEnabled) return;
        navigateToSlide((currentSlideIndex + 1) % slides.length);
      };

      const navigateToSlide = (targetIndex: number) => {
        if (isTransitioning || targetIndex === currentSlideIndex) return;
        stopAutoSlideTimer();
        quickResetProgress(currentSlideIndex);

        const currentTexture = slideTextures[currentSlideIndex];
        const targetTexture = slideTextures[targetIndex];
        if (!currentTexture || !targetTexture || !shaderMaterial) return;

        isTransitioning = true;
        const u = shaderMaterial.uniforms as Record<string, { value: unknown }>;
        (u.uTexture1 as { value: THREE.Texture }).value = currentTexture;
        (u.uTexture2 as { value: THREE.Texture }).value = targetTexture;
        (u.uTexture1Size as { value: THREE.Vector2 }).value.copy((currentTexture as THREE.Texture & { userData: { size: THREE.Vector2 } }).userData.size);
        (u.uTexture2Size as { value: THREE.Vector2 }).value.copy((targetTexture as THREE.Texture & { userData: { size: THREE.Vector2 } }).userData.size);

        updateContent(targetIndex);
        currentSlideIndex = targetIndex;
        updateCounter(currentSlideIndex);
        updateNavigationState(currentSlideIndex);

        gsap.fromTo(
          u.uProgress as { value: number },
          { value: 0 },
          {
            value: 1,
            duration: TRANSITION_DURATION(),
            ease: "power2.inOut",
            onComplete: () => {
              (u.uProgress as { value: number }).value = 0;
              (u.uTexture1 as { value: THREE.Texture }).value = targetTexture;
              (u.uTexture1Size as { value: THREE.Vector2 }).value.copy((targetTexture as THREE.Texture & { userData: { size: THREE.Vector2 } }).userData.size);
              isTransitioning = false;
              safeStartTimer(100);
            },
          }
        );
      };

      const createSlidesNavigation = () => {
        const nav = containerRef.current?.querySelector("#luminaSlidesNav");
        if (!nav) return;
        nav.innerHTML = "";
        slides.forEach((slide, i) => {
          const item = document.createElement("div");
          item.className = `lumina-slide-nav-item${i === 0 ? " active" : ""}`;
          item.dataset.slideIndex = String(i);
          item.innerHTML = `<div class="lumina-slide-progress-line"><div class="lumina-slide-progress-fill"></div></div><div class="lumina-slide-nav-title">${slide.title}</div>`;
          item.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!isTransitioning && i !== currentSlideIndex) {
              stopAutoSlideTimer();
              quickResetProgress(currentSlideIndex);
              navigateToSlide(i);
            }
          });
          nav.appendChild(item);
        });
      };

      const loadImageTexture = (src: string) =>
        new Promise<THREE.Texture>((resolve, reject) => {
          const loader = new THREE.TextureLoader();
          loader.crossOrigin = "anonymous";
          loader.load(
            src,
            (t) => {
              t.minFilter = THREE.LinearFilter;
              t.magFilter = THREE.LinearFilter;
              (t as THREE.Texture & { userData: { size: THREE.Vector2 }; image?: { width: number; height: number } }).userData = {
                size: new THREE.Vector2((t as THREE.Texture & { image?: { width: number; height: number } }).image?.width ?? 1, (t as THREE.Texture & { image?: { width: number; height: number } }).image?.height ?? 1),
              };
              resolve(t);
            },
            undefined,
            reject
          );
        });

      const initRenderer = async () => {
        const container = containerRef.current;
        const canvas = container?.querySelector(".lumina-webgl-canvas") as HTMLCanvasElement | null;
        if (!container || !canvas) return;

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        shaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uTexture1: { value: null as THREE.Texture | null },
            uTexture2: { value: null as THREE.Texture | null },
            uProgress: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uTexture1Size: { value: new THREE.Vector2(1, 1) },
            uTexture2Size: { value: new THREE.Vector2(1, 1) },
            uEffectType: { value: 0 },
            uFitMode: { value: window.innerWidth >= 768 ? 1 : 0 },
            uGlobalIntensity: { value: 1.0 },
            uSpeedMultiplier: { value: 1.0 },
            uDistortionStrength: { value: 1.0 },
            uColorEnhancement: { value: 1.0 },
            uGlassRefractionStrength: { value: 1.0 },
            uGlassChromaticAberration: { value: 1.0 },
            uGlassBubbleClarity: { value: 1.0 },
            uGlassEdgeGlow: { value: 1.0 },
            uGlassLiquidFlow: { value: 1.0 },
            uFrostIntensity: { value: 1.0 },
            uFrostCrystalSize: { value: 1.0 },
            uFrostIceCoverage: { value: 1.0 },
            uFrostTemperature: { value: 1.0 },
            uFrostTexture: { value: 1.0 },
            uRippleFrequency: { value: 25.0 },
            uRippleAmplitude: { value: 0.08 },
            uRippleWaveSpeed: { value: 1.0 },
            uRippleRippleCount: { value: 1.0 },
            uRippleDecay: { value: 1.0 },
            uPlasmaIntensity: { value: 1.2 },
            uPlasmaSpeed: { value: 0.8 },
            uPlasmaEnergyIntensity: { value: 0.4 },
            uPlasmaContrastBoost: { value: 0.3 },
            uPlasmaTurbulence: { value: 1.0 },
            uTimeshiftDistortion: { value: 1.6 },
            uTimeshiftBlur: { value: 1.5 },
            uTimeshiftFlow: { value: 1.4 },
            uTimeshiftChromatic: { value: 1.5 },
            uTimeshiftTurbulence: { value: 1.4 },
          },
          vertexShader,
          fragmentShader,
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
        scene.add(mesh);

        for (const s of slides) {
          try {
            const tex = await loadImageTexture(s.media);
            (tex as THREE.Texture & { userData: { size: THREE.Vector2 }; image?: { width: number; height: number } }).userData = {
              size: new THREE.Vector2((tex as THREE.Texture & { image?: { width: number; height: number } }).image?.width ?? 1, (tex as THREE.Texture & { image?: { width: number; height: number } }).image?.height ?? 1),
            };
            slideTextures.push(tex);
          } catch {
            console.warn("Lumina: Failed to load texture", s.media);
          }
        }

        if (slideTextures.length >= 2) {
          const u = shaderMaterial.uniforms as Record<string, { value: unknown }>;
          (u.uTexture1 as { value: THREE.Texture }).value = slideTextures[0];
          (u.uTexture2 as { value: THREE.Texture }).value = slideTextures[1];
          (u.uTexture1Size as { value: THREE.Vector2 }).value.copy((slideTextures[0] as THREE.Texture & { userData: { size: THREE.Vector2 } }).userData.size);
          (u.uTexture2Size as { value: THREE.Vector2 }).value.copy((slideTextures[1] as THREE.Texture & { userData: { size: THREE.Vector2 } }).userData.size);
          texturesLoaded = true;
          sliderEnabled = true;
          updateShaderUniforms();
          containerRef.current?.classList.add("loaded");
          safeStartTimer(500);
        }

        const renderLoop = () => {
          if (renderer && scene && camera) {
            requestAnimationFrame(renderLoop);
            renderer.render(scene, camera);
          }
        };
        renderLoop();
      };

      createSlidesNavigation();
      updateCounter(0);

      const tEl = containerRef.current?.querySelector("#luminaMainTitle");
      const dEl = containerRef.current?.querySelector("#luminaMainDesc");
      if (tEl && dEl) {
        tEl.innerHTML = splitText(slides[0].title);
        dEl.textContent = slides[0].description;
        gsap.fromTo(tEl.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.03, ease: "power3.out", delay: 0.5 });
        gsap.fromTo(dEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.8 });
      }

      initRenderer();

      const onVisibilityChange = () => {
        if (document.hidden) stopAutoSlideTimer();
        else if (!isTransitioning) safeStartTimer();
      };
      const onResize = () => {
        if (renderer && shaderMaterial) {
          const w = window.innerWidth;
          const h = window.innerHeight;
          renderer.setSize(w, h);
          (shaderMaterial.uniforms.uResolution as { value: THREE.Vector2 }).value.set(w, h);
          (shaderMaterial.uniforms.uFitMode as { value: number }).value = w >= 768 ? 1 : 0;
        }
      };

      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("resize", onResize);

      cleanup = () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("resize", onResize);
        stopAutoSlideTimer();
        slideTextures.forEach((t) => t.dispose());
        if (shaderMaterial) shaderMaterial.dispose();
        if (renderer) renderer.dispose();
      };
    };

    run();
    return () => {
      if (cleanup) cleanup();
    };
  }, [slides]);

  return (
    <main className="lumina-slider-wrapper" ref={containerRef}>
      <canvas className="lumina-webgl-canvas" />
      <span className="lumina-slide-number" id="luminaSlideNumber">
        {String(1).padStart(2, "0")}
      </span>
      <span className="lumina-slide-total" id="luminaSlideTotal">
        {String(slides.length).padStart(2, "0")}
      </span>

      <div className="lumina-slide-content">
        <h1 className="lumina-slide-title" id="luminaMainTitle" />
        <p className="lumina-slide-description" id="luminaMainDesc" />
      </div>

      <nav className="lumina-slides-navigation" id="luminaSlidesNav" aria-label="Slide navigation" />
    </main>
  );
}

/** Alias for shadcn/21st.dev demo: `import { Component } from "@/components/ui/lumina-interactive-list"` */
export function Component(props: { slides?: LuminaSlide[] }) {
  return <LuminaInteractiveList {...props} />;
}
