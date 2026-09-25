import Link from "next/link";

import { ArrowRight } from "@/components/site/icons";
import { Topo } from "@/components/site/Topo";

export default function ClosingCTA() {
  return (
    <section
      aria-labelledby="closing-title"
      className="avs-on-dark avs-grain relative isolate overflow-hidden text-[rgb(var(--av-paper))]"
      style={{ background: "linear-gradient(180deg, #0B1B35 0%, #1E2A3A 32%, #4C4331 62%, #5E5033 74%, #1C2417 100%)" }}
    >
      <Topo lines={18} seed={9} stroke="#E4CFA2" opacity={0.1} className="-z-10" />
      <div className="avs-container flex min-h-[480px] flex-col items-center justify-center py-24 text-center md:min-h-[560px]">
        <h2 id="closing-title" className="avs-display avs-reveal max-w-[14ch] text-[clamp(2.5rem,5.4vw,5rem)]">
          Build stronger agricultural <span className="avs-accent">systems</span>.
        </h2>
        <p className="avs-lead avs-reveal mt-6 max-w-[36rem] text-white/85">
          Partner with AgriVault Data to design and deploy the infrastructure behind agricultural operations, reporting
          and decision-making.
        </p>
        <div className="avs-reveal mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="avs-btn avs-btn-primary">
            Start a conversation <ArrowRight />
          </Link>
          <Link href="/how-we-work#engagement-models" className="avs-btn avs-btn-ghost">
            See engagement models
          </Link>
        </div>
      </div>
    </section>
  );
}
