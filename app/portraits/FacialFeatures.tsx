// Hand-drawn feature families, registered to fixed landmarks rather than resized ellipses.
const eyes = [
  {
    lid: "M-24 1C-13-8 8-10 23-1",
    lower: "M-18 6C-6 11 10 9 18 4",
    ink: "M-4-4C-1-7 4-6 5-2C7 2 3 8-1 7C-6 8-7 0-4-4Z",
  },
  {
    lid: "M-23 1C-16-3-10-8-3-7C7-9 17-3 24 1",
    lower: "M-18 3C-11 8-4 9 3 8C12 9 17 5 20 2",
    ink: "M-3-5C5-8 7 4 2 7C-4 8-6 0-3-5Z",
  },
  {
    lid: "M-24 2C-15-1-12-11-2-10C11-13 18-6 24 0",
    lower: "M-19 3C-6 14 8 12 20 3",
    ink: "M-4-5C0-8 5-6 6-2C7 3 5 8 0 8C-6 8-7 0-4-5Z",
  },
  {
    lid: "M-23 2C-13-1-4-2 4-1C13-2 18 0 23 2",
    lower: "M-14 10C-5 12 6 12 14 10",
    ink: "M-27-2C-24-3-20-1-18 1C-20 5-24 4-27 2C-29 1-30-1-27-2Z",
  },
  {
    lid: "M-25 1C-16-4-8-6 0-5C10-6 16-2 24 1",
    lower: "M-17 4C-7 9 6 9 15 5",
    ink: "M-3-4C0-6 4-4 5-1C6 3 3 6-1 6C-5 6-6 0-3-4Z",
  },
  {
    lid: "M-24 1C-8-12 5-10 23 2",
    lower: "M-20 3C-13 13 9 15 20 3",
    ink: "M-6-3C-2-9 7-4 6 3C6 11-8 9-6-3Z",
  },
  {
    lid: "M-23 1C-15-5-6-8 3-6C13-5 19 0 24 2",
    lower: "M-16 5C-1 10 12 7 21 2",
    ink: "M0-6C3-7 6-3 6 1C6 5 3 8-1 6C-5 5-4-3 0-6Z",
  },
  {
    lid: "M-25 2C-17-6-5-7 5-5C16-3 19 2 24 3",
    lower: "M-19 6C-9 10 0 10 8 8C13 9 17 6 19 4",
    ink: "M-4-4C0-7 4-4 5 0C7 5 3 9-2 8C-7 7-7 0-4-4Z",
  },
  {
    lid: "M-24 1C-16-5-10-8-2-7C10-7 17-3 23 1",
    lower: "M-19 3C-12 10-4 11 4 9C13 10 18 6 21 2",
    ink: "M-4-5C0-8 5-3 5 2C5 6 0 8-4 5C-7 2-7-2-4-5Z",
  },
  {
    lid: "M-23 2C-13-3-5-5 6-4C16-3 20 1 24 1",
    lower: "M-17 7C-5 10 11 8 18 5",
    ink: "M-3-4C1-5 5-2 5 2C5 6 0 7-3 5C-6 3-6-1-3-4Z",
  },
];
const brows = [
  "M-27-18C-19-23-11-25-3-24C9-26 21-21 27-17C18-18 12-20 4-20C-9-22-18-18-26-15C-29-14-29-16-27-18Z",
  "M-26-18C-18-24-10-25-1-23C10-24 21-21 26-17C29-14 22-14 19-16C7-19-2-18-9-19C-17-19-22-14-25-15C-28-15-28-17-26-18Z",
  "M-25-18C-15-26-5-29 4-25C13-25 21-18 27-14C18-15 13-18 5-19C-6-24-16-20-24-14C-28-12-28-16-25-18Z",
  "M-26-19C-17-21-7-23 3-21C13-22 23-18 26-16C29-14 23-13 20-15C10-18 0-16-8-18C-16-18-21-14-26-15C-29-15-29-18-26-19Z",
  "M-25-18C-19-23-15-28-7-26C6-28 18-23 26-18C28-15 25-13 22-15C12-18 4-20-5-20C-14-23-18-17-24-14C-27-12-28-16-25-18Z",
];
const mouths = [
  {
    seam: "M-31 2C-18 0-9-1 0 0C11-2 20 0 31 2",
    lower: "M-21 9C-6 13 12 11 23 6",
    ink: "M-29 0C-23-2-17-6-11-4C-5-4-2 0 2-1C9-5 17-4 27-1C21 2 10 3 1 2C-10 3-22 1-29 0Z",
  },
  {
    seam: "M-29 2C-17 0-9-1 0 0C11-1 20 0 29 3",
    lower: "M-20 6C-11 11-3 12 5 10C14 10 18 7 23 4",
    ink: "M-21 6C-12 9-6 12 2 10C12 12 18 6 23 4C17 12 6 13-3 13C-10 14-17 10-21 6Z",
  },
  {
    seam: "M-30 0C-17-6-9-6 0-1C10-6 21-5 30 0",
    lower: "M-26 3C-13 15 14 14 27 3",
    ink: "M-30 0C-22-3-16-9-9-7C-3-8-1-3 2-3C8-8 15-6 21-4C26-4 28-1 30 0C20 3 9 2 0 0C-12 3-20 3-30 0Z",
  },
  {
    seam: "M-30 3C-17 1-8-1 0 0C10-1 21 1 30 3",
    lower: "M-19 8C-7 10 8 11 20 8",
    ink: "M-29 3C-18 1-9-2-1 0C9-2 21 1 29 3C20 4 10 3 1 3C-9 3-20 4-29 3Z",
  },
  {
    seam: "M-27 0C-17-4-8-3 2-1C11-4 20-3 28 0",
    lower: "M-18 7C-9 11 8 12 18 7",
    ink: "M-27 0C-20-2-15-7-8-5C-2-5 0-3 3-4C10-7 18-4 25-1C20 2 12 4 5 2C-7 3-18 4-27 0Z",
  },
  {
    seam: "M-31 3C-16 1-9 0 0 0C10-2 23 0 31 2",
    lower: "M-22 5C-6 11 10 10 24 4",
    ink: "M-21 5C-9 8-4 11 4 9C13 9 18 7 24 4C18 12 7 14-3 14C-10 14-18 9-21 5Z",
  },
  {
    seam: "M-28 0C-15-7-7-4 0-1C9-6 17-4 29 0",
    lower: "M-23 4C-10 14 15 13 25 3",
    ink: "M-28 0C-23-3-18-10-10-8C-3-8-1-3 2-4C7-9 14-7 23-3C28-2 29 0 29 0C18 3 9 2-2 0C-14 4-22 2-28 0Z",
  },
  {
    seam: "M-30 1C-18-2-10 1 0 0C12-3 21-2 30 0",
    lower: "M-19 9C-7 13 9 13 20 7",
    ink: "M-30 1C-19-2-12-4-3-2C7-2 18-6 30 0C22 3 15 2 8 3C-6 4-18 4-30 1Z",
  },
  {
    seam: "M-30 2C-14 0-5-2 0 0C9-1 22 0 30 3",
    lower: "M-24 4C-11 10 9 11 24 4",
    ink: "M-24 4C-18 7-8 11 1 10C12 11 18 7 24 4C18 11 10 13 1 13C-10 14-19 10-24 4Z",
  },
  {
    seam: "M-29 0C-17-4-10-3 0 0C13-5 20-3 30 0",
    lower: "M-22 7C-3 12 11 10 24 5",
    ink: "M-29 0C-21-4-17-8-9-6C-3-5-1-2 3-4C13-9 23-4 30 0C20 3 7 4 0 2C-11 3-23 2-29 0Z",
  },
];

