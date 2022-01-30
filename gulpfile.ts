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

const BASE_NODE_NAME = 'vban-';
const BUILD_DIRECTORY = 'build';
const SRC_DIRECTORY = 'src';

const rootPath = path.resolve(__dirname);
const packageJsonPath = path.join(rootPath, 'package.json');
const srcDirectoryPath = path.join(rootPath, SRC_DIRECTORY);
const NODE_NAME_REG = '[a-z][a-z0-9\\-]';

let pkg: { name: string; 'node-red'?: { nodes?: Record<string, string>; [key: string]: unknown } };
try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath).toString());
} catch (e) {
    throw new Error(`fail to read ${packageJsonPath}`);
}

const _transpile = async (prod = false) => {
    let tmpDir: string;
    try {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), pkg.name));
    } catch (e) {
        if (process.env.CI) {
            //if fail in a CI (like GitHub actions)
            tmpDir = path.join(rootPath, 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir);
            }
        } else {
            throw e;
        }
    }

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
        build = build.pipe(tsProject()).pipe(gulp.dest(BUILD_DIRECTORY));
    } else {
        build = build
            .pipe(sourcemaps.init())
            .pipe(tsProject())
            .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: './' }))
            .pipe(gulp.dest(BUILD_DIRECTORY));
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
        rimraf(BUILD_DIRECTORY, (err) => {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
};

export const createNode = async () => {
    if (process.argv[2] != 'createNode') {
        throw new Error('please use "gulp createNode -n=my-new-node');
    }

    const nodeName = (process.argv[3] || '').slice(3);
    if (!nodeName) {
        throw new Error('please use "gulp createNode -n=my-new-node');
    }
    if (!nodeName.match(new RegExp(`^${NODE_NAME_REG}+$`))) {
        throw new Error(`please use kebab-case for the name of your node : my-new-node . You passed ${nodeName}`);
    }

    const kebabCase = BASE_NODE_NAME + nodeName;
    const camelCase = nodeName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
        .join('');

    //check node files
    const templateBasePath = path.join(rootPath, '.github', 'gulp-templates', 'new-node');
    const templateNodesFiles = [
        { file: 'name.ts.template', destination: 'nodes' },
        { file: 'name.html.template', destination: 'nodes' },
        { file: 'TNameNode.ts.template', destination: 'types' },
        { file: 'TNameNodeConfig.ts.template', destination: 'types' }
    ].map((f) => ({
        file: path.join(templateBasePath, f.file),
        destination: path.join(srcDirectoryPath, f.destination)
    }));

    templateNodesFiles.forEach(({ file }) => {
        if (!fs.existsSync(file)) {
            throw new Error(`file ${file} is missing`)!;
        }
    });

    const files = templateNodesFiles.map<{ filename: string; filePath: string; content: string }>(({ file, destination }) => {
        let content = fs.readFileSync(file).toString();
        content = content.replace(/@@CAMEL_NODE_NAME/g, camelCase).replace(/@@KEBAB_NODE_NAME/g, kebabCase);

        // get filename
        const filename = path
            .basename(file)
            .replace(/name/i, camelCase.charAt(0).toUpperCase() + camelCase.slice(1))
            .replace(/\.template$/, '');
        const filePath = path.join(destination, filename);

        return {
            filename,
            filePath,
            content
        };
    });

    //check if filePath already exist, else write it
    files.map((file) => {
        if (fs.existsSync(file.filePath)) {
            throw new Error(`${file.filePath} already exist, maybe this node name is already used ?`);
        }

        // console.log('write', file.content, 'to', file.filePath);
        fs.writeFileSync(file.filePath, file.content);
    });
};

export const transpile = async () => _transpile(false);
export const transpileProd = async () => _transpile(true);

export const movePublic = () => {
    return gulp
        .src(`${SRC_DIRECTORY}/**/*.html`)
        .pipe(gulp.src(`${SRC_DIRECTORY}/**/icons/**`))
        .pipe(gulp.dest(BUILD_DIRECTORY));
};

export const nameNodes = async () => {
    //first search for the js file in the <build folder>/nodes
    const files = glob.sync(`${BUILD_DIRECTORY}/nodes/*.js`, {
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
            const res = new RegExp(`const\\s*NODE_NAME\\s*=\\s*['"\`](${NODE_NAME_REG}+)['"\`]`, 'gm').exec(
                fs.readFileSync(jsPath).toString() || ''
            );
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
