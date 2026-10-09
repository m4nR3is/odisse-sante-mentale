import { type Department } from "../data/experienceTypes";
import {
  buildDistributionLayout,
  type DistributionFrame,
} from "./distributionLayout";
import { useState, useRef, useLayoutEffect, useEffect } from "react";

const CHART_TRANSITION_MS = 760;

export function useAnimatedNumber(
  target: number,
  duration = CHART_TRANSITION_MS,
) {
  const [displayed, setDisplayed] = useState(target);
  const current = useRef(target);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setDisplayed(target);
      return;
    }
    const from = current.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (target - from) * eased;
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);
  return displayed;
}

export function useAnimatedSeries<T extends { year: number; rate: number }>(
  target: T[],
  duration = CHART_TRANSITION_MS,
) {
  const [displayed, setDisplayed] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setDisplayed(target);
      return;
    }
    const from = current.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = target.map((point, index) => {
        const proportionalIndex =
          target.length > 1
            ? Math.round(
                (index / (target.length - 1)) * Math.max(0, from.length - 1),
              )
            : 0;
        const previousRate =
          from.find((candidate) => candidate.year === point.year)?.rate ??
          from[proportionalIndex]?.rate ??
          point.rate;
        return {
          ...point,
          rate: previousRate + (point.rate - previousRate) * eased,
        };
      });
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);
  return displayed;
}

export function useAnimatedAxisScale(
  targetMax: number,
  duration = CHART_TRANSITION_MS,
) {
  const initial = {
    domainMax: targetMax,
    previousMax: targetMax,
    targetMax,
    progress: 1,
  };
  const [displayed, setDisplayed] = useState(initial);
  const current = useRef(initial);
  useLayoutEffect(() => {
    const from = current.current;
    const previousMax = from.targetMax;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const destination = {
        domainMax: targetMax,
        previousMax: targetMax,
        targetMax,
        progress: 1,
      };
      current.current = destination;
      setDisplayed(destination);
      return;
    }
    const transitionStart = {
      domainMax: from.domainMax,
      previousMax,
      targetMax,
      progress: 0,
    };
    current.current = transitionStart;
    setDisplayed(transitionStart);
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = {
        domainMax: from.domainMax + (targetMax - from.domainMax) * eased,
        previousMax,
        targetMax,
        progress: eased,
      };
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, targetMax]);
  return displayed;
}

export function useAnimatedDistribution(
  target: { department: Department; change: number | null }[],
  selectedCode: string,
  width: number,
  height: number,
  duration = 650,
) {
  const [displayed, setDisplayed] = useState(() =>
    buildDistributionLayout(target, selectedCode, width, height),
  );
  const current = useRef(displayed);
  useEffect(() => {
    const destination = buildDistributionLayout(
      target,
      selectedCode,
      width,
      height,
    );
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = destination;
      setDisplayed(destination);
      return;
    }
    const from = current.current;
    const fromByCode = new Map(
      from.rows.map((row) => [row.department.code, row]),
    );
    const started = performance.now();
    let frame = 0;
    const interpolate = (start: number, end: number, progress: number) =>
      start + (end - start) * progress;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const next: DistributionFrame = {
        rows: destination.rows.map((row, index) => {
          const previous =
            fromByCode.get(row.department.code) ??
            from.rows[index % from.rows.length] ??
            row;
          return {
            ...row,
            change: interpolate(previous.change, row.change, eased),
            y: interpolate(previous.y, row.y, eased),
            radius: interpolate(previous.radius, row.radius, eased),
          };
        }),
        min: interpolate(from.min, destination.min, eased),
        max: interpolate(from.max, destination.max, eased),
        increaseShare: interpolate(
          from.increaseShare,
          destination.increaseShare,
          eased,
        ),
      };
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, height, selectedCode, target, width]);
  return displayed;
}
