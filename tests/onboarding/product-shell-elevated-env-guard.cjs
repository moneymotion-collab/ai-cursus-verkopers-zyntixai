"use strict";

const ELEVATED_ENV_NAMES = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SERVICE_ROLE_KEY",
]);

function decodeJwtPayload(value) {
  const parts = String(value).split(".");
  if (parts.length !== 3) {
    return null;
  }
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

function isServiceRoleJwt(value) {
  const payload = decodeJwtPayload(value);
  return Boolean(payload && payload.role === "service_role");
}

function isElevatedCredential(name, value) {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (ELEVATED_ENV_NAMES.has(name) || /SERVICE_ROLE/i.test(name)) {
    return true;
  }
  return isServiceRoleJwt(trimmed);
}

function inspectApplicationEnv(env) {
  const source = env && typeof env === "object" ? env : {};
  for (const [name, value] of Object.entries(source)) {
    if (isElevatedCredential(name, value)) {
      return { ok: false, reason: "elevated_credential_rejected" };
    }
  }
  return { ok: true };
}

function installAccessors(env, onReject) {
  for (const name of ELEVATED_ENV_NAMES) {
    const current = typeof env[name] === "string" ? env[name] : "";
    Object.defineProperty(env, name, {
      configurable: true,
      enumerable: true,
      get() {
        return current;
      },
      set(next) {
        if (isElevatedCredential(name, next)) {
          onReject({ ok: false, reason: "elevated_credential_rejected" });
        }
      },
    });
  }
}

function installProcessEnvProxy(onReject) {
  const target = process.env;
  process.env = new Proxy(target, {
    set(receiver, prop, value) {
      const name = String(prop);
      if (isElevatedCredential(name, value)) {
        onReject({ ok: false, reason: "elevated_credential_rejected" });
        return true;
      }
      receiver[prop] = value;
      return true;
    },
    defineProperty(receiver, prop, descriptor) {
      const value =
        descriptor && Object.prototype.hasOwnProperty.call(descriptor, "value")
          ? descriptor.value
          : undefined;
      const name = String(prop);
      if (isElevatedCredential(name, value)) {
        onReject({ ok: false, reason: "elevated_credential_rejected" });
        return true;
      }
      return Reflect.defineProperty(receiver, prop, descriptor);
    },
  });
}

function installApplicationEnvGuard(envObject, options) {
  const env = envObject && typeof envObject === "object" ? envObject : process.env;
  const onReject =
    options && typeof options.onReject === "function"
      ? options.onReject
      : function defaultReject() {
          console.error("P1D_R1_ELEVATED_CREDENTIAL_REJECTED");
          process.exit(92);
        };

  const initial = inspectApplicationEnv(env);
  if (!initial.ok) {
    onReject(initial);
    return initial;
  }

  if (env === process.env) {
    try {
      installProcessEnvProxy(onReject);
    } catch {
      // process.env cannot be proxied on this runtime; initial inspect still holds.
    }
  } else {
    installAccessors(env, onReject);
  }

  return { ok: true };
}

module.exports = {
  inspectApplicationEnv,
  installApplicationEnvGuard,
  isElevatedCredential,
};

if (process.env.P1D_R1_ENV_GUARD === "1") {
  installApplicationEnvGuard(process.env);
}
