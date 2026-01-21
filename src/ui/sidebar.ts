export interface SidebarOptions {
  onMethodChange: (method: 'pca' | 'tsne') => void
  onPerplexityChange: (value: number) => void
  onPointSizeChange: (value: number) => void
  onLoadDemo: () => void
  onLoadFile: (file: File) => void
}

export function createSidebar(container: HTMLElement, options: SidebarOptions): void {
  container.innerHTML = `
    <h1>Embedding Viz</h1>

    <div class="control-group">
      <label>Projection Method</label>
      <select id="method">
        <option value="pca">PCA</option>
        <option value="tsne">t-SNE</option>
      </select>
    </div>

    <div class="control-group" id="tsne-controls" style="display:none">
      <label>Perplexity: <span id="perp-value">30</span></label>
      <input type="range" id="perplexity" min="5" max="100" value="30" />
    </div>

    <div class="control-group">
      <label>Point Size: <span id="size-value">4</span></label>
      <input type="range" id="point-size" min="1" max="12" value="4" />
    </div>

    <div class="control-group">
      <button id="load-demo" style="
        width: 100%;
        padding: 8px;
        background: #8b5cf6;
        border: none;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      ">Load Demo Data</button>
    </div>

    <div class="control-group">
      <label>Or load JSON file</label>
      <input type="file" id="file-input" accept=".json" style="font-size: 12px;" />
    </div>

    <div class="stats" id="stats">
      No data loaded
    </div>
  `

  // wire up events
  const method = container.querySelector('#method') as HTMLSelectElement
  method.addEventListener('change', () => {
    options.onMethodChange(method.value as 'pca' | 'tsne')
    const tsneControls = container.querySelector('#tsne-controls') as HTMLElement
    tsneControls.style.display = method.value === 'tsne' ? 'block' : 'none'
  })

  const perplexity = container.querySelector('#perplexity') as HTMLInputElement
  perplexity.addEventListener('input', () => {
    container.querySelector('#perp-value')!.textContent = perplexity.value
    options.onPerplexityChange(parseInt(perplexity.value))
  })

  const pointSize = container.querySelector('#point-size') as HTMLInputElement
  pointSize.addEventListener('input', () => {
    container.querySelector('#size-value')!.textContent = pointSize.value
    options.onPointSizeChange(parseInt(pointSize.value))
  })

  container.querySelector('#load-demo')!.addEventListener('click', options.onLoadDemo)

  const fileInput = container.querySelector('#file-input') as HTMLInputElement
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) {
      options.onLoadFile(fileInput.files[0])
    }
  })
}

export function updateStats(container: HTMLElement, stats: { points: number, dims: number, method: string }) {
  const el = container.querySelector('#stats')!
  el.innerHTML = `
    Points: ${stats.points}<br>
    Dimensions: ${stats.dims}<br>
    Method: ${stats.method}
  `
}
