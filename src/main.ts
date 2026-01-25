import { CanvasRenderer } from './renderer/canvas'
import { addControls } from './renderer/controls'
import { pca } from './projections/pca'
import { tsne } from './projections/tsne'
import { generateRandom, loadFromJSON, EmbeddingData, textToEmbedding } from './embeddings'
import { createSidebar, updateStats } from './ui/sidebar'
import { Tooltip } from './ui/tooltip'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const container = document.getElementById('canvas-container') as HTMLElement
const sidebarEl = document.getElementById('sidebar') as HTMLElement

// state
let currentData: EmbeddingData | null = null
let currentMethod: 'pca' | 'tsne' = 'pca'
let perplexity = 30
let pointSize = 4

// renderer
const renderer = new CanvasRenderer(canvas, {
  pointSize,
  pointColor: (i) => {
    // color by cluster (derived from label prefix)
    if (!currentData) return '#8b5cf6'
    const label = currentData.labels[i] || ''
    const hash = label.split('_')[0].split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 60%)`
  },
})

const tooltip = new Tooltip()

// controls
addControls(canvas, renderer, (idx) => {
  if (idx !== null && currentData) {
    const rect = canvas.getBoundingClientRect()
    const label = currentData.labels[idx]
    const meta = currentData.metadata?.[idx]
    let content = `<strong>${label}</strong>`
    if (meta) {
      content += '<br>' + Object.entries(meta)
        .slice(0, 3) // max 3 metadata fields
        .map(([k, v]) => `${k}: ${v}`)
        .join('<br>')
    }
    // approximate screen position
    const p = renderer.findPointAt(0, 0) // this is hacky, should store screen coords
    tooltip.show(rect.left + 100, rect.top + 100, content)
  } else {
    tooltip.hide()
  }
})

// sidebar
createSidebar(sidebarEl, {
  onMethodChange: (method) => {
    currentMethod = method
    if (currentData) project()
  },
  onPerplexityChange: (val) => {
    perplexity = val
    if (currentData && currentMethod === 'tsne') project()
  },
  onPointSizeChange: (val) => {
    pointSize = val
    renderer['options'].pointSize = val
    renderer.render()
  },
  onLoadDemo: () => {
    currentData = generateRandom(200, 50, 5)
    project()
  },
  onLoadFile: async (file) => {
    const text = await file.text()
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    currentData = await loadFromJSON(url)
    URL.revokeObjectURL(url)
    project()
  },
})

function project() {
  if (!currentData) return

  let points
  if (currentMethod === 'tsne') {
    points = tsne(currentData.vectors, {
      perplexity,
      iterations: 300,
      onProgress: (iter, cost) => console.log(`t-SNE iter ${iter}, cost: ${cost.toFixed(4)}`),
    })
  } else {
    points = pca(currentData.vectors)
  }

  renderer.setPoints(points)
  renderer['options'].labels = currentData.labels
  renderer.render()

  updateStats(sidebarEl, {
    points: currentData.vectors.length,
    dims: currentData.dimensions,
    method: currentMethod.toUpperCase(),
  })
}

// resize handling
function resize() {
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
  renderer.render()
}

window.addEventListener('resize', resize)
resize()
