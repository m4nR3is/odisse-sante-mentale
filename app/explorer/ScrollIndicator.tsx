export function ScrollIndicator({ progress }: { progress: number }) {
  return (
    <span
      className="control-scroll-progress"
      aria-hidden="true"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}
