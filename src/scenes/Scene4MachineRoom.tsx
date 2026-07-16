import { TypedTerminal } from './scene4/TypedTerminal'
import { KVCachePager } from './scene4/KVCachePager'
import './Scene4MachineRoom.css'

export function Scene4MachineRoom() {
  return (
    <section className="scene" id="machine-room">
      <div className="scene-inner">
        <div className="slate">
          <strong>Scene 04</strong> The Machine Room · यंत्रशाला
        </div>

        <h2 className="scene-title">Where the ghosts get their hardware.</h2>

        <p className="prose">
          At <strong>Datasmith.ai</strong> I shipped the thing every earlier scene was practice
          for: <strong>MHADA-Sathi</strong>, the Government of Maharashtra&rsquo;s multilingual
          agentic chatbot — live at{' '}
          <a href="https://mhada.gov.in/en" target="_blank" rel="noreferrer">
            mhada.gov.in
          </a>
          . I did the GPU capacity planning myself — KV-cache footprint, time-to-first-token,
          tokens-per-second — and defended the numbers that got <strong>4×A100 80GB</strong>{' '}
          approved. Then made them earn it:
        </p>

        <TypedTerminal />

        <p className="prose">
          Chat, vision, speech-to-text and TTS — <strong>four model families on one box</strong>,
          served with vLLM behind network-level routing, for 100+ concurrent users. The reason
          that arithmetic works at all is one beautiful systems idea:
        </p>

        <KVCachePager />

        <div className="infra-cards">
          <a
            className="infra-card"
            href="https://github.com/Adityaa-Sharma/InfraMind"
            target="_blank"
            rel="noreferrer"
          >
            <span className="infra-card-name">InfraMind</span>
            <span className="infra-card-desc">
              Kubernetes-native AIOps copilot: builds a live service-dependency graph, scores
              holistic health, and runs causal root-cause analysis with AI agents — observe,
              approve, or auto-remediate.
            </span>
            <span className="infra-card-stack">k8s · helm · prometheus · loki · multi-agent</span>
          </a>
          <div className="infra-card infra-card-static">
            <span className="infra-card-name">still going down the stack</span>
            <span className="infra-card-desc">
              Hand-written CUDA kernels (matrix multiply and counting), KinD clusters for K8s
              practice, and reading the vLLM codebase — presented honestly: study, not yet
              contribution.
            </span>
            <span className="infra-card-stack">cuda c++ · kind · vllm internals · ray (next)</span>
          </div>
        </div>

        <p className="prose scene-beat">
          The math never left. The plane became embeddings, the eigenvectors became attention,
          the Q-values became decisions — and now they run with{' '}
          <strong>320&nbsp;GB of HBM under their feet</strong>, answering citizens in Marathi.
        </p>
      </div>
    </section>
  )
}
