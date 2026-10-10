import FacialFeatures from "./FacialFeatures";
import PortraitVariants from "./PortraitVariants";

// SVG definitions also inherit animated drawing styles. Mount only those
// referenced by the current composition, while preserving all available variants.
export default function PortraitDefinitions({ id, faces }: {
  id: string;
  faces?: readonly number[];
}) {
  return (
    <>
      <PortraitVariants id={id} faces={faces} />
      {(!faces || faces.includes(0)) && <g id={`${id}-portrait`}>
        {/* Broad, cut-paper masses sit behind the dry pen contours. */}
        <path
          className="portrait-wash"
          d="M139 193C119 156 138 105 180 92C228 60 303 80 334 125C351 145 352 177 344 203L321 185L312 150L280 141L256 112L231 143L198 137L170 174Z"
        />
        <path
          className="portrait-wash portrait-wash-soft"
          d="M150 346L169 363L192 376L197 415L128 441L72 507L118 534L213 450L263 423L301 443L371 531L431 504L358 427L303 409L305 352L278 375L223 382Z"
        />
        <path
          className="portrait-pen portrait-heavy"
          pathLength="1"
          d="M142 194C128 182 125 165 131 149C123 131 139 107 162 105C166 85 192 82 209 86C229 67 257 76 268 83C289 77 312 92 317 106C340 109 352 135 345 151C358 167 351 189 339 201"
        />
        <path
          className="portrait-pen"
          pathLength="1"
          d="M151 185C140 231 145 272 159 306C164 332 175 351 195 366L224 384C242 393 270 377 289 363C311 345 325 318 331 285L343 218"
        />
        <path
          className="portrait-pen portrait-light"
          pathLength="1"
          d="M146 190C137 221 138 249 144 273M153 311C162 335 174 354 197 371M301 350C318 331 327 306 333 279"
        />
        <path
          className="portrait-pen"
          pathLength="1"
          d="M151 226C137 208 125 219 131 240C134 254 142 268 151 266M333 224C348 210 358 221 351 242C345 256 338 263 330 260"
        />
        <path
          className="portrait-pen portrait-light"
          pathLength="1"
          d="M138 231L143 246L146 239M342 230L337 246"
        />
        <FacialFeatures variant={0} />
        <path
          className="portrait-pen portrait-light"
          pathLength="1"
          d="M231 351L253 352M173 271L180 283M308 270L300 285"
        />
        <path
          className="portrait-pen portrait-heavy"
          pathLength="1"
          d="M193 367L193 409C168 417 145 423 125 438L86 486M302 357L303 411C330 416 353 424 370 443L411 492"
        />
        <path
          className="portrait-pen"
          pathLength="1"
          d="M193 409C209 435 257 443 303 411M174 419C193 460 270 469 321 419M125 439L137 454M370 443L354 459"
        />
        {/* Unequal hatch spacing and crossed marks give the drawing its hand. */}
        <path
          className="portrait-pen portrait-hatch"
          pathLength="1"
          d="M143 160L170 138M147 172L191 135M152 182L204 138M169 179L217 141M181 172L228 130M214 128L239 104M226 128L247 107M252 106L272 126M268 113L291 136M280 111L309 142M297 118L321 148M312 128L337 160M319 149L341 174M325 170L341 185"
        />
        <path
          className="portrait-pen portrait-hatch"
          pathLength="1"
          d="M155 281L169 300M158 296L173 318M164 313L182 336M174 334L193 352M285 348L298 329M294 347L309 321M300 330L318 299M190 381L208 405M190 391L218 420M283 388L276 416M295 378L287 415M116 461L150 444M112 474L163 449M355 455L386 476M355 465L397 492"
        />
        <path
          className="portrait-pen portrait-accent portrait-brush"
          pathLength="1"
          d="M164 202C184 191 204 188 223 190"
        />
        <path
          className="portrait-pen portrait-accent"
          pathLength="1"
          d="M282 317L303 312M285 323L309 318M291 329L313 325"
        />
      </g>}
    </>
  );
}
