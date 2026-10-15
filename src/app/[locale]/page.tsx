"use client";

import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle,
  Database,
  Download,
  Palette,
  Share2,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  Box,
  Button,
  Container,
  Grid,
  Link as MuiLink,
  Typography,
} from "@mui/material";
import { keyframes, SxProps, Theme } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import CustomBox from "@/src/components/custom/background/CustomBox";
import { Link } from "@/src/i18n/navigation";

//#region Motion
// One orchestrated intro in the hero (tables -> relationships -> collaborators),
// plus interactions that answer the pointer. Everything is off for reduced motion.
const popIn = keyframes`
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: 1; transform: scale(1); }
`;
const draw = keyframes`
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const grow = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;
const driftA = keyframes`
  from { transform: translate(0px, 0px); }
  to { transform: translate(-30px, 20px); }
`;
const driftB = keyframes`
  from { transform: translate(0px, 0px); }
  to { transform: translate(26px, -16px); }
`;
const ants = keyframes`
  to { stroke-dashoffset: -8; }
`;
const flow = keyframes`
  to { stroke-dashoffset: -9; }
`;
const ping = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  80%, 100% { transform: scale(2.8); opacity: 0; }
`;
//#endregion

//#region Hero scene: the app's own table nodes and relationships, drawing themselves
type Column = {
  name: string;
  type: string;
  key?: number; // position in the primary key (blue key with a number)
  nullable?: boolean; // defaults to true for non-key columns
};

const NODE_W = 240;
const NODE_ROW_H = 27;
const nodeHeight = (rows: number) => 30 + rows * NODE_ROW_H + 6;
const rowCenter = (i: number) => 43.5 + i * NODE_ROW_H;

function KeyGlyph({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} className={on ? "key-on" : "key-off"}>
      <circle cx={-3.5} cy={0} r={3.2} />
      <path d="M-0.3 0H6.5M3.6 0V3M6.5 0V2.4" />
    </g>
  );
}

