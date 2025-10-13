import { useEffect } from "react";

export function useHotKeys(keys: { key: string; callback: () => void }[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = keys.find((k) => k.key === event.key);

      if (key) {
        key.callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keys]);
}
