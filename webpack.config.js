module.exports = {
    entry: './client/ts/chat.ts',
    mode: 'development',
    output: {
        filename: './public/js/chat.js'
    },

    devtool: 'source-map',

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },

    module: {
        rules: [
            {
                test: /\.(tsx|ts)?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {configFile: "tsconfig-client.json"}
                    }
                ],
                exclude: "/node_modules/"
            },
            {
                test: /\.less?$/, use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                    },
                    {
                        loader: "less-loader",
                        options: {
                            lessOptions: {
                                strictMath: true,
                            },
                        },
                    },
                ]
            }
        ]
    }
};