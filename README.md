# embedding-viz

Visualize embedding spaces in the browser. Drop in some vectors, see clusters.

I kept opening Python notebooks just to make a quick scatter plot of embeddings while working on search stuff. Got tired of context-switching, so I built this — runs entirely in the browser, no backend needed.

### how to use

```
npm install
npm run dev
```

Click "Load Demo Data" to see some clustered random embeddings, or load your own JSON file.

### data format

Array of objects with `label` and `vector`:

```json
[
  { "label": "cat", "vector": [0.1, 0.2, 0.3, ...] },
  { "label": "dog", "vector": [0.15, 0.22, 0.28, ...] }
]
```

Works with any dimensionality. Tested up to 1536 (OpenAI ada-002 embeddings).

### projections

**PCA** — fast, deterministic. Good for getting a quick overview. Uses power iteration (my own implementation, not a library).

**t-SNE** — slower but shows local structure better. This is a basic O(n²) implementation so it starts lagging above ~2000 points. For larger datasets you'd want Barnes-Hut or UMAP.

Both algorithms are implemented from scratch. I wanted to understand the math, not just call a function.

### controls

- scroll to zoom
- drag to pan
- hover to see labels
- sidebar to switch projection and tweak params

### notes

the t-SNE perplexity parameter matters a lot. Low values (~5) show tight local clusters. High values (~50) show more global structure. Default is 30 which works ok for most cases.

colors are auto-assigned based on label prefix (everything before the first underscore). so if your labels are `animals_cat`, `animals_dog`, `vehicles_car`, the animals and vehicles groups get different colors.
