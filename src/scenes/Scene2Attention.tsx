import { Eq } from '../components/Eq'
import { asset } from '../lib/asset'
import { AttentionFormula } from './scene2/AttentionFormula'
import { AttentionViz } from './scene2/AttentionViz'
import './Scene2Attention.css'

const GPT2_SPEC = [
  ['parameters', '21.77M'],
  ['layers × heads', '12 × 12'],
  ['embedding dim', '768'],
  ['tokenization', 'character (vocab 202)'],
  ['dataset', '11,000+ poems · ~800 poets'],
  ['hardware', 'single 16 GB T4, CUDA'],
] as const

export function Scene2Attention() {
  return (
    <section className="scene" id="attention">
      <div className="scene-inner">
        <div className="slate">
          <strong>Scene 02</strong> Attention · ध्यान
        </div>

        <h2 className="scene-title">Then the matrices learned where to look.</h2>

        <p className="prose">
          In early 2025 I worked through Raschka&rsquo;s <em>LLMs from Scratch</em> — then closed
          the book and built my own. I scraped <strong>11,000 poems</strong>, wrote a character
          tokenizer, and trained a <strong>21.77M-parameter GPT-2</strong> from nothing but{' '}
          <em>Attention Is All You Need</em> and a 16&nbsp;GB T4. One equation carries the whole
          architecture:
        </p>

        <AttentionFormula />

        <p className="prose">
          Equations are one thing. <strong>Watching a head think</strong> is another:
        </p>

        <AttentionViz />

        <div className="spec-row">
          <figure className="plot-card">
            <img
              src={asset('assets/gpt2/character_tokenized_model_loss.png')}
              alt="Training and validation loss of the character-level GPT-2"
              loading="lazy"
            />
            <figcaption>
              The actual loss curve — five epochs, lr 6·10⁻⁴, batch 64, block size 256, all of it
              in the repo.{' '}
              <a href="https://github.com/Adityaa-Sharma/GPT-2-Scratch" target="_blank" rel="noreferrer">
                GPT-2-Scratch ↗
              </a>
            </figcaption>
          </figure>

          <dl className="spec-card">
            <div className="spec-card-title">poet.pth — model card</div>
            {GPT2_SPEC.map(([k, v]) => (
              <div className="spec-item" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <h3 className="scene-subtitle">Then I asked: is N² even necessary?</h3>

        <p className="prose">
          That <Eq tex="QK^{\top}" /> handshake costs <Eq tex="O(N^2)" /> — every token greets
          every token. The <strong>Linformer</strong> paper (2020) claims attention&rsquo;s heart
          is low-rank: project keys and values through thin matrices <Eq tex="E, F" /> and pay
          only <Eq tex="O(N)" />. I didn&rsquo;t take the paper&rsquo;s word for it —{' '}
          <strong>I implemented it</strong>:
        </p>

        <div className="linformer-eqs">
          <div>
            <Eq display tex="\operatorname{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V" />
            <span className="eq-tag eq-tag-n2">O(N²) — the original</span>
          </div>
          <div>
            <Eq display tex="\operatorname{softmax}\!\left(\frac{Q\,(EK)^{\top}}{\sqrt{d_k}}\right)(FV)" />
            <span className="eq-tag eq-tag-n">O(N) — Linformer</span>
          </div>
        </div>

        <div className="spec-row">
          <figure className="plot-card">
            <img
              src={asset('assets/linformer/val_loss.png')}
              alt="Linformer validation loss"
              loading="lazy"
            />
            <figcaption>Linformer validation loss — it learns.</figcaption>
          </figure>
          <figure className="plot-card">
            <img
              src={asset('assets/linformer/loss_ratio.png')}
              alt="Loss ratio between Linformer and baseline attention"
              loading="lazy"
            />
            <figcaption>
              …and the ratio against full attention tells the honest story.{' '}
              <a
                href="https://github.com/Adityaa-Sharma/Linformer-paper-implemetation"
                target="_blank"
                rel="noreferrer"
              >
                Linformer implementation ↗
              </a>
            </figcaption>
          </figure>
        </div>

        <p className="prose scene-beat">
          A transformer predicts the next token. <strong>What if the next prediction were an
          action?</strong>
        </p>
      </div>
    </section>
  )
}
