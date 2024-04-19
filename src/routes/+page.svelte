<script>
    import { onMount } from "svelte";

    let script = `import time
    a = 5 + 3
    time.sleep(0)
    result = {'a': a}
    `;

    let pyodideWorker;
    let workerAvailable = false;

    let result = "Waiting for pyodide to init.";
    let callbacks = {};
    let nCallbacks = 0;
    $: nCallbacks = Object.keys(callbacks).length;
    let id = 0;

    onMount(async () => {
        //pyodideWorker = new MyWorker();
        pyodideWorker = new Worker("pyodide.worker.js");
        // what to do when the worker is finished
        pyodideWorker.onmessage = function (event) {
            const { id, ...data } = event.data;
            const onSuccess = callbacks[id];
            delete callbacks[id];
            callbacks = callbacks;
            onSuccess(data);
            result = data.result;
            console.log("result", result);
        };
        workerAvailable = true;
        runPythonCode("");
    });

    let currentComputationPromise;

    async function runPythonCode(script) {
        currentComputationPromise = new Promise((onSuccess) => {
            id = (id + 1) % Number.MAX_SAFE_INTEGER;
            callbacks[id] = onSuccess;
            pyodideWorker.postMessage({ script, id });
        });
    }
</script>

<h1>Welcome to Svelte+Pyodide</h1>

<div class="wrapper">
    <textarea bind:value={script} style="height: 100px"/>

    {#if workerAvailable}
        We are set up! 
        
        {#if result}
            <span>Stored result: {(typeof result === 'object') ? JSON.stringify(result): result}</span>
        {:else}
            <span>No result available.</span>
        {/if}

        <button on:click={() => runPythonCode(script)}>Run Python</button>

        {#await currentComputationPromise}
            Running python code...
        {:then currResult} 
            Result from promise: {(typeof currResult.result === 'object') ? JSON.stringify(currResult.result): currResult.result}
        {/await}
        

        <span>Number of waiting scripts: {nCallbacks}</span>
        <span>Current computation: {currentComputationPromise}</span>
    {:else}
        Waiting for python.
    {/if}
</div>

<p>
    Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>

<style>
    .wrapper {
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-width: 40rem;
    }
</style>