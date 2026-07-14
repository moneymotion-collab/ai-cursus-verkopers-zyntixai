import styles from "./alert.module.css";

type AlertVariant = "info" | "warning" | "error";

type AlertProps = {
  title: string;
  children?: string;
  variant?: AlertVariant;
};

export function Alert({ title, children, variant = "info" }: AlertProps) {
  return (
    <div
      className={`${styles.alert} ${styles[variant]}`}
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <p className={styles.title}>{title}</p>
      {children ? <p className={styles.body}>{children}</p> : null}
    </div>
  );
}
