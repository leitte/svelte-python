<script>
    import { onMount } from "svelte";

    let script = `import time
time.sleep(0)

a = 5 + 3
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
        pyodideWorker = new Worker("pyodide.worker.js");
        // what to do when the worker is finished
        pyodideWorker.onmessage = function (event) {
            const { id, ...data } = event.data;
            const onSuccess = callbacks[id].onSuccess;
            delete callbacks[id];
            callbacks = callbacks;
            onSuccess(data);
            result = data.result;
        };
        pyodideWorker.onerror = function (event) {
            const onReject = callbacks[id].onReject;
            delete callbacks[id];
            callbacks = callbacks;
            onReject(event)
            result = "Error";
        }
        workerAvailable = true;
        runPythonCode("");
    });

    let currentComputationPromise;

    async function runPythonCode(script) {
        currentComputationPromise = new Promise((onSuccess, onReject) => {
            id = (id + 1) % Number.MAX_SAFE_INTEGER;
            callbacks[id] = {onSuccess, onReject};
            pyodideWorker.postMessage({ script, id });
        });
    }
</script>

<div class="wrapper">
    <h1>Welcome to Svelte+Pyodide</h1>

<p>
    Enter python code in the text area below and press the 
    <span class="text-button">Run Python</span> button or use 
    <span class="text-button">shift</span> + <span class="text-button">enter</span> 
    on the keyboard. 
    This will run the python script using <a href="https://pyodide.org">pyodide</a>. The contents of 
    the variable <code>result</code> is returned to the website and displayed 
    once it's finished. 
</p>
    

    <textarea bind:value={script} 
        on:keydown={(event) => (event.keyCode == 13 && event.shiftKey) ? runPythonCode(script) : "" } 
        style="height: 100px"
    />

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
        {:catch error}
            <pre style:font-size="80%">{error.message}</pre>
        {/await}
        

        <span>Number of waiting scripts: {nCallbacks}</span>
        <!--
        <span>Current computation: {currentComputationPromise}</span>
        -->
    {:else}
        Waiting for python.
    {/if}
</div>


<div style:flex="1"></div>
<h3 style:margin-top="50px">Details</h3>
<p>

    The script is computed in a separate thread using <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers">Web Workers</a>.
    This means that heavy computations are done in the background and
    the website gets notified once the result is available. 
    We use two strategies for updates: 
    <a href="https://learn.svelte.dev/tutorial/dynamic-attributes">svelte's dynamic attributes</a> and
    <a href="https://learn.svelte.dev/tutorial/await-blocks">promises + await-blocks</a>. <br/>

    You can start
    multiple scripts and they will be computed one after the other. The 
    number of pending jobs is displayed below (Number of waiting scripts). Set 
    the sleep function in the python script to try this effect (time is measured in seconds).
</p>

<p>
    Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>

<style>
    .wrapper {
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-width: auto;
    }

    .text-button {
        border: 1px solid gray;
        border-radius: 3px;
        padding: 2px 5px;
    }
</style>