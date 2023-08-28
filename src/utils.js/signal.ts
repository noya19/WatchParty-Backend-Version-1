export function createSignal<T>(v: T) {
    let val = v;

    return [
        () => val,
        (v: T) => val = v
    ] as const;
}