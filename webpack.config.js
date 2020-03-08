var path = require('path');

module.exports = {
    entry: "./src/main.ts",
    output: {
        filename: "main.js",
        path: __dirname + "/dist"
    },

    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        inline: true,
        liveReload: true,
        port: 9000
    },

    devtool: "source-map",

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader"
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    }
};
