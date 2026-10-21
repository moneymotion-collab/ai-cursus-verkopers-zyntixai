import {
  cloneElement,
  type AriaAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import styles from "./form-field.module.css";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
};

export type FormMessageProps = HTMLAttributes<HTMLParagraphElement> & {
  tone?: "helper" | "error";
};

export function FormMessage({
  className,
  tone = "helper",
  ...props
}: FormMessageProps) {
  const classes = [styles.message, styles[tone], className]
    .filter(Boolean)
    .join(" ");
  return <p className={classes} {...props} />;
}

export type FormFieldProps = {
  id: string;
  label: ReactNode;
  optional?: boolean;
  helperText?: ReactNode;
  error?: ReactNode;
  children: ReactElement<FieldControlProps>;
  className?: string;
};

export function FormField({
  id,
  label,
  optional = false,
  helperText,
  error,
  children,
  className,
}: FormFieldProps) {
  const helperId = helperText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [
    children.props["aria-describedby"],
    helperId,
    errorId,
  ]
    .filter(Boolean)
    .join(" ") || undefined;
  const classes = [styles.field, className].filter(Boolean).join(" ");

  const control = cloneElement(children, {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  });

  return (
    <div className={classes}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional ? <span className={styles.optional}> (optional)</span> : null}
      </label>
      {control}
      {helperText ? <FormMessage id={helperId}>{helperText}</FormMessage> : null}
      {error ? (
        <FormMessage id={errorId} tone="error">
          {error}
        </FormMessage>
      ) : null}
    </div>
  );
}
