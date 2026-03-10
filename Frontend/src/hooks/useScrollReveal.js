import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Animate a single element: fade in + slide up.
 * @param {object}  options
 * @param {number}  options.duration  default 0.8
 * @param {string}  options.ease      default "power3.out"
 * @param {number}  options.y         default 40
 * @param {number}  options.delay     default 0
 * @param {string}  options.start     default "top 85%"
 * @param {boolean} options.noScroll  if true, animate on mount (no ScrollTrigger)
 */
export function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const {
      duration = 0.8,
      ease = "power3.out",
      y = 40,
      delay = 0,
      start = "top 85%",
      noScroll = false,
    } = options;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          ease,
          delay,
          scrollTrigger: noScroll ? undefined : { trigger: el, start },
        }
      );
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/**
 * Animate a container's children with stagger: fade in + slide up.
 * @param {string}  selector  CSS selector for children, default ":scope > *"
 * @param {object}  options
 * @param {number}  options.duration  default 0.8
 * @param {string}  options.ease      default "power3.out"
 * @param {number}  options.y         default 40
 * @param {number}  options.stagger   default 0.15
 * @param {string}  options.start     default "top 85%"
 * @param {boolean} options.noScroll  if true, animate on mount (no ScrollTrigger)
 * @param {any[]}   deps  extra deps that re-trigger the animation (e.g. [status])
 */
export function useStagger(selector = ":scope > *", options = {}, deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const {
      duration = 0.8,
      ease = "power3.out",
      y = 40,
      stagger = 0.15,
      start = "top 85%",
      noScroll = false,
    } = options;

    const els = Array.from(container.querySelectorAll(selector));
    if (!els.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        els,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          ease,
          stagger,
          scrollTrigger: noScroll ? undefined : { trigger: container, start },
        }
      );
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
