/**
 * simplified t-SNE implementation
 * based on the original paper by van der Maaten & Hinton
 *
 * this is a basic version - for production use you'd want
 * barnes-hut approximation for O(n log n) instead of O(n^2)
 */

import { Point2D } from './pca'

export interface TSNEOptions {
  perplexity?: number
  learningRate?: number
  iterations?: number
  onProgress?: (iter: number, cost: number) => void
}

export function tsne(data: number[][], options: TSNEOptions = {}): Point2D[] {
  const {
    perplexity = 30,
    learningRate = 200,
    iterations = 500,
    onProgress,
  } = options

  const n = data.length

  if (n < 3) {
    // too few points for tsne, just return random layout
    return data.map((_, i) => ({ x: Math.random(), y: Math.random(), index: i }))
  }

  // clamp perplexity to reasonable range for dataset size
  const effectivePerplexity = Math.min(perplexity, Math.floor(n / 3))

  // compute pairwise distances
  const distances = computeDistances(data)

  // compute joint probabilities
  const P = computeJointProbabilities(distances, effectivePerplexity)

  // initialize embedding randomly
  const Y: number[][] = Array.from({ length: n }, () => [
    (Math.random() - 0.5) * 0.01,
    (Math.random() - 0.5) * 0.01,
  ])

  // gradient descent
  const gains = Array.from({ length: n }, () => [1, 1])
  const velocities = Array.from({ length: n }, () => [0, 0])
  const momentum = 0.5

  for (let iter = 0; iter < iterations; iter++) {
    // compute Q distribution (student-t)
    const { Q, qSum } = computeQ(Y)

    // compute gradients
    const grad = computeGradient(P, Q, Y, qSum)

    // update with momentum
    const currentMomentum = iter < 250 ? 0.5 : 0.8

    for (let i = 0; i < n; i++) {
      for (let d = 0; d < 2; d++) {
        // adaptive gains
        const sameSign = (grad[i][d] > 0) === (velocities[i][d] > 0)
        gains[i][d] = sameSign ? gains[i][d] * 0.8 : gains[i][d] + 0.2
        gains[i][d] = Math.max(gains[i][d], 0.01)

        velocities[i][d] = currentMomentum * velocities[i][d] - learningRate * gains[i][d] * grad[i][d]
        Y[i][d] += velocities[i][d]
      }
    }

    // center
    const meanY = [0, 0]
    for (const y of Y) {
      meanY[0] += y[0] / n
      meanY[1] += y[1] / n
    }
    for (const y of Y) {
      y[0] -= meanY[0]
      y[1] -= meanY[1]
    }

    if (onProgress && iter % 50 === 0) {
      onProgress(iter, computeKL(P, Q))
    }
  }

  return Y.map((y, i) => ({ x: y[0], y: y[1], index: i }))
}

function computeDistances(data: number[][]): number[][] {
  const n = data.length
  const dist = Array.from({ length: n }, () => new Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let d = 0
      for (let k = 0; k < data[i].length; k++) {
        const diff = data[i][k] - data[j][k]
        d += diff * diff
      }
      dist[i][j] = d
      dist[j][i] = d
    }
  }

  return dist
}

function computeJointProbabilities(distances: number[][], perplexity: number): number[][] {
  const n = distances.length
  const P = Array.from({ length: n }, () => new Array(n).fill(0))

  // binary search for sigma per point
  for (let i = 0; i < n; i++) {
    let lo = 0.01, hi = 100, sigma = 1

    for (let iter = 0; iter < 50; iter++) {
      sigma = (lo + hi) / 2

      let sumP = 0
      for (let j = 0; j < n; j++) {
        if (i === j) continue
        P[i][j] = Math.exp(-distances[i][j] / (2 * sigma * sigma))
        sumP += P[i][j]
      }

      // compute entropy
      let H = 0
      for (let j = 0; j < n; j++) {
        if (i === j) continue
        P[i][j] /= sumP
        if (P[i][j] > 1e-10) {
          H -= P[i][j] * Math.log2(P[i][j])
        }
      }

      const currentPerp = Math.pow(2, H)
      if (currentPerp > perplexity) hi = sigma
      else lo = sigma
    }
  }

  // symmetrize
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const val = (P[i][j] + P[j][i]) / (2 * n)
      P[i][j] = val
      P[j][i] = val
    }
  }

  return P
}

function computeQ(Y: number[][]): { Q: number[][], qSum: number } {
  const n = Y.length
  const Q = Array.from({ length: n }, () => new Array(n).fill(0))
  let qSum = 0

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = Y[i][0] - Y[j][0]
      const dy = Y[i][1] - Y[j][1]
      const dist = 1 / (1 + dx * dx + dy * dy) // student-t kernel
      Q[i][j] = dist
      Q[j][i] = dist
      qSum += 2 * dist
    }
  }

  // normalize
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Q[i][j] /= qSum
    }
  }

  return { Q, qSum }
}

function computeGradient(P: number[][], Q: number[][], Y: number[][], qSum: number): number[][] {
  const n = Y.length
  const grad = Array.from({ length: n }, () => [0, 0])

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue

      const dx = Y[i][0] - Y[j][0]
      const dy = Y[i][1] - Y[j][1]
      const dist = 1 + dx * dx + dy * dy

      const mult = 4 * (P[i][j] - Q[i][j]) / dist
      grad[i][0] += mult * dx
      grad[i][1] += mult * dy
    }
  }

  return grad
}

function computeKL(P: number[][], Q: number[][]): number {
  let kl = 0
  for (let i = 0; i < P.length; i++) {
    for (let j = 0; j < P.length; j++) {
      if (P[i][j] > 1e-10 && Q[i][j] > 1e-10) {
        kl += P[i][j] * Math.log(P[i][j] / Q[i][j])
      }
    }
  }
  return kl
}
