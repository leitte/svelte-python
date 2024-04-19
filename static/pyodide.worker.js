importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
  //await self.pyodide.loadPackage(["numpy", "pytz"]);
}
let pyodideReadyPromise = loadPyodideAndPackages();

onmessage = async (event) => {
  // make sure loading is done
  await pyodideReadyPromise;

  console.log("inside worker");
  const { script, id } = event.data;
  console.log("scr", script)

  try {
    // we currently run all code in the same interpreter
    // i.e. it keeps all imports and variables from previous runs
    // to get rid of the global variables do the following
    // https://github.com/pyodide/pyodide/issues/703
    await self.pyodide.loadPackagesFromImports(script);
    self.pyodide.globals.set("result", "");
    let result = await self.pyodide.runPythonAsync(script);
    let resultTmp = self.pyodide.globals.get('result');
    if ( resultTmp ) {
      result = resultTmp.toJs({dict_converter : Object.fromEntries});
      resultTmp.destroy();
    }
    postMessage({result, id});
  } 
  catch(error) {
    console.log("got error in pyodide", error.message)
    postMessage({ error: error.message, id });
  }
};