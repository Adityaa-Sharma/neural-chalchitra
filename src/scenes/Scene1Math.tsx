import { EigenExplorer } from './scene1/EigenExplorer'
import { GridMorph } from './scene1/GridMorph'
import './Scene1Math.css'

export function Scene1Math() {
  return (
    <section className="scene" id="mathematics">
      <div className="scene-inner">
        <div className="slate">
          <strong>Scene 01</strong> Mathematics · गणित
        </div>

        <h2 className="scene-title">Before the models, there was the plane.</h2>

        <p className="prose">
          I didn&rsquo;t start with PyTorch. I started with a <strong>B.S. (Honors) in
          Mathematics</strong> — three years of real analysis, linear algebra, and probability at
          Rajasthan University, before a single line of ML code. Everything I&rsquo;ve built since
          runs on what happens in this coordinate system.
        </p>

        <EigenExplorer />

        <p className="prose">
          That stubbornness — a direction that transformation cannot turn, only stretch — is not a
          party trick. It is PCA. It is the stability of gradient descent. It is why some
          directions in a loss landscape are easy and others are hard. And when a matrix acts on{' '}
          <em>every</em> vector at once, it doesn&rsquo;t move points around the grid — it moves{' '}
          <em>the grid</em>:
        </p>

        <GridMorph />

        <p className="prose scene-beat">
          Hold that gold vector in your mind. In the next scene it gets a name —{' '}
          <strong>a token embedding</strong> — and the matrices learn what to do with it.
        </p>
      </div>
    </section>
  )
}
