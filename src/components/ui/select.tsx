import { forwardRef, type SelectHTMLAttributes } from "react";
import styles from "./form-controls.module.css";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...props }, ref) {
    const classes = [styles.control, className].filter(Boolean).join(" ");
    return (
      <select ref={ref} className={classes} {...props}>
        {children}
      </select>
    );
  },
);
