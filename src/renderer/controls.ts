import { CanvasRenderer } from './canvas'

/**
 * adds mouse controls to the renderer:
 * - scroll to zoom
 * - drag to pan
 * - hover to highlight
 */
export function addControls(
  canvas: HTMLCanvasElement,
  renderer: CanvasRenderer,
  onHover?: (index: number | null) => void
): () => void {
  let isDragging = false
  let lastX = 0
  let lastY = 0

  function onMouseDown(e: MouseEvent) {
    isDragging = true
    lastX = e.clientX
    lastY = e.clientY
    canvas.style.cursor = 'grabbing'
  }

  function onMouseUp() {
    isDragging = false
    canvas.style.cursor = 'default'
  }

  function onMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging) {
      renderer.offsetX += e.clientX - lastX
      renderer.offsetY += e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      renderer.render()
      return
    }

    // hover detection
    const pointIdx = renderer.findPointAt(x, y)
    if (pointIdx !== renderer.hoveredPoint) {
      renderer.hoveredPoint = pointIdx
      onHover?.(pointIdx)
      renderer.render()
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1

    // zoom toward mouse position
    renderer.offsetX = mouseX - (mouseX - renderer.offsetX) * zoomFactor
    renderer.offsetY = mouseY - (mouseY - renderer.offsetY) * zoomFactor
    renderer.scale *= zoomFactor

    renderer.render()
  }

  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('mouseleave', onMouseUp)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('wheel', onWheel, { passive: false })

  // return cleanup function
  return () => {
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mouseup', onMouseUp)
    canvas.removeEventListener('mouseleave', onMouseUp)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('wheel', onWheel)
  }
}
