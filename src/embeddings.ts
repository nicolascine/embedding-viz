/**
 * handles loading and generating embeddings
 * supports: loading from JSON, generating random (for demo), loading from text
 */

export interface EmbeddingData {
  vectors: number[][]
  labels: string[]
  metadata?: Record<string, any>[]
  dimensions: number
}

export async function loadFromJSON(url: string): Promise<EmbeddingData> {
  const response = await fetch(url)
  const data = await response.json()

  // support different formats
  if (Array.isArray(data) && data[0]?.vector) {
    // format: [{ label, vector, ...metadata }]
    return {
      vectors: data.map(d => d.vector),
      labels: data.map(d => d.label || d.text || `point-${data.indexOf(d)}`),
      metadata: data.map(d => {
        const { vector, label, ...rest } = d
        return rest
      }),
      dimensions: data[0].vector.length,
    }
  }

  if (data.vectors && data.labels) {
    // format: { vectors: [][], labels: [] }
    return {
      vectors: data.vectors,
      labels: data.labels,
      dimensions: data.vectors[0]?.length || 0,
    }
  }

  throw new Error('Unsupported embedding format')
}

export function generateRandom(n: number, dims: number, clusters = 5): EmbeddingData {
  const vectors: number[][] = []
  const labels: string[] = []

  // generate clustered random embeddings
  const centers = Array.from({ length: clusters }, () =>
    Array.from({ length: dims }, () => (Math.random() - 0.5) * 10)
  )

  const clusterNames = ['science', 'technology', 'nature', 'art', 'history']

  for (let i = 0; i < n; i++) {
    const cluster = i % clusters
    const center = centers[cluster]
    const vector = center.map(c => c + (Math.random() - 0.5) * 2)
    vectors.push(vector)
    labels.push(`${clusterNames[cluster] || 'cluster-' + cluster}_${Math.floor(i / clusters)}`)
  }

  return { vectors, labels, dimensions: dims }
}

/**
 * generate embeddings from text using a simple bag-of-characters approach
 * not real embeddings but useful for demo/testing
 */
export function textToEmbedding(texts: string[], dims = 64): EmbeddingData {
  const vectors = texts.map(text => {
    // simple hash-based embedding (not real embeddings obviously)
    const vec = new Array(dims).fill(0)
    for (let i = 0; i < text.length; i++) {
      const idx = (text.charCodeAt(i) * 31 + i * 17) % dims
      vec[idx] += 1
    }
    // normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
    return vec.map(v => v / norm)
  })

  return {
    vectors,
    labels: texts.map(t => t.slice(0, 30)),
    dimensions: dims,
  }
}
