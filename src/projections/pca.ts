/**
 * simple PCA implementation for dimensionality reduction
 * reduces high-dim embeddings to 2D for visualization
 *
 * not the most efficient but works fine for <10k points
 */

export interface Point2D {
  x: number
  y: number
  index: number
}

export function pca(data: number[][], dimensions = 2): Point2D[] {
  const n = data.length
  const d = data[0].length

  // center the data
  const mean = new Array(d).fill(0)
  for (const row of data) {
    for (let j = 0; j < d; j++) {
      mean[j] += row[j] / n
    }
  }

  const centered = data.map(row =>
    row.map((val, j) => val - mean[j])
  )

  // compute covariance matrix
  // (simplified - using power iteration instead of full eigen decomposition)
  const components: number[][] = []
  let residual = centered.map(r => [...r])

  for (let comp = 0; comp < dimensions; comp++) {
    const eigenvector = powerIteration(residual, d)
    components.push(eigenvector)

    // deflate - remove this component's contribution
    residual = residual.map(row => {
      const proj = dot(row, eigenvector)
      return row.map((val, j) => val - proj * eigenvector[j])
    })
  }

  // project data onto components
  return centered.map((row, i) => ({
    x: dot(row, components[0]),
    y: dimensions > 1 ? dot(row, components[1]) : 0,
    index: i,
  }))
}

function powerIteration(data: number[][], dims: number, iterations = 100): number[] {
  // random initial vector
  let v = Array.from({ length: dims }, () => Math.random() - 0.5)
  let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
  v = v.map(x => x / norm)

  for (let iter = 0; iter < iterations; iter++) {
    // multiply by covariance: X^T * X * v
    const projected = data.map(row => dot(row, v))
    const newV = new Array(dims).fill(0)

    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < dims; j++) {
        newV[j] += data[i][j] * projected[i]
      }
    }

    norm = Math.sqrt(newV.reduce((s, x) => s + x * x, 0))
    v = newV.map(x => x / norm)
  }

  return v
}

function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}
