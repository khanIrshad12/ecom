"use client";

import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/layout/top-bar";
import Navbar from "@/components/layout/navbar";

const SCROLL_THRESHOLD = 10;
const SCROLL_TOP_MAX = 80;

export default function HeroNavOverlay() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= SCROLL_TOP_MAX) {
        setHidden(false);
      } else if (y > lastScrollY.current && y - lastScrollY.current > SCROLL_THRESHOLD) {
        setHidden(true);
      } else if (lastScrollY.current - y > SCROLL_THRESHOLD) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-10 hero-nav-overlay transition-transform duration-300 ease-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <TopBar />
      <Navbar />
    </div>
  );
}