function NodeShape({
  x,
  y,
  color,
  name,
  columns,
  delay,
}: {
  x: number;
  y: number;
  color: string;
  name: string;
  columns: Column[];
  delay: number;
}) {
  const W = NODE_W;
  const h = nodeHeight(columns.length);
  const m = h / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="table" style={{ animationDelay: `${delay}s` }}>
        {/* Drag handle: drawn first so the card hides its right half, leaving a half circle */}
        <circle cx={-1} cy={9.5} r={9.5} fill={color} />
        {[-6.5, -3].map((dx) =>
          [5.5, 9.5, 13.5].map((cy) => (
            <circle key={`${dx}-${cy}`} cx={dx} cy={cy} r={1.05} fill="#fff" />
          )),
        )}
        <rect
          className="card"
          width={W}
          height={h}
          rx={4}
          filter="url(#node-shadow)"
        />
        {/* Colored top bar */}
        <path
          d={`M0 4A4 4 0 0 1 4 0H${W - 4}A4 4 0 0 1 ${W} 4Z`}
          fill={color}
        />

        <text className="hname" x={14} y={21} style={{ fontFamily: "Roboto" }}>
          {name}
        </text>
        <text
          className="hplus"
          x={W - 54}
          y={21}
          style={{ fontFamily: "Roboto" }}
        >
          +1
        </text>
        <path className="chev" d={`M${W - 23} 23L${W - 17} 17L${W - 11} 23`} />

        {/* Connection handles */}
        <path className="handle" d={`M-2.5 ${m - 3}L1.5 ${m}L-2.5 ${m + 3}Z`} />
        <path
          className="handle"
          d={`M${W + 2.5} ${m - 3}L${W - 1.5} ${m}L${W + 2.5} ${m + 3}Z`}
        />
        <path
          className="handle"
          d={`M${W / 2 - 3} -2.5L${W / 2} 1.5L${W / 2 + 3} -2.5Z`}
        />
        <path
          className="handle"
          d={`M${W / 2 - 3} ${h + 2.5}L${W / 2} ${h - 1.5}L${W / 2 + 3} ${h + 2.5}Z`}
        />

        {columns.map((c, i) => {
          const cy = rowCenter(i);
          const isKey = c.key !== undefined;
          const nullable = c.nullable ?? !isKey;
          return (
            <g key={c.name}>
              <text
                className="cname"
                x={14}
                y={cy + 4}
                style={{ fontFamily: "Roboto" }}
              >
                {c.name}
              </text>

              <KeyGlyph x={125} y={cy} on={isKey} />
              {isKey && (
                <>
                  <circle className="dot-blue" cx={131} cy={cy - 7} r={4.6} />
                  <text
                    className="num"
                    x={131}
                    y={cy - 4.7}
                    style={{ fontFamily: "Roboto" }}
                  >
                    {c.key}
                  </text>
                  <circle className="dot-green" cx={119} cy={cy + 6} r={4.6} />
                  <path
                    className="caret"
                    d={`M116.8 ${cy + 7.3}L119 ${cy + 4.9}L121.2 ${cy + 7.3}`}
                  />
                </>
              )}

              {nullable ? (
                <>
                  <rect
                    className="n-box"
                    x={135}
                    y={cy - 7}
                    width={14}
                    height={14}
                    rx={3}
                  />
                  <text
                    className="n-on"
                    x={142}
                    y={cy + 3.3}
                    style={{ fontFamily: "Roboto" }}
                  >
                    N
                  </text>
                </>
              ) : (
                <text
                  className="n-off"
                  x={142}
                  y={cy + 3.3}
                  style={{ fontFamily: "Roboto" }}
                >
                  N
                </text>
              )}

              <rect
                className="input"
                x={153}
                y={cy - 9}
                width={68}
                height={18}
                rx={3}
              />
              <text
                className="ctype"
                x={159}
                y={cy + 3.4}
                style={{ fontFamily: "Roboto" }}
              >
                {c.type}
              </text>

              {[-4, 0, 4].map((dy) => (
                <circle
                  key={dy}
                  className="kebab"
                  cx={W - 10}
                  cy={cy + dy}
                  r={1.2}
                />
              ))}
            </g>
          );
        })}
      </g>
    </g>
  );
}

// Relationship end labels ("N" / "1") and the round icon in the middle of a line
function EdgeTag({ x, y, text, classTag }: { x: number; y: number; text: string; classTag: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className={classTag} x={-7} y={-7} width={14} height={14} rx={3} />
      <text className="tagt" y={3.2} style={{ fontFamily: "Roboto" }}>
        {text}
      </text>
    </g>
  );
}

function EdgeHub({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={8.5} fill={color} />
      <g className="hub-glyph">
        <rect x={-5.2} y={-1.8} width={3.6} height={3.6} rx={0.8} />
        <rect x={1.6} y={-5.4} width={3.6} height={3.6} rx={0.8} />
        <rect x={1.6} y={1.8} width={3.6} height={3.6} rx={0.8} />
        <path d="M-1.6 0H0V-3.6H1.6M0 0V3.6H1.6" />
      </g>
    </g>
  );
}

function Cursor({
  color,
  label,
  labelWidth,
  x,
  y,
  drift,
  delay,
}: {
  color: string;
  label: string;
  labelWidth: number;
  x: number;
  y: number;
  drift: "driftA" | "driftB";
  delay: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="appear" style={{ animationDelay: `${delay}s` }}>
        <g className={drift}>
          <path
            d="M0 0V16L4.5 12L8 19.5L10.8 18.3L7.3 11H13Z"
            fill={color}
            stroke="#fff"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <rect
            x={13}
            y={17}
            width={labelWidth}
            height={18}
            rx={9}
            fill={color}
          />
          <text
            className="who"
            x={13 + labelWidth / 2}
            y={29.5}
            style={{ fontFamily: "Roboto" }}
          >
            {label}
          </text>
        </g>
      </g>
    </g>
  );
}

// Orthogonal ("step") relationships with rounded corners, like the real canvas
const EDGE_A = "M288 90.5H312Q320 90.5 320 98.5V259.5Q320 267.5 328 267.5H352";
const EDGE_B = "M168 164V222Q168 230 160 230H144Q136 230 136 238V290";

