import {
  IMPRESSION_DURATION_MS,
  IMPRESSION_RATIO,
} from "@shared/analytics/analytics.constants";

interface ImpressionCallbacks {
  impression: () => boolean | undefined;
}
interface Registration {
  callbacks: ImpressionCallbacks;
  ratio: number;
  hasRecorded: boolean;
  timer?: ReturnType<typeof setTimeout>;
}
const registrations = new Map<HTMLElement, Registration>();
let observer: IntersectionObserver | null = null;

function update(element: HTMLElement, registration: Registration): void {
  clearTimeout(registration.timer);
  if (registration.hasRecorded) return;
  if (
    registration.ratio >= IMPRESSION_RATIO &&
    document.visibilityState === "visible"
  ) {
    registration.timer = setTimeout(() => {
      if (registrations.get(element) !== registration) return;
      if (registration.callbacks.impression() === true) {
        registration.hasRecorded = true;
        observer?.unobserve(element);
      }
    }, IMPRESSION_DURATION_MS);
  }
}
function visibilityChanged(): void {
  for (const [element, registration] of registrations)
    update(element, registration);
}
export function observeImpression(
  element: HTMLElement,
  callbacks: ImpressionCallbacks,
): () => void {
  if (registrations.size === 0) {
    document.addEventListener("visibilitychange", visibilityChanged);
    observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const entry of [...entries].sort(
                (a, b) => a.time - b.time,
              )) {
                const registration = registrations.get(
                  entry.target as HTMLElement,
                );
                if (!registration) continue;
                registration.ratio = entry.isIntersecting
                  ? entry.intersectionRatio
                  : 0;
                update(entry.target as HTMLElement, registration);
              }
            },
            { threshold: [0, IMPRESSION_RATIO] },
          );
  }
  const registration: Registration = {
    callbacks,
    ratio: 0,
    hasRecorded: false,
  };
  registrations.set(element, registration);
  observer?.observe(element);
  return () => {
    clearTimeout(registration.timer);
    if (registrations.get(element) !== registration) return;
    registrations.delete(element);
    observer?.unobserve(element);
    if (registrations.size === 0) {
      observer?.disconnect();
      observer = null;
      document.removeEventListener("visibilitychange", visibilityChanged);
    }
  };
}
