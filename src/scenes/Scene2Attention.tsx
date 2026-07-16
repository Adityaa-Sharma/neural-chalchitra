import { Reveal } from '../components/Reveal'
import { RevealTitle } from '../components/RevealTitle'
import { asset } from '../lib/asset'
import { AttentionFormula } from './scene2/AttentionFormula'
import { AttentionViz } from './scene2/AttentionViz'
import { ComplexityBars } from './scene2/ComplexityBars'
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
        <Reveal className="slate">
          <strong>Scene 02</strong> Attention · ध्यान
        </Reveal>

        <RevealTitle className="scene-title">
          Then the matrices learned where to look.
        </RevealTitle>

        <Reveal as="p" className="prose">
          In early 2025 I worked through Raschka&rsquo;s <em>LLMs from Scratch</em> — then closed
          the book and built my own. I scraped <strong>11,000 poems</strong>, wrote a character
          tokenizer, and trained a <strong>21.77M-parameter GPT-2</strong> from nothing but{' '}
          <em>Attention Is All You Need</em> and a 16&nbsp;GB T4. One equation carries the whole
          architecture — and it deserves the spotlight:
        </Reveal>

        <AttentionFormula />

        <Reveal as="p" className="prose">
          Equations are one thing. <strong>Watching a head think</strong> is another:
        </Reveal>

        <Reveal>
          <AttentionViz />
        </Reveal>

        <div className="spec-row">
          <Reveal as="figure" className="plot-card glow-card">
            <img
              src={asset('assets/gpt2/character_tokenized_model_loss.png')}
              alt="Training and validation loss of the character-level GPT-2"
              loading="lazy"
              width={3572}
              height={1900}
            />
            <figcaption>
              The actual loss curve — five epochs, lr 6·10⁻⁴, batch 64, block size 256, all of it
              in the repo.{' '}
              <a href="https://github.com/Adityaa-Sharma/GPT-2-Scratch" target="_blank" rel="noreferrer">
                GPT-2-Scratch ↗
              </a>
            </figcaption>
          </Reveal>

          <Reveal as="dl" className="spec-card glow-card" delay={0.12}>
            <div className="spec-card-title">poet.pth — model card</div>
            {GPT2_SPEC.map(([k, v]) => (
              <div className="spec-item" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </Reveal>
        </div>

        <RevealTitle className="scene-subtitle">
          Then I asked: does every token really need to greet every token?
        </RevealTitle>

        <Reveal as="p" className="prose">
          The attention you just watched is all-pairs — its cost grows with the{' '}
          <em>square</em> of the context. The <strong>Linformer</strong> paper (2020) claimed the
          heart of attention is low-rank: squeeze the keys and values through a thin bottleneck
          and pay a linear price instead. I didn&rsquo;t take the paper&rsquo;s word for it —{' '}
          <strong>I implemented it</strong>:
        </Reveal>

        <ComplexityBars />

        <div className="spec-row">
          <Reveal as="figure" className="plot-card glow-card">
            <img
              src={asset('assets/linformer/val_loss.png')}
              alt="Linformer validation loss"
              loading="lazy"
              width={1000}
              height={500}
            />
            <figcaption>Linformer validation loss — it learns.</figcaption>
          </Reveal>
          <Reveal as="figure" className="plot-card glow-card" delay={0.12}>
            <img
              src={asset('assets/linformer/loss_ratio.png')}
              alt="Loss ratio between Linformer and baseline attention"
              loading="lazy"
              width={1000}
              height={500}
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
          </Reveal>
        </div>

        <Reveal as="p" className="prose scene-beat">
          A transformer predicts the next token. <strong>What if the next prediction were an
          action?</strong>
        </Reveal>
      </div>
    </section>
  )
}
