const { storage, runtime } = chrome;

storage.local.get('updateHint', ({ updateHint }) => {
    const { version } = runtime.getManifest();
    const { hash } = new URL(window.location.href);

    if (hash !== '#changelog') {
        return;
    }

    if (updateHint.visible && updateHint.version === version) {
        storage.local.set({
            updateHint: {
                ...updateHint,
                visible: false
            }
        });
        console.log(`Update hint for version ${version} has been hidden.`)
    }
});