function HeroScene() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 24px 60px -24px rgba(31, 53, 96, 0.35)",
      }}
    >
      <Box
        component="svg"
        aria-hidden
        viewBox="0 0 600 380"
        sx={(theme) => {
          const pal = (theme.vars ?? theme).palette;
          return {
            display: "block",
            width: "100%",
            height: "auto",
            color: pal.text.secondary,
            "& .gridline": {
              fill: "none",
              stroke: pal.divider,
              strokeWidth: 1,
              opacity: 0.55,
            },
            "& .table": {
              animation: `${popIn} 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) backwards`,
              transformBox: "fill-box",
              transformOrigin: "center",
            },
            "& .card": { fill: pal.background.paper, stroke: pal.divider },
            "& .hname": {
              fill: pal.text.primary,
              fontSize: 12,
              fontFamily: "inherit",
            },
            "& .hplus": {
              fill: pal.text.secondary,
              fontSize: 11,
              fontFamily: "inherit",
            },
            "& .chev": {
              fill: "none",
              stroke: pal.text.secondary,
              strokeWidth: 1.5,
              strokeLinecap: "round",
              strokeLinejoin: "round",
            },
            "& .handle": { fill: pal.text.disabled },
            "& .cname": {
              fill: pal.text.primary,
              fontSize: 11,
              fontFamily: "inherit",
            },
            "& .key-on": {
              fill: "none",
              stroke: "var(--node-blue)",
              strokeWidth: 1.5,
              strokeLinecap: "round",
            },
            "& .key-off": {
              fill: "none",
              stroke: pal.divider,
              strokeWidth: 1.5,
              strokeLinecap: "round",
            },
            "& .dot-blue": { fill: "var(--node-blue)" },
            "& .dot-green": { fill: "#2e7d32" },
            "& .num": {
              fill: "#fff",
              fontSize: 6.5,
              fontWeight: 700,
              textAnchor: "middle",
              fontFamily: "inherit",
            },
            "& .caret": {
              fill: "none",
              stroke: "#fff",
              strokeWidth: 1.2,
              strokeLinecap: "round",
              strokeLinejoin: "round",
            },
            "& .n-box": { fill: "var(--node-blue-soft)" },
            "& .n-on": {
              fill: "var(--node-blue)",
              fontSize: 8.5,
              fontWeight: 700,
              textAnchor: "middle",
              fontFamily: "inherit",
            },
            "& .n-off": {
              fill: pal.text.disabled,
              fontSize: 8.5,
              fontWeight: 700,
              textAnchor: "middle",
              fontFamily: "inherit",
            },
            "& .input": {
              fill: "none",
              stroke: "var(--node-blue-line)",
              strokeWidth: 1,
            },
            "& .ctype": {
              fill: "var(--node-blue)",
              fontSize: 9,
              fontFamily: "inherit",
            },
            "& .kebab": { fill: pal.text.secondary },
            "& .edge-a": {
              fill: "none",
              stroke: "#2196f3",
              strokeWidth: 1.5,
              strokeDasharray: 1,
              animation: `${draw} 0.9s ease-in-out backwards`,
            },
            "& .reveal": {
              fill: "none",
              stroke: "#fff",
              strokeWidth: 10,
              strokeDasharray: 1,
              animation: `${draw} 0.9s ease-in-out backwards`,
            },
            "& .edge-b": {
              fill: "none",
              stroke: "#8bc34a",
              strokeWidth: 1.75,
              strokeDasharray: "5 4",
              animation: `${flow} 1.2s linear infinite`,
            },
            "& .appear": { animation: `${fadeIn} 0.5s ease-out backwards` },
            "& .tag-a": { fill: "#1565c0" },
            "& .tag-b": { fill: "#8bc34a" },
            "& .tagt": {
              fill: "#fff",
              fontSize: 8.5,
              fontWeight: 700,
              textAnchor: "middle",
              fontFamily: "inherit",
            },
            "& .hub-glyph": {
              fill: "#fff",
              stroke: "#fff",
              strokeWidth: 0.9,
              strokeLinecap: "round",
              strokeLinejoin: "round",
            },
            "& .hub-glyph path": { fill: "none" },
            "& .hl": { fill: "none", strokeWidth: 1.5 },
            "& .sel": {
              fill: "none",
              strokeWidth: 1.5,
              strokeDasharray: "5 3",
              pointerEvents: "none",
              animation: `${fadeIn} 0.5s ease-out backwards, ${ants} 0.8s linear infinite`,
            },
            "& .driftA": {
              animation: `${driftA} 7s ease-in-out infinite alternate`,
            },
            "& .driftB": {
              animation: `${driftB} 8s ease-in-out infinite alternate`,
            },
            "& .who": {
              fill: "#fff",
              fontSize: 10.5,
              fontWeight: 600,
              textAnchor: "middle",
              fontFamily: "inherit",
            },
          };
        }}
      >
        <defs>
          <pattern
            id="scene-grid"
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
          >
            <path className="gridline" d="M20 0H0V20" />
          </pattern>
          <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="135%">
            <feDropShadow
              dx={0}
              dy={2}
              stdDeviation={3}
              floodColor="#1f3560"
              floodOpacity={0.18}
            />
          </filter>
          {/* Reveals the dashed line progressively (a dashed stroke can't use pathLength) */}
          <mask
            id="edge-b-reveal"
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={600}
            height={380}
          >
            <path
              className="reveal"
              d={EDGE_B}
              pathLength={1}
              style={{ animationDelay: "1.5s" }}
            />
          </mask>
        </defs>

        <rect width={600} height={380} fill="url(#scene-grid)" />

        {/* Relationships go under the nodes */}
        <path
          className="edge-a"
          d={EDGE_A}
          pathLength={1}
          style={{ animationDelay: "1.2s" }}
        />
        <path className="edge-b" d={EDGE_B} mask="url(#edge-b-reveal)" />

        <NodeShape
          x={48}
          y={20}
          color="#009688"
          name="Bang_1"
          delay={0.15}
          columns={[
            { name: "ID", type: "int", key: 1 },
            { name: "Cot_1", type: "varchar(100)", key: 2 },
            { name: "Cot_2", type: "varchar(100)" },
            { name: "Cot_3", type: "varchar(100)" },
          ]}
        />
        <NodeShape
          x={16}
          y={290}
          color="#4caf50"
          name="Bang_2"
          delay={0.4}
          columns={[{ name: "ID", type: "int", key: 1 }]}
        />
        <NodeShape
          x={352}
          y={236}
          color="#03a9f4"
          name="Bang_0"
          delay={0.65}
          columns={[{ name: "ID", type: "int", key: 1 }]}
        />

        {/* End labels and the icon on each line, after the lines are drawn */}
        <g className="appear" style={{ animationDelay: "2.1s" }}>
          <EdgeTag x={301} y={90.5} text="N" classTag="tag-a" />
          <EdgeTag x={339} y={267.5} text="1" classTag="tag-a" />
          <EdgeHub x={320} y={179} color="#2196f3" />
          <EdgeTag x={168} y={177} text="N" classTag="tag-b" />
          <EdgeTag x={136} y={277} text="1" classTag="tag-b" />
          <EdgeHub x={152} y={230} color="#8bc34a" />
        </g>

        {/* Collaborators: one is editing a column type, one has a table selected */}
        <rect
          className="hl appear"
          x={199}
          y={106.5}
          width={72}
          height={22}
          rx={5}
          stroke="#f43f5e"
          style={{ animationDelay: "2.9s" }}
        />
        <rect
          className="sel"
          x={352}
          y={236}
          width={NODE_W}
          height={nodeHeight(1)}
          rx={4}
          stroke="#8b5cf6"
          style={{ animationDelay: "2.7s, 0s" }}
        />
        <Cursor
          color="#f43f5e"
          label="Khoa"
          labelWidth={44}
          x={256}
          y={122}
          drift="driftB"
          delay={2.9}
        />
        <Cursor
          color="#8b5cf6"
          label="Linh"
          labelWidth={42}
          x={540}
          y={282}
          drift="driftA"
          delay={2.7}
        />
      </Box>
    </Box>
  );
}
//#endregion

