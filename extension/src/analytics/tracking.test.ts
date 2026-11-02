import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { observeTrackedElement } from "./tracking";

let notify: IntersectionObserverCallback;
let visible = true;
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => (visible ? "visible" : "hidden"),
  });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  visible = true;
  document.body.innerHTML = "";
});

test("40% 이상 연속 1초 노출을 기록하고 숨겨지면 시간을 다시 센다", () => {
  const element = document.createElement("button");
  document.body.append(element);
  const impression = vi.fn();
  const stop = observeTrackedElement(element, {
    click: vi.fn(),
    impression,
  });
  notify(
    [
      {
        target: element,
        intersectionRatio: 0.4,
        isIntersecting: true,
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRect: element.getBoundingClientRect(),
        rootBounds: null,
        time: 0,
      } as IntersectionObserverEntry,
    ],
    {} as IntersectionObserver,
  );
  vi.advanceTimersByTime(900);
  expect(impression).not.toHaveBeenCalled();
  visible = false;
  document.dispatchEvent(new Event("visibilitychange"));
  vi.advanceTimersByTime(1000);
  expect(impression).not.toHaveBeenCalled();
  visible = true;
  document.dispatchEvent(new Event("visibilitychange"));
  vi.advanceTimersByTime(1000);
  expect(impression).toHaveBeenCalledTimes(1);
  stop();
});
test("중첩된 label 클릭은 가장 가까운 대상에서만 기록한다", () => {
  const parent = document.createElement("div"),
    child = document.createElement("button");
  parent.append(child);
  document.body.append(parent);
  const outer = vi.fn(),
    inner = vi.fn();
  const stopOuter = observeTrackedElement(parent, {
    click: outer,
    impression: vi.fn(),
  });
  const stopInner = observeTrackedElement(child, {
    click: inner,
    impression: vi.fn(),
  });
  child.click();
  expect(inner).toHaveBeenCalledTimes(1);
  expect(outer).not.toHaveBeenCalled();
  stopInner();
  stopOuter();
});
test("40% 미만에서는 시간이 지나도 노출로 기록하지 않는다", () => {
  const element = document.createElement("button");
  document.body.append(element);
  const impression = vi.fn();
  const stop = observeTrackedElement(element, {
    click: vi.fn(),
    impression,
  });
  notify(
    [
      {
        target: element,
        intersectionRatio: 0.39,
        isIntersecting: true,
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRect: element.getBoundingClientRect(),
        rootBounds: null,
        time: 0,
      } as IntersectionObserverEntry,
    ],
    {} as IntersectionObserver,
  );
  vi.advanceTimersByTime(2000);
  expect(impression).not.toHaveBeenCalled();
  stop();
});

function intersectionEntries(
  element: Element,
  changes: Array<[number, number]>,
): IntersectionObserverEntry[] {
  return changes.map(([time, ratio]) => ({
    target: element,
    time,
    intersectionRatio: ratio,
    isIntersecting: ratio > 0,
    boundingClientRect: element.getBoundingClientRect(),
    intersectionRect: element.getBoundingClientRect(),
    rootBounds: null,
  }));
}

test.each([
  {
    name: "시간순",
    changes: [
      [0, 0.5],
      [1, 0],
    ] as Array<[number, number]>,
  },
  {
    name: "배열이 역순",
    changes: [
      [1, 0],
      [0, 0.5],
    ] as Array<[number, number]>,
  },
])("같은 콜백에서 보였다가 사라진 대상은 노출로 기록하지 않는다 ($name)", ({
  changes,
}) => {
  const element = document.createElement("button");
  const impression = vi.fn();
  const stop = observeTrackedElement(element, {
    click: vi.fn(),
    impression,
  });
  notify(intersectionEntries(element, changes), {} as IntersectionObserver);
  vi.advanceTimersByTime(1000);
  expect(impression).not.toHaveBeenCalled();
  stop();
});

test("콜백 사이에 잠깐 사라졌다 다시 보이면 연속 노출 시간을 처음부터 잰다", () => {
  const element = document.createElement("button");
  const impression = vi.fn();
  const stop = observeTrackedElement(element, {
    click: vi.fn(),
    impression,
  });
  notify(intersectionEntries(element, [[0, 0.5]]), {} as IntersectionObserver);
  vi.advanceTimersByTime(900);
  notify(
    intersectionEntries(element, [
      [800, 0],
      [900, 0.5],
    ]),
    {} as IntersectionObserver,
  );
  vi.advanceTimersByTime(999);
  expect(impression).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(impression).toHaveBeenCalledTimes(1);
  stop();
});

test("등록되지 않은 data-label과 stopPropagation이 등록 대상의 클릭을 누락시키지 않는다", () => {
  const button = document.createElement("button"),
    child = document.createElement("span");
  child.dataset.label = "unregistered";
  button.append(child);
  document.body.append(button);
  const click = vi.fn();
  const stop = observeTrackedElement(button, {
    click,
    impression: vi.fn(),
  });
  child.addEventListener("click", (event) => event.stopPropagation());
  child.click();
  expect(click).toHaveBeenCalledTimes(1);
  stop();
});
