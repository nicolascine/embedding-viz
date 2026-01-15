import { Point2D } from '../projections/pca'

export interface RenderOptions {
  pointSize?: number
  pointColor?: string | ((index: number) => string)
  backgroundColor?: string
  showLabels?: boolean
  labels?: string[]
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private points: Point2D[] = []
  private options: RenderOptions

  // transform state
  public offsetX = 0
  public offsetY = 0
  public scale = 1

  // hover state
  public hoveredPoint: number | null = null

  constructor(canvas: HTMLCanvasElement, options: RenderOptions = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.options = {
      pointSize: 4,
      pointColor: '#8b5cf6',
      backgroundColor: '#0a0a0f',
      showLabels: false,
      ...options,
    }
  }

  setPoints(points: Point2D[]): void {
    this.points = points
    this.autoFit()
  }

  private autoFit(): void {
    if (this.points.length === 0) return

    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    for (const p of this.points) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const padding = 50

    this.scale = Math.min(
      (this.canvas.width - padding * 2) / rangeX,
      (this.canvas.height - padding * 2) / rangeY
    )

    this.offsetX = this.canvas.width / 2 - (minX + rangeX / 2) * this.scale
    this.offsetY = this.canvas.height / 2 - (minY + rangeY / 2) * this.scale
  }

  render(): void {
    const { ctx, canvas, points, options } = this

    // clear
    ctx.fillStyle = options.backgroundColor!
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (points.length === 0) {
      ctx.fillStyle = '#444'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No data loaded', canvas.width / 2, canvas.height / 2)
      return
    }

    // draw points
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const sx = p.x * this.scale + this.offsetX
      const sy = p.y * this.scale + this.offsetY

      // skip offscreen points
      if (sx < -10 || sx > canvas.width + 10 || sy < -10 || sy > canvas.height + 10) {
        continue
      }

      const isHovered = this.hoveredPoint === i
      const size = isHovered ? (options.pointSize! * 2) : options.pointSize!

      ctx.beginPath()
      ctx.arc(sx, sy, size, 0, Math.PI * 2)

      if (typeof options.pointColor === 'function') {
        ctx.fillStyle = options.pointColor(i)
      } else {
        ctx.fillStyle = isHovered ? '#a78bfa' : options.pointColor!
      }

      ctx.fill()

      // label
      if (options.showLabels && options.labels && options.labels[i]) {
        ctx.fillStyle = '#888'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(options.labels[i], sx + size + 3, sy + 4)
      }
    }

    // draw info
    ctx.fillStyle = '#333'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${points.length} points | zoom: ${this.scale.toFixed(1)}x`, 10, canvas.height - 10)
  }

  // find point near screen coordinates
  findPointAt(screenX: number, screenY: number, radius = 10): number | null {
    let closest: number | null = null
    let minDist = radius * radius

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i]
      const sx = p.x * this.scale + this.offsetX
      const sy = p.y * this.scale + this.offsetY

      const dx = screenX - sx
      const dy = screenY - sy
      const dist = dx * dx + dy * dy

      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    }

    return closest
  }
}