//#region Small building blocks
// A relationship line (bar -> line -> crow's foot) that draws itself under the headline
function RelationshipUnderline() {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "-0.12em",
        display: "flex",
        alignItems: "center",
        height: 14,
        color: "var(--accent)",
      }}
    >
      <Box component="svg" viewBox="0 0 8 14" sx={{ width: 8, height: 14 }}>
        <path
          d="M4 0V14"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </Box>
      <Box
        component="span"
        sx={{
          flex: 1,
          height: 3,
          bgcolor: "currentColor",
          transformOrigin: "left",
          animation: `${grow} 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.9s backwards`,
        }}
      />
      <Box
        component="svg"
        viewBox="0 0 16 14"
        sx={{
          width: 16,
          height: 14,
          animation: `${fadeIn} 0.3s ease-out 1.75s backwards`,
        }}
      >
        <path
          d="M0 7L16 0M0 7L16 7M0 7L16 14"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      </Box>
    </Box>
  );
}

function LiveDot() {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        position: "relative",
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: "#22c55e",
        flexShrink: 0,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          bgcolor: "#22c55e",
          opacity: 0,
          animation: `${ping} 2s ease-out infinite`,
        },
      }}
    />
  );
}

// Counts up once, when it scrolls into view
function CountUp({
  to,
  decimals = 0,
  suffix = "",
}: {
  to: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1600;
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setValue(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <span ref={ref}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// A feature cell with a light that follows the pointer
function FeatureCell({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--sx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--sy", `${e.clientY - r.top}px`);
  };
  return (
    <Box
      onMouseMove={onMove}
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 3, md: 4 },
        bgcolor: "background.default",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.25s",
          background:
            "radial-gradient(280px circle at var(--sx, 50%) var(--sy, 50%), color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)",
        },
        "&:hover::before": { opacity: 1 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 44,
          height: 44,
          mb: 2.5,
          display: "grid",
          placeItems: "center",
          borderRadius: 2,
          color: "var(--accent)",
          bgcolor: "color-mix(in srgb, var(--accent) 12%, transparent)",
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        fontWeight={600}
        mb={1}
        sx={{ position: "relative" }}
        color="textPrimary"
      >
        {title}
      </Typography>
      <Typography
        color="text.secondary"
        lineHeight={1.7}
        sx={{ position: "relative" }}
      >
        {description}
      </Typography>
    </Box>
  );
}

// Dark band shared by the benefits and closing sections
const deepBand: SxProps<Theme> = {
  position: "relative",
  overflow: "hidden",
  color: "#fff",
  background: "linear-gradient(160deg, #1f3560 0%, #2f4975 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage:
      "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
    maskImage:
      "radial-gradient(ellipse 70% 100% at 80% 0%, #000 20%, transparent 75%)",
    WebkitMaskImage:
      "radial-gradient(ellipse 70% 100% at 80% 0%, #000 20%, transparent 75%)",
  },
};

const gridImage = (color: string) =>
  `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`;

const baseGrid: SxProps<Theme> = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: gridImage("var(--grid)"),
  backgroundSize: "44px 44px",
  maskImage:
    "radial-gradient(ellipse 85% 95% at 70% 45%, #000 30%, transparent 80%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 85% 95% at 70% 45%, #000 30%, transparent 80%)",
};

