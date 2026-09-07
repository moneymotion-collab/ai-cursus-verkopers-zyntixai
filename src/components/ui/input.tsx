import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./form-controls.module.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    const classes = [styles.control, className].filter(Boolean).join(" ");
    return <input ref={ref} className={classes} {...props} />;
  },
);
