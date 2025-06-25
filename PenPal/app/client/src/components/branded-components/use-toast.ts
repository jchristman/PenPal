// Inspired by react-hot-toast library
import * as React from "react";
import { registerHook } from "../../penpal/client";

import type { ToastActionElement, ToastProps } from "./toast";

const TOAST_LIMIT = 5;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const _actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof _actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

// Re-add toastTimeouts map
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: ((state: State) => void)[] = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Re-add duration to Toast type
type Toast = Omit<ToasterToast, "id"> & { duration?: number };

// Re-add duration parameter and default
function toast({ duration = 5000, ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  // Restore simple dismiss function definition here
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Re-add setTimeout logic
  const timeout = setTimeout(() => {
    dismiss();
  }, duration);
  toastTimeouts.set(id, timeout);

  return {
    id: id,
    // Re-add timeout clearing to returned dismiss
    dismiss: () => {
      clearTimeout(toastTimeouts.get(id));
      toastTimeouts.delete(id);
      dismiss();
    },
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    // Re-add timeout clearing logic to hook's dismiss function
    dismiss: (toastId?: string) => {
      if (toastId) {
        const timeout = toastTimeouts.get(toastId);
        if (timeout) {
          clearTimeout(timeout);
          toastTimeouts.delete(toastId);
        }
      } else {
        // Clear all timeouts if no ID is provided
        toastTimeouts.forEach((timeout) => clearTimeout(timeout));
        toastTimeouts.clear();
      }
      dispatch({ type: "DISMISS_TOAST", toastId });
    },
  };
}

export { useToast, toast };

registerHook("useToast", useToast);
registerHook("toast", toast);