// Same grid, brighter, revealed only around the pointer
const brightGrid: SxProps<Theme> = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: gridImage("var(--grid-bright)"),
  backgroundSize: "44px 44px",
  maskImage:
    "radial-gradient(circle 190px at var(--mx, -400px) var(--my, -400px), #000 0%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(circle 190px at var(--mx, -400px) var(--my, -400px), #000 0%, transparent 100%)",
};
//#endregion

const stats: {
  to?: number;
  decimals?: number;
  suffix?: string;
  text?: string;
  label: string;
}[] = [
  { to: 50, suffix: "K+", label: "Active Users" },
  { to: 1, suffix: "M+", label: "ERDs Created" },
  { to: 99.9, decimals: 1, suffix: "%", label: "Uptime" },
  { text: "24/7", label: "Support" },
];

const Index = () => {
  const t = useTranslations("/");
  const s = useSession();
  const startHref = s.status === "authenticated" ? "/dashboard" : "/signin";

  const features = [
    {
      icon: <Database size={22} />,
      title: t("feature1Title"),
      description: t("feature1Desc"),
    },
    {
      icon: <Zap size={22} />,
      title: t("feature2Title"),
      description: t("feature2Desc"),
    },
    {
      icon: <Palette size={22} />,
      title: t("feature3Title"),
      description: t("feature3Desc"),
    },
    {
      icon: <Download size={22} />,
      title: t("feature4Title"),
      description: t("feature4Desc"),
    },
    {
      icon: <Share2 size={22} />,
      title: t("feature5Title"),
      description: t("feature5Desc"),
    },
    {
      icon: <Target size={22} />,
      title: t("feature6Title"),
      description: t("feature6Desc"),
    },
  ];

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
    t("benefit5"),
  ];

  const audiences = [
    {
      icon: <Database size={28} />,
      color: "#16a34a",
      title: t("targetAudience1Title"),
      desc: t("targetAudience1Desc"),
    },
    {
      icon: <Users size={28} />,
      color: "#2563eb",
      title: t("targetAudience2Title"),
      desc: t("targetAudience2Desc"),
    },
    {
      icon: <Target size={28} />,
      color: "#7c3aed",
      title: t("targetAudience3Title"),
      desc: t("targetAudience3Desc"),
    },
  ];

  const testimonials = [
    {
      quote: t("testimonial1Text"),
      author: "Sarah Chen",
      role: t("testimonial1Role"),
      company: "TechFlow Inc.",
    },
    {
      quote: t("testimonial2Text"),
      author: "Marcus Rodriguez",
      role: t("testimonial2Role"),
      company: "DataStream Solutions",
    },
    {
      quote: t("testimonial3Text"),
      author: "Emily Watson",
      role: t("testimonial3Role"),
      company: "CloudFirst Corp.",
    },
  ];

  const onHeroMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const onHeroLeave = (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--mx");
    e.currentTarget.style.removeProperty("--my");
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        bgcolor: "background.default",
        // Page tokens, switched per color scheme
        "--accent": "#0891b2",
        "--grid": "rgba(47, 73, 117, 0.09)",
        "--grid-bright": "rgba(8, 145, 178, 0.5)",
        "--cta-bg": "#1f3560",
        "--cta-fg": "#ffffff",
        "--node-blue": "#1976d2",
        "--node-blue-soft": "rgba(25, 118, 210, 0.1)",
        "--node-blue-line": "rgba(25, 118, 210, 0.4)",
        ...theme.applyStyles("dark", {
          "--accent": "#22d3ee",
          "--grid": "rgba(170, 189, 243, 0.09)",
          "--grid-bright": "rgba(34, 211, 238, 0.55)",
          "--cta-bg": "#22d3ee",
          "--cta-fg": "#082f3a",
          "--node-blue": "#64b5f6",
          "--node-blue-soft": "rgba(100, 181, 246, 0.14)",
          "--node-blue-line": "rgba(100, 181, 246, 0.45)",
        }),
        "@media (prefers-reduced-motion: reduce)": {
          "&, & *, & *::before, & *::after": {
            animation: "none !important",
            transition: "none !important",
          },
        },
      })}
    >
      {/* Hero */}
      <CustomBox sx={{ overflow: "hidden" }}>
        <Box
          onMouseMove={onHeroMove}
          onMouseLeave={onHeroLeave}
          sx={{ position: "relative" }}
        >
          <Box aria-hidden sx={baseGrid} />
          <Box aria-hidden sx={brightGrid} />
          <Container
            maxWidth="lg"
            sx={{ position: "relative", py: { xs: 10, lg: 14 } }}
          >
            <Grid container spacing={{ xs: 8, lg: 6 }} alignItems="center">
              <Grid size={{ xs: 12, lg: 6 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1.75,
                    py: 0.75,
                    mb: 4,
                    borderRadius: 99,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    fontFamily: "Roboto",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "text.secondary",
                  }}
                >
                  <LiveDot />
                  {t("productionTitle")}
                </Box>

                <Typography
                  variant="h1"
                  color="text.primary"
                  sx={{
                    fontSize: { xs: "2.4rem", sm: "3.2rem", lg: "3.9rem" },
                    fontWeight: 800,
                    lineHeight: 1.08,
                    letterSpacing: "-0.02em",
                    mb: 4,
                  }}
                >
                  {t("title")}
                  <Box component="span" sx={{ display: "block", mt: 0.5 }}>
                    <Box
                      component="span"
                      sx={{
                        position: "relative",
                        display: "inline-block",
                        pb: "0.2em",
                      }}
                    >
                      {t("dbRelationship")}
                      <RelationshipUnderline />
                    </Box>
                  </Box>
                </Typography>

                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    mb: 5,
                    maxWidth: 520,
                    lineHeight: 1.7,
                    fontWeight: 400,
                  }}
                >
                  {t("topBodyText")}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Button
                    component={Link}
                    href={startHref}
                    variant="contained"
                    size="large"
                    endIcon={<ArrowRight size={20} />}
                    sx={{
                      bgcolor: "var(--cta-bg)",
                      color: "var(--cta-fg)",
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: "1.0625rem",
                      boxShadow: "none",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        bgcolor: "var(--cta-bg)",
                        transform: "translateY(-2px)",
                        boxShadow: 6,
                      },
                    }}
                  >
                    {t("buttonStartCreating")}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      color: "text.primary",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: "1.0625rem",
                      "&:hover": {
                        borderColor: "var(--accent)",
                        bgcolor: "background.paper",
                      },
                    }}
                  >
                    {t("buttonWatchDemo")}
                  </Button>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <HeroScene />
              </Grid>
            </Grid>
          </Container>
        </Box>
      </CustomBox>

      {/* Features: one ruled grid instead of six separate cards */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box mb={7} maxWidth={720}>
            <Typography
              variant="h3"
              fontWeight={700}
              color="text.primary"
              mb={2}
            >
              {t("featureTitle")}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              fontWeight={400}
              lineHeight={1.7}
            >
              {t("featureSubtitle")}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: "1px",
              bgcolor: "divider",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {features.map((f, i) => (
              <FeatureCell
                key={i}
                icon={f.icon}
                title={f.title}
                description={f.description}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* Benefits */}
      <Box sx={[{ py: { xs: 8, md: 12 } }, deepBand]}>
        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <Grid container spacing={{ xs: 8, lg: 10 }} alignItems="center">
            <Grid size={{ xs: 12, lg: 6 }}>
              <Typography variant="h3" fontWeight={700} mb={3}>
                {t("benefitsTitle")}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "#c7d6f5",
                  mb: 4,
                  lineHeight: 1.7,
                  fontWeight: 400,
                }}
              >
                {t("benefitsSubtitle")}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {benefits.map((benefit, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box sx={{ mt: "2px", display: "flex" }}>
                      <CheckCircle size={22} color="#4ade80" />
                    </Box>
                    <Typography variant="h6" fontWeight={500} lineHeight={1.5}>
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}
              >
                <Award size={28} color="#fbbf24" />
                <Typography
                  variant="h5"
                  fontWeight={600}
                  sx={{ color: "#dbe6ff" }}
                >
                  Trusted by Professionals
                </Typography>
              </Box>
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}
              >
                {stats.map((st) => (
                  <Box
                    key={st.label}
                    sx={{ pl: 2.5, borderLeft: "3px solid #67e8f9" }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: "2.5rem", md: "3.25rem" },
                        fontWeight: 700,
                        lineHeight: 1.1,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {st.text ?? (
                        <CountUp
                          to={st.to ?? 0}
                          decimals={st.decimals}
                          suffix={st.suffix}
                        />
                      )}
                    </Typography>
                    <Typography sx={{ color: "#c7d6f5", mt: 0.5 }}>
                      {st.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Target audience */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box mb={7} maxWidth={720}>
            <Typography
              variant="h3"
              fontWeight={700}
              color="text.primary"
              mb={2}
            >
              {t("targetAudienceTitle")}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              fontWeight={400}
              lineHeight={1.7}
            >
              {t("targetAudienceDesc")}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {audiences.map((a, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Box
                  sx={{
                    pt: 3,
                    borderTop: "3px solid",
                    borderColor: a.color,
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      mb: 2.5,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 2.5,
                      color: a.color,
                      bgcolor: `color-mix(in srgb, ${a.color} 14%, transparent)`,
                    }}
                  >
                    {a.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    mb={1.25}
                    color="textPrimary"
                  >
                    {a.title}
                  </Typography>
                  <Typography color="text.secondary" lineHeight={1.7}>
                    {a.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box mb={7} maxWidth={720}>
            <Typography
              variant="h3"
              fontWeight={700}
              color="text.primary"
              mb={2}
            >
              {t("testimonialsTitle")}
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400}>
              {t("testimonialsSubtitle")}
            </Typography>
          </Box>

          <Grid container spacing={5}>
            {testimonials.map((item, index) => (
              <Grid size={{ xs: 12, lg: 4 }} key={index}>
                <Box
                  component="figure"
                  sx={{
                    m: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    pl: 3,
                    borderLeft: "3px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    component="blockquote"
                    color="text.primary"
                    sx={{
                      m: 0,
                      mb: 3,
                      fontSize: "1.0625rem",
                      lineHeight: 1.75,
                      flex: 1,
                    }}
                  >
                    {item.quote}
                  </Typography>
                  <Box
                    component="figcaption"
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        fontWeight: 700,
                        color: "var(--accent)",
                        bgcolor:
                          "color-mix(in srgb, var(--accent) 16%, transparent)",
                      }}
                    >
                      <Typography textTransform={"uppercase"} fontWeight={600}>
                        {item.author[0]}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        lineHeight={1.3}
                        color="textPrimary"
                      >
                        {item.author}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.role}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ color: "var(--accent)" }}
                      >
                        {item.company}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Closing call to action */}
      <Box sx={[{ py: { xs: 8, md: 12 } }, deepBand]}>
        <Container maxWidth="md" sx={{ position: "relative" }}>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight={700} mb={3}>
              {t("ctaTitle")}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#c7d6f5", mb: 5, lineHeight: 1.7, fontWeight: 400 }}
            >
              {t("ctaSubtitle")}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                justifyContent: "center",
                mb: 3,
              }}
            >
              <Button
                component={Link}
                href={startHref}
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={20} />}
                sx={{
                  bgcolor: "#fff",
                  color: "#1f3560",
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: "1.0625rem",
                  boxShadow: "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    bgcolor: "#eef3ff",
                    transform: "translateY(-2px)",
                    boxShadow: 8,
                  },
                }}
              >
                {t("ctaButton")}
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.35)",
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: "1.0625rem",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                {t("buttonWatchDemo")}
              </Button>
            </Box>

            <Typography variant="body2" sx={{ color: "#c7d6f5" }}>
              {t("ctaCredit")}
            </Typography>

            <Box
              mt={3}
              sx={{ display: "flex", justifyContent: "center", gap: 3 }}
            >
              <MuiLink
                component={Link}
                href="/eula"
                underline="always"
                color="inherit"
                style={{ fontFamily: "Roboto" }}
              >
                {t("linkEula")}
              </MuiLink>
              <MuiLink
                component={Link}
                href="/privacy"
                underline="always"
                color="inherit"
                style={{ fontFamily: "Roboto" }}
              >
                {t("linkPrivacy")}
              </MuiLink>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;
