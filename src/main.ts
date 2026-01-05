// embedding-viz - visualize embedding spaces in the browser
console.log('embedding-viz loading...')

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const container = document.getElementById('canvas-container') as HTMLElement

function resize() {
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
}

window.addEventListener('resize', resize)
resize()

const ctx = canvas.getContext('2d')!
ctx.fillStyle = '#8b5cf6'
ctx.font = '16px sans-serif'
ctx.fillText('Loading...', canvas.width / 2 - 30, canvas.height / 2)
