export class Tooltip {
  private element: HTMLElement

  constructor() {
    this.element = document.getElementById('tooltip')!
  }

  show(x: number, y: number, content: string): void {
    this.element.innerHTML = content
    this.element.style.display = 'block'
    this.element.style.left = `${x + 15}px`
    this.element.style.top = `${y - 10}px`
  }

  hide(): void {
    this.element.style.display = 'none'
  }
}
