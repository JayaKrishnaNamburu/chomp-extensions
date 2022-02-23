Chomp.addExtension('./npm.js');

Chomp.registerTemplate('svelte', function ({ name, targets, deps, env, templateOptions: { svelteConfig = null, sourceMaps = true, autoInstall, ...invalid } }) {
  if (Object.keys(invalid).length)
    throw new Error(`Invalid svelte template option "${Object.keys(invalid)[0]}"`);
  return [{
    name,
    targets,
    deps: [...deps, ...ENV.CHOMP_EJECT ? ['npm:install'] : ['node_modules/svelte', 'node_modules/mkdirp']],
    env,
    engine: 'node',
    run: `    import { readFile, writeFile } from 'fs/promises';
      import { compile } from 'svelte/compiler';
      import mkdirp from 'mkdirp';
      import { dirname } from 'path';

      let config;
      ${svelteConfig ? `
        config = await import(${svelteConfig === true ? '"./svelte.config.js"' : svelteConfig});
      ` : `
        config = {
          css: false
        };
      `}
      config.filename = process.env.TARGET;

      const source = await readFile(process.env.DEP, 'utf-8');
      const result = compile(source, config);

      mkdirp.sync(dirname(process.env.TARGET));
      const cssFile = process.env.TARGET.replace(/\\.js$/, ".css");
      await Promise.all[
        writeFile(process.env.TARGET, result.js.code),
        writeFile(cssFile, result.css.code)${sourceMaps ? `,
        writeFile(process.env.TARGET + ".map", JSON.stringify(result.js.map)),
        writeFile(cssFile + ".map", JSON.stringify(result.css.map))` : ''}
      ];
    `
  }, ...ENV.CHOMP_EJECT ? [] : [{
    template: 'npm',
    templateOptions: {
      autoInstall,
      packages: ['svelte@3', 'mkdirp'],
      dev: true
    }
  }]];
});
