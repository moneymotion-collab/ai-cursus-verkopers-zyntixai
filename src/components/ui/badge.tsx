import styles from "./badge.module.css";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  children: string;
  variant?: BadgeVariant;
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
