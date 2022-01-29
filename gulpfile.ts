import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as sourcemaps from 'gulp-sourcemaps';
// @ts-ignore
import rimraf from 'rimraf';
// @ts-ignore
import glob from 'glob';
import { Stream } from 'stream';

const buildDirectory = 'build';
const srcDirectory = 'src';

const rootPath = path.resolve(__dirname);
let pkg: { name: string; 'node-red'?: { nodes?: Record<string, string>; [key: string]: unknown } };
const packageJsonPath = path.join(rootPath, 'package.json');
try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath).toString());
} catch (e) {
    throw new Error(`fail to read ${packageJsonPath}`);
}

const _transpile = async (prod = false) => {
    let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), pkg.name));
    const tsProject = ts.createProject(`tsconfig${prod ? '.build' : ''}.json`, { outDir: tmpDir });

    let build: Stream = tsProject.src();
    build.once('finish', () => {
        try {
            if (tmpDir) {
                fs.rmSync(tmpDir, { recursive: true });
            }
        } catch (e) {
            console.error(`An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`);
        }
    });
    if (prod) {
        build = build.pipe(tsProject()).pipe(gulp.dest(buildDirectory));
    } else {
        build = build
            .pipe(sourcemaps.init())
            .pipe(tsProject())
            .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: './' }))
            .pipe(gulp.dest(buildDirectory));
    }
    return new Promise((resolve, reject) => {
        build.once('error', (e) => reject(e));
        build.once('finish', () => {
            resolve(build);
        });
    });
};

export const clean = async () => {
    return new Promise<void>((resolve, reject) => {
        rimraf(buildDirectory, (err) => {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
};

export const transpile = async () => _transpile(false);
export const transpileProd = async () => _transpile(true);

export const movePublic = () => {
    return gulp
        .src(`${srcDirectory}/**/*.html`)
        .pipe(gulp.src(`${srcDirectory}/**/icons/**`))
        .pipe(gulp.dest(buildDirectory));
};

export const nameNodes = async () => {
    //first search for the js file in the <build folder>/nodes
    const files = glob.sync(`${buildDirectory}/nodes/*.js`, {
        cwd: rootPath
    }) as Array<string>;
    const nodes = await Promise.all<{ jsPath: string; htmlPath: string; nodeName: string }>(
        files.map(async (file) => {
            const jsPath = path.join(rootPath, file);

            //validate html is near
            const htmlPath = jsPath.replace(/\.js$/, '.html');
            if (!fs.existsSync(htmlPath)) {
                throw new Error(`${htmlPath} seems missing`);
            }

            //search node-name in js
            const res = /const\s*NODE_NAME\s*=\s*['"`]([a-zAZ0-9\-_]+)['"`]/gm.exec(fs.readFileSync(jsPath).toString() || '');
            if (!res) {
                throw new Error(
                    `fail to found the string containing the NODE_NAME on ${jsPath}. Searched for :
 const NODE_NAME = 'node_name'`
                );
            }

            const nodeName = res[1];
            if (!nodeName) {
                throw new Error('fail to extract NODE_NAME');
            }

            //then start to replace NODE_NAME process per file
            fs.writeFileSync(
                htmlPath,
                fs
                    .readFileSync(htmlPath)
                    .toString()
                    .replace(/@@NODE_NAME/g, nodeName)
            );

            return {
                jsPath,
                htmlPath,
                nodeName
            };
        })
    );

    //prepare package.json node-red object
    pkg['node-red'] = {
        ...pkg['node-red'],
        nodes: {}
    };

    //prepare nodes object
    nodes.forEach((node) => {
        if (!pkg['node-red'] || !pkg['node-red'].nodes) {
            //in theory nodes is initialized just before
            throw new Error('unknown error');
        }

        //check duplicate
        if (pkg['node-red'].nodes[node.nodeName]) {
            throw new Error(`it seems the NODE_NAME ${node.nodeName} is already used by the file ${pkg['node-red'].nodes[node.nodeName]}`);
        } else {
            // get relative path + force posix separator
            pkg['node-red'].nodes[node.nodeName] = path.relative(rootPath, node.jsPath).split(path.sep).join(path.posix.sep);
        }
    });

    //save package.json
    // @ts-ignore + force new line to match npm/yarn process
    const pkgStr = JSON.stringify(pkg, ' ', 2) + '\n';

    fs.writeFileSync(packageJsonPath, pkgStr);
};

export const debug = gulp.series([clean, transpile, movePublic, nameNodes]);
export const prod = gulp.series([clean, transpileProd, movePublic, nameNodes]);
export default prod;
