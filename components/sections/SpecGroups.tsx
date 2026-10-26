"use client";
import { useEffect, useState } from "react";
import { REVISAO, specs } from "@/lib/content";
import s from "./Specs.module.css";

/** Grupos da ficha. No celular viram uma sanfona (só "Medição" aberta); no desktop ficam todos à vista. */
export default function SpecGroups() {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState("Medição");
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return (
    <div className={s.groups}>
      {specs.map((g) => {
        const shown = !mobile || open === g.group;
        const id = `ficha-${g.group.toLowerCase().replace(/[^a-z]+/g, "-")}`;
        return (
          <div key={g.group} className={s.group}>
            <h3>
              {mobile ? (
                <button
                  type="button"
                  className={s.toggle}
                  aria-expanded={shown}
                  aria-controls={id}
                  onClick={() => setOpen(shown ? "" : g.group)}
                >
                  {g.group}
                </button>
              ) : (
                g.group
              )}
            </h3>
            <dl id={id} hidden={!shown}>
              {g.rows.map((row) => {
                const [label, value, tbc] = row as readonly [string, string, boolean?];
                // Na produção, só o que a DANX já confirmou
                if (tbc && !REVISAO) return null;
                return (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      {value}
                      {tbc && <span className="tbc">A confirmar</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
