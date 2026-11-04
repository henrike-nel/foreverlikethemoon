import { animate, inView, scroll, stagger as staggerDelay } from "motion";

export type MotionCleanup = () => void;

/** Matches --ease-rise */
const RISE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Matches --ease-standard */
const STANDARD_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
/** Matches --duration-reveal (600ms) */
const REVEAL_DURATION_S = 0.6;
/** 16px rise */
const REVEAL_Y_PX = 16;
/** 70ms per item */
const STAGGER_S = 0.07;
/** Matches --duration-quick (140ms) */
const MAGNETIC_DURATION_S = 0.14;
const MAGNETIC_PX = 3;
const PARALLAX_MAX_PX = 40;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setVisible(element: HTMLElement): void {
  element.style.opacity = "1";
  element.style.transform = "none";
}

/**
 * Rise 16px and fade in over 600ms once 20% is in view.
 * Resting CSS state is visible — never park at opacity 0 waiting for JS.
 * Do not attach this to a hero.
 */
export function reveal(element: HTMLElement): MotionCleanup {
  if (prefersReducedMotion()) {
    setVisible(element);
    return () => {
      /* already visible */
    };
  }

  let played = false;

  return inView(
    element,
    () => {
      if (played) {
        return;
      }

      played = true;
      void animate(
        element,
        {
          opacity: [0, 1],
          transform: [
            `translateY(${String(REVEAL_Y_PX)}px)`,
            "translateY(0px)",
          ],
        },
        { duration: REVEAL_DURATION_S, ease: RISE_EASE },
      );
    },
    { amount: 0.2 },
  );
}

/**
 * `reveal` across elements, 70ms apart.
 */
export function stagger(elements: HTMLElement[]): MotionCleanup {
  if (elements.length === 0) {
    return () => {
      /* nothing to stagger */
    };
  }

  if (prefersReducedMotion()) {
    for (const element of elements) {
      setVisible(element);
    }

    return () => {
      /* already visible */
    };
  }

  const root = elements[0].parentElement ?? elements[0];
  let played = false;

  return inView(
    root,
    () => {
      if (played) {
        return;
      }

      played = true;
      void animate(
        elements,
        {
          opacity: [0, 1],
          transform: [
            `translateY(${String(REVEAL_Y_PX)}px)`,
            "translateY(0px)",
          ],
        },
        {
          delay: staggerDelay(STAGGER_S),
          duration: REVEAL_DURATION_S,
          ease: RISE_EASE,
        },
      );
    },
    { amount: 0.2 },
  );
}

/**
 * Background-layer parallax. `depth` is 0–1; travel is at most 40px.
 */
export function parallax(
  element: HTMLElement,
  depth = 0.5,
  options: { container?: Element } = {},
): MotionCleanup {
  const travel = Math.min(Math.max(depth, 0), 1) * PARALLAX_MAX_PX;

  if (prefersReducedMotion()) {
    element.style.transform = "none";
    return () => {
      /* in place */
    };
  }

  return scroll(
    (progress: number) => {
      const offset = (progress - 0.5) * 2 * travel;
      element.style.transform = `translateY(${String(offset)}px)`;
    },
    { axis: "y", container: options.container },
  );
}

function setLunarPhase(element: Element, progress: number): void {
  const disc = element.querySelector("[data-lunar-disc]");
  const subtract = element.querySelector("[data-lunar-subtract]");
  if (
    !(disc instanceof SVGCircleElement) ||
    !(subtract instanceof SVGCircleElement)
  ) {
    return;
  }

  const radius = Number(disc.getAttribute("r"));
  const origin = Number(disc.getAttribute("cx"));
  subtract.setAttribute("cx", String(origin + 2 * radius * progress));
}

/**
 * Scroll progress → illuminated fraction of a disc.
 * p = 0 new moon, p = 1 full moon. Linear. Subtracting circle offset dx = 2r·p.
 */
export function lunarProgress(
  element: Element,
  options: { container?: Element } = {},
): MotionCleanup {
  if (prefersReducedMotion()) {
    setLunarPhase(element, 1);
    return () => {
      /* full moon */
    };
  }

  setLunarPhase(element, 0);

  return scroll(
    (progress: number) => {
      setLunarPhase(element, progress);
    },
    { axis: "y", container: options.container },
  );
}

/**
 * Max 3px toward the cursor. Hover-capable fine pointers only.
 */
export function magnetic(element: HTMLElement): MotionCleanup {
  if (prefersReducedMotion()) {
    element.style.transform = "none";
    return () => {
      /* in place */
    };
  }

  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  if (!canHover) {
    return () => {
      /* no magnetic offset */
    };
  }

  const onMove = (event: PointerEvent): void => {
    const rect = element.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
    const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
    void animate(
      element,
      { x: dx * MAGNETIC_PX, y: dy * MAGNETIC_PX },
      { duration: MAGNETIC_DURATION_S, ease: STANDARD_EASE },
    );
  };

  const onLeave = (): void => {
    void animate(
      element,
      { x: 0, y: 0 },
      { duration: MAGNETIC_DURATION_S, ease: STANDARD_EASE },
    );
  };

  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerleave", onLeave);

  return () => {
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerleave", onLeave);
    element.style.transform = "none";
  };
}
