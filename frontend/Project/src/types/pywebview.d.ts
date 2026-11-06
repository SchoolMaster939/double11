declare global {
    interface Window{
        pywebview: {
            api: {
                get_base_url: () => Promise<string>;
            }
        }
    }

    interface WindowEventMap {
        pywebviewready: Event;
    }
}

export {};
