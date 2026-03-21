import type { ReactNode } from "react";
import "./PanelShell.css";

export type PanelShellVariant = "standard" | "chart" | "split";
export type PanelShellBodyMode = "fit" | "scroll" | "stretch";

type PanelShellProps = {
  badge: ReactNode;
  variant: PanelShellVariant;
  bodyMode: PanelShellBodyMode;
  children: ReactNode;
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PanelShell({
  badge,
  variant,
  bodyMode,
  children,
  title,
  meta,
  actions,
  className,
  bodyClassName,
}: PanelShellProps) {
  const hasCopy = title || meta;

  return (
    <section className={joinClasses("panel-shell", `panel-shell--${variant}`, className)}>
      <div className="panel-shell__header">
        <div className="panel-shell__headerMain">
          <span className="panel-shell__badge">{badge}</span>
          {hasCopy ? (
            <div className="panel-shell__copy">
              {title ? <div className="panel-shell__title">{title}</div> : null}
              {meta ? <div className="panel-shell__meta">{meta}</div> : null}
            </div>
          ) : null}
        </div>
        {actions ? <div className="panel-shell__actions">{actions}</div> : null}
      </div>
      <div className={joinClasses("panel-shell__body", `panel-shell__body--${bodyMode}`, bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
