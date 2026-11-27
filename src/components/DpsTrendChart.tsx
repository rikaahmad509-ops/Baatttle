import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DpsSample } from '../types/game';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface DpsTrendChartProps {
  samples: DpsSample[];
  currentDps: number;
  accentColor: string;
}

type WindowSeconds = 30 | 60;

const CHART_HEIGHT = 86;
const MARGIN = { top: 8, right: 8, bottom: 20, left: 36 };

function formatCompactDps(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return `${Math.round(val)}`;
}

function formatTimeSec(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}:${rem.toString().padStart(2, '0')}` : `${rem}s`;
}

export const DpsTrendChart: React.FC<DpsTrendChartProps> = ({
  samples,
  currentDps,
  accentColor
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [windowSec, setWindowSec] = useState<WindowSeconds>(30);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(296);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const xAxisRef = useRef<SVGGElement | null>(null);
  const yAxisRef = useRef<SVGGElement | null>(null);
  const gradientId = useId().replace(/:/g, '');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const next = Math.max(220, Math.floor(el.clientWidth));
      setChartWidth(next);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isExpanded]);

  const visibleSamples = useMemo(() => {
    if (samples.length === 0) return [];
    const latestT = samples[samples.length - 1].t;
    const cutoff = latestT - windowSec;
    const sliced = samples.filter((d) => d.t >= cutoff);
    return sliced.length > 0 ? sliced : samples.slice(-2);
  }, [samples, windowSec]);

  const peakDps = useMemo(() => {
    const histMax = d3.max(visibleSamples, (d) => d.dps) ?? 0;
    return Math.max(currentDps, histMax);
  }, [visibleSamples, currentDps]);

  const avgDps = useMemo(() => {
    if (visibleSamples.length === 0) return currentDps;
    return Math.round(d3.mean(visibleSamples, (d) => d.dps) ?? 0);
  }, [visibleSamples, currentDps]);

  const innerWidth = Math.max(80, chartWidth - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(30, CHART_HEIGHT - MARGIN.top - MARGIN.bottom);

  const { xScale, yScale, linePath, areaPath, lastPoint } = useMemo(() => {
    const latestT = visibleSamples.length > 0 ? visibleSamples[visibleSamples.length - 1].t : 0;
    const firstT = visibleSamples.length > 0 ? visibleSamples[0].t : 0;
    const xMin = Math.max(0, Math.min(firstT, latestT - windowSec));
    const xMax = Math.max(xMin + 5, latestT);

    const x = d3.scaleLinear().domain([xMin, xMax]).range([0, innerWidth]);

    const rawMax = Math.max(100, (d3.max(visibleSamples, (d) => d.dps) ?? 0) * 1.15);
    const y = d3.scaleLinear().domain([0, rawMax]).nice(3).range([innerHeight, 0]);

    const lineGen = d3
      .line<DpsSample>()
      .x((d) => x(d.t))
      .y((d) => y(d.dps))
      .curve(d3.curveMonotoneX);

    const areaGen = d3
      .area<DpsSample>()
      .x((d) => x(d.t))
      .y0(innerHeight)
      .y1((d) => y(d.dps))
      .curve(d3.curveMonotoneX);

    const path = visibleSamples.length >= 2 ? lineGen(visibleSamples) ?? '' : '';
    const area = visibleSamples.length >= 2 ? areaGen(visibleSamples) ?? '' : '';
    const tail =
      visibleSamples.length > 0
        ? {
            cx: x(visibleSamples[visibleSamples.length - 1].t),
            cy: y(visibleSamples[visibleSamples.length - 1].dps)
          }
        : null;

    return { xScale: x, yScale: y, linePath: path, areaPath: area, lastPoint: tail };
  }, [visibleSamples, windowSec, innerWidth, innerHeight]);

  // Render D3 axes cleanly into SVG axis groups
  useEffect(() => {
    if (!isExpanded) return;

    if (yAxisRef.current) {
      const yAxis = d3
        .axisLeft(yScale)
        .ticks(3)
        .tickSize(-innerWidth)
        .tickFormat((d) => formatCompactDps(Number(d)));

      const g = d3.select(yAxisRef.current);
      g.call(yAxis);
      g.select('.domain').remove();
      g.selectAll('.tick line')
        .attr('stroke', 'rgba(148, 163, 184, 0.12)')
        .attr('stroke-dasharray', '2,3');
      g.selectAll('.tick text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
        .attr('dx', '-3');
    }

    if (xAxisRef.current) {
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(4)
        .tickSize(3)
        .tickFormat((d) => formatTimeSec(Number(d)));

      const g = d3.select(xAxisRef.current);
      g.call(xAxis);
      g.select('.domain').attr('stroke', 'rgba(148, 163, 184, 0.25)');
      g.selectAll('.tick line').attr('stroke', 'rgba(148, 163, 184, 0.25)');
      g.selectAll('.tick text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace');
    }
  }, [isExpanded, xScale, yScale, innerWidth]);

  const bisectTime = useMemo(() => d3.bisector<DpsSample, number>((d) => d.t).center, []);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (visibleSamples.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left - MARGIN.left;
    const clampedX = Math.max(0, Math.min(innerWidth, localX));
    const hoveredT = xScale.invert(clampedX);
    const idx = bisectTime(visibleSamples, hoveredT);
    setHoverIndex(Math.max(0, Math.min(visibleSamples.length - 1, idx)));
  };

  const hoveredSample =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < visibleSamples.length
      ? visibleSamples[hoverIndex]
      : null;

  const avgY = yScale(avgDps);
  const strokeColor = accentColor || '#f59e0b';

  return (
    <div className="pointer-events-auto bg-slate-950/92 border border-slate-800 rounded-xl shadow-xl w-[276px] sm:w-[328px] overflow-hidden">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-3.5 h-3.5 shrink-0" style={{ color: strokeColor }} />
          <span className="text-[11px] font-title font-bold text-slate-200 whitespace-nowrap">
            DPS Trend
          </span>
          <span className="text-[11px] font-mono font-bold text-amber-400 tabular-nums whitespace-nowrap">
            {currentDps.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isExpanded && (
            <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-800">
              {([30, 60] as WindowSeconds[]).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setWindowSec(sec)}
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ${
                    windowSec === sec
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isExpanded ? 'Sembunyikan grafik DPS' : 'Tampilkan grafik DPS'}
            aria-label={isExpanded ? 'Collapse DPS trend chart' : 'Expand DPS trend chart'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Chart Body */}
      {isExpanded && (
        <div className="px-2.5 pt-1.5 pb-2">
          {/* Summary Metrics Strip */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 px-0.5 tabular-nums">
            <span>
              Peak <strong className="text-slate-100">{formatCompactDps(peakDps)}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span>
              Avg <strong className="text-cyan-300">{formatCompactDps(avgDps)}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-300">
              {hoveredSample
                ? `${formatTimeSec(hoveredSample.t)} · ${hoveredSample.dps.toLocaleString()}`
                : `${windowSec}s window`}
            </span>
          </div>

          <div ref={containerRef} className="w-full relative">
            {visibleSamples.length < 2 ? (
              <div
                className="flex items-center justify-center text-[11px] font-mono text-slate-500 border border-dashed border-slate-800 rounded-lg"
                style={{ height: `${CHART_HEIGHT}px` }}
              >
                Mengumpulkan data DPS pertempuran...
              </div>
            ) : (
              <svg
                width={chartWidth}
                height={CHART_HEIGHT}
                role="img"
                aria-label="Live player DPS trend line chart"
                className="block overflow-visible select-none cursor-crosshair"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoverIndex(null)}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.34} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                  {/* D3 Y Axis & Horizontal Grid */}
                  <g ref={yAxisRef} />

                  {/* D3 X Axis */}
                  <g ref={xAxisRef} transform={`translate(0,${innerHeight})`} />

                  {/* Area under curve */}
                  {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

                  {/* Average DPS Reference Line */}
                  {avgDps > 0 && Number.isFinite(avgY) && (
                    <g>
                      <line
                        x1={0}
                        x2={innerWidth}
                        y1={avgY}
                        y2={avgY}
                        stroke="#22d3ee"
                        strokeOpacity={0.45}
                        strokeWidth={1}
                        strokeDasharray="3,3"
                      />
                      <text
                        x={innerWidth - 2}
                        y={Math.max(8, avgY - 3)}
                        textAnchor="end"
                        fill="#67e8f9"
                        fontSize="8px"
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                      >
                        Avg
                      </text>
                    </g>
                  )}

                  {/* Main DPS Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Latest Sample Endpoint Marker */}
                  {lastPoint && !hoveredSample && (
                    <circle
                      cx={lastPoint.cx}
                      cy={lastPoint.cy}
                      r={3}
                      fill={strokeColor}
                      stroke="#020617"
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Interactive Hover Crosshair */}
                  {hoveredSample && (
                    <g>
                      <line
                        x1={xScale(hoveredSample.t)}
                        x2={xScale(hoveredSample.t)}
                        y1={0}
                        y2={innerHeight}
                        stroke="rgba(226, 232, 240, 0.45)"
                        strokeWidth={1}
                        strokeDasharray="2,2"
                      />
                      <circle
                        cx={xScale(hoveredSample.t)}
                        cy={yScale(hoveredSample.dps)}
                        r={3.5}
                        fill="#f8fafc"
                        stroke={strokeColor}
                        strokeWidth={2}
                      />
                    </g>
                  )}
                </g>
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
