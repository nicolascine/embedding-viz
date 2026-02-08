# embedding-viz

Interactive visualization of embedding spaces in the browser. Load high-dimensional embeddings, project them to 2D using PCA or t-SNE, explore with pan/zoom/hover.

## Why

I kept wanting to quickly visualize embeddings while working on semantic search and RAG projects. Existing tools either need Python (matplotlib, plotly) or are heavy web apps. I just wanted to paste some vectors and see them.

## Features

- PCA and t-SNE projection (pure JS, no dependencies)
- Canvas-based renderer with pan, zoom, hover
- Color coding by cluster/label
- Load from JSON or generate demo data
- Works with any dimensionality

## Run

```bash
npm install
npm run dev
```

## Data format

JSON file with array of objects:

```json
[
  { "label": "cat", "vector": [0.1, 0.2, ...] },
  { "label": "dog", "vector": [0.15, 0.18, ...] }
]
```

Or the simple format:

```json
{
  "labels": ["cat", "dog"],
  "vectors": [[0.1, 0.2], [0.15, 0.18]]
}
```

## Technical notes

The t-SNE implementation is a basic O(n²) version. It works fine for up to ~2000 points. For larger datasets, you'd want Barnes-Hut approximation or use UMAP instead. PCA uses power iteration which is fast but approximate.

Both implementations are from scratch - no external dependencies. I wanted to understand the math, not just import a library.

## Controls

- Scroll to zoom
- Drag to pan
- Hover to see point labels

## TODO

- [ ] UMAP projection
- [ ] 3D mode with WebGL
- [ ] Color by arbitrary metadata field
- [ ] Export as SVG/PNG
- [ ] Real embeddings via transformers.js

## License

MIT
