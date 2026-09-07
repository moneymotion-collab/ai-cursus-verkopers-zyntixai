import type { HTMLAttributes } from "react";
import styles from "./surface.module.css";

export type SurfaceProps = HTMLAttributes<HTMLDivElement>;

export function Surface({ className, ...props }: SurfaceProps) {
  const classes = [styles.surface, className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
}