export default function FacialFeatures({ variant }: { variant: number }) {
  const eye = eyes[variant % eyes.length];
  const brow = brows[Math.floor(variant / 10) % brows.length];
  const mouth =
    mouths[(variant * 3 + Math.floor(variant / 10)) % mouths.length];
  const weight = 2.1 + (variant % 3) * 0.35;
  return (
    <g className="portrait-features" data-features={variant}>
      {[194, 290].map((cx) => (
        <g key={cx} transform={`translate(${cx} 240)`}>
          <path className="portrait-feature-ink" d={brow} />
          <g data-feature="eye" data-cx={cx} data-cy="240">
            <path
              className="portrait-pen"
              pathLength="1"
              style={{ strokeWidth: weight }}
              d={eye.lid}
            />
            <path
              className="portrait-pen portrait-lower-lid"
              pathLength="1"
              d={eye.lower}
            />
            <path className="portrait-feature-ink" d={eye.ink} />
          </g>
          {variant % 4 === 0 && (
            <path
              className="portrait-pen portrait-light"
              pathLength="1"
              d="M-17-10C-5-16 9-14 18-8"
            />
          )}
          {variant % 5 === 0 && (
            <path
              className="portrait-pen"
              pathLength="1"
              d="M-24 1L-28-3M23 1L27-2"
            />
          )}
        </g>
      ))}
      <path
        className="portrait-pen"
        pathLength="1"
        style={{ strokeWidth: 1.8 }}
        d={
          variant % 3 === 0
            ? "M249 253L246 274L236 287C234 293 244 297 254 292M261 289L272 293"
            : variant % 3 === 1
              ? "M249 250C251 269 240 276 237 287C237 294 248 295 254 291M263 288L271 291"
              : "M249 252L248 275L240 287L247 294L256 291M262 288L270 289"
        }
      />
      <g
        data-feature="mouth"
        data-cx="244"
        data-cy="324"
        transform="translate(244 324)"
      >
        <path className="portrait-feature-ink" d={mouth.ink} />
        <path
          className="portrait-pen"
          pathLength="1"
          style={{ strokeWidth: 2 }}
          d={mouth.seam}
        />
        <path
          className="portrait-pen"
          pathLength="1"
          style={{ strokeWidth: 1.6 }}
          d={mouth.lower}
        />
        {variant % 4 === 2 && (
          <path
            className="portrait-pen portrait-light"
            pathLength="1"
            d="M-11 21L10 20"
          />
        )}
      </g>
    </g>
  );
}
