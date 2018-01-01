/*
**  GemstoneJS -- Gemstone JavaScript Technology Stack
**  Copyright (c) 2016-2018 Gemstone Project <http://gemstonejs.com>
**  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
*/

const fs     = require("mz/fs")
const ducky  = require("ducky")
const extend = require("extend")
const jsYAML = require("js-yaml")

module.exports = () => {
    /*  default Gemstone configuration  */
    let cfg = {
        path: {
            output:   "./dst",
            source:   "./src",
            resource: "./res",
            main:     "index.js",
            icon:     ""
        },
        meta: {
            title:       "Example",
            description: "",
            author:      "",
            keywords:    ""
        },
        header: "",
        linting: {
            eslint: {},
            htmlhint: {},
            stylelint: {}
        },
        modules: {
            source: [],
            provide: [],
            replace: [],
            alias: [],
            rules: []
        },
        generator: {
            mask:  "<name>.html",
            style: "<name>.css",
            i18n:  "<name>.yaml",
            view:  "<name>.js",
            model: "<name>.js",
            ctrl:  "<name>.js"
        }
    }

    /*  validate a Gemstone configuration chunk  */
    const validate = (filename, chunk) => {
        let errors = []
        if (!ducky.validate(chunk, `{
            path?: {
                output?: string,
                source?: string,
                resource?: string,
                main?:   string,
                icon?:   string
            },
            meta?: {
                title?:       string,
                description?: string,
                author?:      string,
                keywords?:    string
            },
            header?: string,
            linting?: {
                eslint?: object,
                htmlhint?: object,
                stylelint?: object
            },
            modules?: {
                source?: [
                    string*
                ],
                provide?: [
                    { name: string, require: string }*
                ],
                replace?: [
                    { match: string, replace: (string | [ [ string, string ]* ] ) }*
                ],
                alias?: [
                    { from: string, to: string }*
                ],
                rules?: [
                    { test: string, use: object }*
                ]
            },
            generator?: {
                mask?:  string,
                style?: string,
                i18n?:  string,
                view?:  string,
                model?: string,
                ctrl?:  string
            }
        }`, errors))
            throw new Error(`invalid Gemstone configuration chunk in "${filename}": ${errors.join("; ")}`)
    }

    /*  try to load Gemstone configuration chunks from YAML files  */
    let filenames = [ "gemstone.yaml", ".gemstone.yaml" ]
    filenames.forEach((filename) => {
        if (fs.existsSync(filename)) {
            let chunk
            try {
                chunk = jsYAML.safeLoad(fs.readFileSync(filename, "utf8"))
            }
            catch (ex) {
                process.stderr.write(`gemstone-config ERROR: failed to parse YAML file "${filename}":\n`)
                process.stderr.write(`${ex.message}\n`)
                process.exit(1)
            }
            validate(filename, chunk)
            extend(true, cfg, chunk)
        }
    })

    /*  try to load Gemstone configuration chunks from JSON files  */
    filenames = [ "gemstone.json", ".gemstone.json" ]
    filenames.forEach((filename) => {
        if (fs.existsSync(filename)) {
            let chunk
            try {
                chunk = JSON.parse(fs.readFileSync(filename, "utf8"))
            }
            catch (ex) {
                process.stderr.write(`gemstone-config ERROR: failed to parse JSON file "${filename}":\n`)
                process.stderr.write(`${ex.message}\n`)
                process.exit(1)
            }
            validate(filename, chunk)
            extend(true, cfg, chunk)
        }
    })

    /*  try to load Gemstone configuration chunks from NPM files  */
    let filename = "package.json"
    if (fs.existsSync(filename)) {
        let chunk
        try {
            chunk = JSON.parse(fs.readFileSync(filename, "utf8"))
        }
        catch (ex) {
            process.stderr.write(`gemstone-config ERROR: failed to parse JSON file "${filename}":\n`)
            process.stderr.write(`${ex.message}\n`)
            process.exit(1)
        }
        if (typeof chunk.gemstone === "object") {
            validate(filename, chunk.gemstone)
            extend(true, cfg, chunk.gemstone)
        }
    }

    /*  post-adjust header  */
    cfg.header = cfg.header
        .replace(/[ \t]+$/mg, "")
        .replace(/^(?:\r?\n)+/, "")
        .replace(/(?:\r?\n)+$/, "").replace(/$/, "\n")
        .replace(/^/mg, "    ").replace(/\n *$/, "\n")
        .replace(/[ \t]+$/mg, "")

    return cfg
}

