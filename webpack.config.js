const Path = require("path");

module.exports = {
    mode: "production",
    entry: {
        index: './src/index.tsx'
    },
    output: {
        path: Path.resolve(__dirname, 'dist'),
        filename: "[name].js",
        libraryTarget: "commonjs2"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules)/,
                use: 'ts-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx', '.mjs'],
    }
}